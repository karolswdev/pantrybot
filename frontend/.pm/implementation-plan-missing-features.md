# Implementation Plan: Missing Features & Test Fixes

## Executive Summary

After deep analysis, the infrastructure for most missing features **already exists** but has integration issues:

| Component | Status | Issue |
|-----------|--------|-------|
| Test Reset Endpoint | ⚠️ Exists but broken | Uses old in-memory db, not Prisma |
| Socket.IO (Backend) | ✅ Fully implemented | Broadcasting works |
| SignalR (Frontend) | ⚠️ Configured | Doesn't connect to Socket.IO backend |
| Mobile Tab Bar | ✅ Working | Test selector mismatch |
| Notification Settings | ✅ UI complete | Works after reset-db fix |
| Telegram Linking | ✅ UI complete | Works after reset-db fix |

**Estimated Total Effort: 4-6 hours** (not days as initially thought)

---

## Phase 1: Test Infrastructure Fix (30-60 mins)

### 1.1 Fix reset-db.js to use Prisma

**Current Problem:**
```javascript
// reset-db.js uses old in-memory arrays
db.users.length = 0;
db.households.length = 0;
// ... but actual data is in PostgreSQL via Prisma!
```

**Solution:**
```javascript
// Updated reset-db.js using Prisma
const { prisma } = require('./repositories');

async function resetDatabase() {
  // Truncate all tables in correct order (respecting foreign keys)
  await prisma.$transaction([
    prisma.shoppingListItem.deleteMany(),
    prisma.shoppingList.deleteMany(),
    prisma.itemHistory.deleteMany(),
    prisma.inventoryItem.deleteMany(),
    prisma.invitation.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.notificationPreference.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.householdMember.deleteMany(),
    prisma.household.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  return { success: true, message: 'Database reset successfully' };
}
```

**Files to modify:**
- `backend/reset-db.js`
- `backend/testRoutes.js` (make async)

**Tests unblocked:** InventorySync, NotificationSettings, TelegramLink (3 specs)

---

### 1.2 Fix MobileLayout Test Selector

**Current Problem:**
Test expects `nav[class*="fixed bottom-0"]` to contain text "Home", "Inventory", etc.
The Add button doesn't render visible text, only an icon.

**Solution Options:**

**Option A: Fix the test selector** (Recommended)
```typescript
// Instead of checking all 5 as links/buttons with text
cy.get('nav[class*="fixed bottom-0"]').within(() => {
  cy.contains('Home').should('be.visible');
  cy.contains('Inventory').should('be.visible');
  cy.get('button[aria-label="Add"]').should('be.visible'); // Add button has no text
  cy.contains('Shopping').should('be.visible');
  cy.contains('Settings').should('be.visible');
});
```

**Option B: Add visible text to Add button** (Changes UI)

**Files to modify:**
- `cypress/e2e/MobileLayout.cy.ts`

**Tests unblocked:** MobileLayout (1 spec)

---

## Phase 2: Real-time Sync Integration (1-2 hours)

### Current State Analysis

**Backend (Socket.IO):**
- ✅ Server initialized in `index.js`
- ✅ Authentication middleware working
- ✅ Room-based broadcasting per household
- ✅ `broadcastToHousehold()` function exported
- ✅ `io` instance passed to inventory and shopping routes

**Frontend (SignalR):**
- ⚠️ SignalR service configured in `lib/realtime/signalr-service.ts`
- ⚠️ SignalR is Microsoft's library, different from Socket.IO
- ⚠️ Won't connect to Socket.IO backend without adaptation

### Solution: Replace SignalR with Socket.IO Client

**Why Socket.IO over SignalR:**
1. Backend already uses Socket.IO
2. Socket.IO is simpler, no .NET hub needed
3. Same API surface (rooms, events)
4. Smaller bundle size

**Implementation Steps:**

```bash
# Install Socket.IO client
cd frontend
npm install socket.io-client
```

**Create new service: `lib/realtime/socket-service.ts`**
```typescript
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private eventHandlers: Map<string, Set<(data: any) => void>> = new Map();

  connect(token: string, householdId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.socket?.emit('set-household', householdId);
        resolve();
      });

      this.socket.on('connect_error', reject);

      // Forward all events to registered handlers
      ['item.added', 'item.updated', 'item.deleted',
       'list.item.added', 'list.item.updated'].forEach(event => {
        this.socket?.on(event, (data) => {
          this.eventHandlers.get(event)?.forEach(handler => handler(data));
        });
      });
    });
  }

  on(event: string, handler: (data: any) => void) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: (data: any) => void) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();
```

**Update InventoryPage.tsx:**
- Replace `signalRService` import with `socketService`
- Same API, minimal changes

**Files to create/modify:**
- `lib/realtime/socket-service.ts` (new)
- `app/inventory/InventoryPage.tsx` (update import)
- `app/shopping/[listId]/page.tsx` (update import)
- Remove or deprecate `lib/realtime/signalr-service.ts`

**Tests unblocked:** InventorySync, ShoppingListDetail WebSocket test

---

## Phase 3: Ensure Backend Broadcasts Events (30 mins)

### Verify Broadcasting in Routes

**Check inventoryRoutes.js has broadcasts:**
```javascript
// After creating item
req.io.to(`household-${householdId}`).emit('item.added', {
  type: 'item.added',
  householdId,
  payload: { item: newItem }
});

// After updating item
req.io.to(`household-${householdId}`).emit('item.updated', {
  type: 'item.updated',
  householdId,
  payload: { itemId, item: updatedItem }
});

// After deleting item
req.io.to(`household-${householdId}`).emit('item.deleted', {
  type: 'item.deleted',
  householdId,
  payload: { itemId }
});
```

**Check shoppingListRoutes.js has broadcasts:**
```javascript
// After adding item to list
req.io.to(`household-${householdId}`).emit('list.item.added', { ... });

// After updating item (completed, etc.)
req.io.to(`household-${householdId}`).emit('list.item.updated', { ... });
```

---

## Phase 4: Cleanup (15 mins)

### Delete Duplicate Test Files
```bash
rm cypress/e2e/SimpleSignup.cy.ts  # Duplicate of SignUp.cy.ts
rm cypress/e2e/TestSignUp.cy.ts   # Duplicate test file
```

### Fix ShoppingListDetail Test
The WebSocket test may need adjustment based on actual event names.

---

## Implementation Order

| Step | Task | Time | Unblocks |
|------|------|------|----------|
| 1 | Fix reset-db.js to use Prisma | 20 min | 3 specs |
| 2 | Fix MobileLayout test selector | 10 min | 1 spec |
| 3 | Create socket-service.ts | 30 min | - |
| 4 | Update InventoryPage to use socket | 15 min | 1 spec |
| 5 | Verify backend broadcasts | 20 min | - |
| 6 | Update ShoppingListDetail to use socket | 15 min | 1 spec |
| 7 | Delete duplicate tests | 5 min | 2 specs |
| 8 | Run full test suite | 10 min | Validation |

**Total: ~2 hours**

---

## Expected Final Results

| Before | After |
|--------|-------|
| 58/70 passing (83%) | 65-68/70 passing (93-97%) |
| 7 specs failing | 0-2 specs failing |

**Remaining after implementation:**
- Notifications.cy.ts (4 skipped) - Feature not fully implemented
- Any edge cases in real-time sync

---

## Future Enhancements (Not Required for Tests)

1. **Email Notifications**
   - SendGrid integration
   - Daily digest scheduler
   - Template system

2. **Telegram Bot**
   - BotFather setup
   - /start, /link commands
   - Verification flow
   - Webhook handling

3. **Push Notifications**
   - Service worker updates
   - Web Push API
   - Subscription management

These are user-facing features but not blocking E2E tests.
