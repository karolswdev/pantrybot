# User Stories and Acceptance Criteria

## Epic: User Management

### US-001: User Registration
**As a** new user  
**I want to** register for an account  
**So that** I can start managing my household inventory

**Acceptance Criteria:**
- Given I am on the registration page
- When I provide a valid email and password
- Then my account is created and I receive a welcome email
- And I am automatically logged in
- And a default household is created for me

**Technical Notes:**
- Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number
- Email must be validated for format and uniqueness
- JWT token issued upon successful registration

---

### US-002: User Login
**As a** registered user  
**I want to** log into my account  
**So that** I can access my household inventory

**Acceptance Criteria:**
- Given I have a registered account
- When I enter my email and password
- Then I am authenticated and redirected to my default household
- And a JWT token is stored for session management
- And I see my household dashboard

---

### US-003: Password Reset
**As a** user who forgot my password  
**I want to** reset my password via email  
**So that** I can regain access to my account

**Acceptance Criteria:**
- Given I click "Forgot Password"
- When I enter my registered email
- Then I receive a password reset link within 2 minutes
- And the link is valid for 1 hour
- And I can set a new password using the link

---

## Epic: Household Management

### US-004: Create Household
**As a** logged-in user  
**I want to** create a new household  
**So that** I can manage separate inventories

**Acceptance Criteria:**
- Given I am logged in
- When I create a new household with name and description
- Then the household is created with me as admin
- And I can switch between my households
- And each household has its own inventory

---

### US-005: Invite Household Members
**As a** household admin  
**I want to** invite others to join my household  
**So that** we can collaborate on inventory management

**Acceptance Criteria:**
- Given I am a household admin
- When I invite someone via email with a specific role
- Then they receive an invitation email
- And they can accept and join the household
- And they have the assigned role permissions

**Role Permissions:**
- Admin: Full access including member management
- Member: Can add/edit/delete items
- Viewer: Read-only access

---

## Epic: Inventory Management

### US-006: Add Inventory Item
**As a** household member  
**I want to** add items to our inventory  
**So that** we can track what food we have

**Acceptance Criteria:**
- Given I have member or admin role
- When I add an item with required fields (name, quantity, location)
- And optional fields (expiration date, category, notes)
- Then the item appears in the household inventory
- And other household members see it immediately
- And an activity log entry is created

**Required Fields:**
- Name (text, max 100 chars)
- Quantity (number with unit)
- Location (fridge/freezer/pantry)

**Optional Fields:**
- Expiration date
- Best before date
- Category
- Purchase date
- Price
- Notes

---

### US-007: Edit Inventory Item
**As a** household member  
**I want to** edit item details  
**So that** I can correct mistakes or update information

**Acceptance Criteria:**
- Given I have member or admin role
- When I edit an item's details
- Then the changes are saved
- And other members see updates in real-time
- And the activity log shows who made changes

---

### US-008: Mark Item as Consumed
**As a** household member  
**I want to** mark items as consumed  
**So that** we track what we've used

**Acceptance Criteria:**
- Given an item exists in inventory
- When I mark it as consumed with quantity
- Then the quantity is reduced or item removed if fully consumed
- And consumption is logged with timestamp and user
- And statistics are updated

---

### US-009: Mark Item as Wasted
**As a** household member  
**I want to** mark items as wasted  
**So that** we can track and reduce food waste

**Acceptance Criteria:**
- Given an item exists in inventory
- When I mark it as wasted with quantity and optional reason
- Then the quantity is reduced or item removed
- And waste is logged with timestamp, user, and reason
- And waste statistics are updated

---

### US-010: Move Item Location
**As a** household member  
**I want to** move items between storage locations  
**So that** inventory reflects actual storage

**Acceptance Criteria:**
- Given an item exists in one location
- When I move it to another location
- Then the item's location is updated
- And the move is logged in activity history
- And other members see the update immediately

---

## Epic: Notifications

### US-011: Receive Expiration Warnings
**As a** household member  
**I want to** receive warnings about expiring items  
**So that** I can use them before they spoil

**Acceptance Criteria:**
- Given I have items with expiration dates
- When an item is within the warning period (default 3 days)
- Then I receive notifications via my enabled channels
- And notifications include item name, location, and days until expiry
- And I can acknowledge or snooze notifications

---

### US-012: Configure Notification Preferences
**As a** user  
**I want to** configure my notification preferences  
**So that** I receive alerts how and when I want

**Acceptance Criteria:**
- Given I am in settings
- When I configure notification preferences
- Then I can enable/disable each channel (email, in-app, Telegram)
- And set warning period (1-7 days)
- And choose notification types to receive
- And set preferred notification time

---

### US-013: Link Telegram Account
**As a** user  
**I want to** link my Telegram account  
**So that** I receive notifications via Telegram

**Acceptance Criteria:**
- Given I want Telegram notifications
- When I start the linking process
- Then I receive a verification code
- And I can enter it in the Telegram bot
- And my accounts are linked
- And I start receiving Telegram notifications

---

## Epic: Shopping Lists

### US-014: Create Shopping List
**As a** household member  
**I want to** create shopping lists  
**So that** we can plan grocery shopping

**Acceptance Criteria:**
- Given I am a household member
- When I create a shopping list
- Then it's shared with all household members
- And members can add/remove items
- And changes sync in real-time

---

### US-015: Add Low Stock Items to Shopping List
**As a** household member  
**I want to** easily add low stock items to shopping list  
**So that** we remember to buy them

**Acceptance Criteria:**
- Given an item is running low
- When I view the item
- Then I can add it to shopping list with one click
- And the suggested quantity is based on typical usage
- And the item appears on the shared shopping list

---

## Epic: Reporting & Analytics

### US-016: View Consumption Statistics
**As a** household member  
**I want to** see consumption statistics  
**So that** I understand our usage patterns

**Acceptance Criteria:**
- Given items have been consumed over time
- When I view statistics
- Then I see consumption by category
- And consumption trends over time
- And most/least consumed items

---

### US-017: View Waste Statistics
**As a** household member  
**I want to** see waste statistics  
**So that** we can reduce food waste

**Acceptance Criteria:**
- Given items have been wasted over time
- When I view waste statistics
- Then I see waste by category
- And waste trends over time
- And common waste reasons
- And estimated money lost

---

## Epic: Mobile Experience

### US-018: Use App on Mobile Device
**As a** user on the go  
**I want to** access the app from my phone  
**So that** I can check inventory while shopping

**Acceptance Criteria:**
- Given I access the app from a mobile browser
- When I use core features
- Then the interface is responsive and touch-friendly
- And I can install it as a PWA
- And it works offline for reading data
- And changes sync when online

---

## Epic: Search and Filter

### US-019: Search Inventory
**As a** household member  
**I want to** search for items in inventory  
**So that** I can quickly find what I need

**Acceptance Criteria:**
- Given I have many items in inventory
- When I search by name or category
- Then I see filtered results immediately
- And search works across all item fields
- And results are sorted by relevance

---

### US-020: Filter by Location
**As a** household member  
**I want to** filter inventory by location  
**So that** I can see what's in specific storage areas

**Acceptance Criteria:**
- Given items in different locations
- When I filter by location
- Then I only see items in that location
- And I can combine with other filters
- And the count shows filtered items

---

### US-021: Filter by Expiration Status
**As a** household member  
**I want to** filter by expiration status  
**So that** I can focus on items needing attention

**Acceptance Criteria:**
- Given items with various expiration dates
- When I filter by status (expired, expiring soon, fresh)
- Then I see only matching items
- And items are sorted by urgency
- And counts are shown for each status