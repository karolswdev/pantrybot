# Interface Control Document (ICD)

## Overview
This document defines all interfaces, contracts, and events for the Fridgr system.

## REST API Interfaces

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Household Management
- `GET /api/households` - List user's households
- `POST /api/households` - Create household
- `GET /api/households/{id}` - Get household details
- `PUT /api/households/{id}` - Update household
- `DELETE /api/households/{id}` - Delete household
- `POST /api/households/{id}/members` - Invite member
- `DELETE /api/households/{id}/members/{userId}` - Remove member
- `PUT /api/households/{id}/members/{userId}/role` - Update member role

### Inventory Management
- `GET /api/households/{householdId}/items` - List items
- `POST /api/households/{householdId}/items` - Add item
- `GET /api/households/{householdId}/items/{id}` - Get item details
- `PUT /api/households/{householdId}/items/{id}` - Update item
- `DELETE /api/households/{householdId}/items/{id}` - Delete item
- `POST /api/households/{householdId}/items/{id}/consume` - Mark as consumed
- `POST /api/households/{householdId}/items/{id}/waste` - Mark as wasted
- `POST /api/households/{householdId}/items/{id}/move` - Move location

### Notifications
- `GET /api/notifications/settings` - Get notification preferences
- `PUT /api/notifications/settings` - Update preferences
- `POST /api/notifications/telegram/link` - Link Telegram account
- `DELETE /api/notifications/telegram/unlink` - Unlink Telegram account
- `GET /api/notifications/history` - Get notification history

### Shopping Lists
- `GET /api/households/{householdId}/shopping-lists` - List shopping lists
- `POST /api/households/{householdId}/shopping-lists` - Create list
- `PUT /api/households/{householdId}/shopping-lists/{id}` - Update list
- `POST /api/households/{householdId}/shopping-lists/{id}/items` - Add item to list

## Event Contracts

### Domain Events
```csharp
// Complete representation of all item data for downstream consumers
public record ItemAdded(
    Guid ItemId,
    Guid HouseholdId,
    string Name,
    decimal Quantity,
    string Unit,
    DateTime? ExpirationDate,
    string ExpirationDateType, // "useBy" or "bestBefore"
    string Location,
    string Category,
    DateTime? PurchaseDate,
    decimal? Price,
    string? Notes,
    long Version,
    Guid AddedByUserId,
    DateTime Timestamp
);

public record ItemUpdated(
    Guid ItemId,
    Guid HouseholdId,
    string Name,
    decimal Quantity,
    string Unit,
    DateTime? ExpirationDate,
    string ExpirationDateType,
    string Location,
    string Category,
    DateTime? PurchaseDate,
    decimal? Price,
    string? Notes,
    long Version,
    long PreviousVersion,
    Dictionary<string, object> ChangedFields, // Track what actually changed
    Guid UpdatedByUserId,
    DateTime Timestamp
);

public record ItemExpiringSoon(
    Guid ItemId,
    Guid HouseholdId,
    string Name,
    decimal Quantity,
    string Unit,
    string Location,
    string Category,
    DateTime ExpirationDate,
    string ExpirationDateType,
    int DaysUntilExpiration,
    DateTime Timestamp
);

public record ItemConsumed(
    Guid ItemId,
    Guid HouseholdId,
    string Name,
    decimal QuantityConsumed,
    decimal RemainingQuantity,
    string Unit,
    string ConsumeReason, // "used", "expired", "spoiled"
    Guid ConsumedByUserId,
    DateTime Timestamp
);

public record ItemWasted(
    Guid ItemId,
    Guid HouseholdId,
    string Name,
    decimal QuantityWasted,
    string Unit,
    string Category,
    DateTime? ExpirationDate,
    decimal? OriginalPrice,
    decimal EstimatedWasteValue,
    string Reason, // "expired", "spoiled", "forgotten", "other"
    Guid WastedByUserId,
    DateTime Timestamp
);

public record HouseholdMemberAdded(
    Guid HouseholdId,
    string HouseholdName,
    Guid UserId,
    string UserEmail,
    string UserDisplayName,
    string Role,
    Guid AddedByUserId,
    string AddedByUserEmail,
    DateTime Timestamp
);
```

### Notification Events
```csharp
public record NotificationRequested(
    Guid UserId,
    string Type,
    string Channel,
    Dictionary<string, object> Payload,
    DateTime Timestamp
);

public record TelegramMessageRequested(
    string ChatId,
    string Message,
    Dictionary<string, object> Metadata
);
```

## Data Transfer Objects (DTOs)

### Request DTOs
```csharp
public class CreateItemRequest
{
    public string Name { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public DateTime? BestBeforeDate { get; set; }
    public string Location { get; set; } // "fridge", "freezer", "pantry"
    public string Category { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? Price { get; set; }
    public string Notes { get; set; }
}

public class UpdateItemRequest
{
    public string Name { get; set; }
    public int? Quantity { get; set; }
    public string Unit { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public DateTime? BestBeforeDate { get; set; }
    public string Location { get; set; }
    public string Category { get; set; }
    public string Notes { get; set; }
}

public class ConsumeItemRequest
{
    public int Quantity { get; set; }
    public string Notes { get; set; }
}

public class CreateHouseholdRequest
{
    public string Name { get; set; }
    public string Description { get; set; }
    public string TimeZone { get; set; }
}

public class InviteMemberRequest
{
    public string Email { get; set; }
    public string Role { get; set; } // "admin", "member", "viewer"
}

public class LinkTelegramRequest
{
    public string VerificationCode { get; set; }
}

public class NotificationSettingsRequest
{
    public bool EmailEnabled { get; set; }
    public bool InAppEnabled { get; set; }
    public bool TelegramEnabled { get; set; }
    public int ExpirationWarningDays { get; set; }
    public string[] NotificationTypes { get; set; }
    public string PreferredTime { get; set; } // HH:mm format
}
```

### Response DTOs
```csharp
public class ItemResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public int Quantity { get; set; }
    public string Unit { get; set; }
    public DateTime? ExpirationDate { get; set; }
    public DateTime? BestBeforeDate { get; set; }
    public string Location { get; set; }
    public string Category { get; set; }
    public DateTime? PurchaseDate { get; set; }
    public decimal? Price { get; set; }
    public string Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public Guid CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public Guid? UpdatedBy { get; set; }
    public int? DaysUntilExpiration { get; set; }
    public string ExpirationStatus { get; set; } // "fresh", "expiring_soon", "expired"
}

public class HouseholdResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string TimeZone { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<HouseholdMemberResponse> Members { get; set; }
    public int TotalItems { get; set; }
    public int ExpiringItems { get; set; }
}

public class HouseholdMemberResponse
{
    public Guid UserId { get; set; }
    public string Email { get; set; }
    public string DisplayName { get; set; }
    public string Role { get; set; }
    public DateTime JoinedAt { get; set; }
}
```

## WebSocket Contracts

### Real-time Updates
```json
{
  "type": "item.updated",
  "householdId": "uuid",
  "payload": {
    "itemId": "uuid",
    "changes": {},
    "updatedBy": "uuid",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}

{
  "type": "notification.new",
  "userId": "uuid",
  "payload": {
    "id": "uuid",
    "type": "expiration_warning",
    "message": "3 items expiring soon",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Telegram Bot Commands

### User Commands
- `/start` - Initialize bot and get verification code
- `/link <code>` - Link Telegram account to Fridgr
- `/unlink` - Unlink Telegram account
- `/status` - Show current household inventory status
- `/expiring` - List items expiring soon
- `/settings` - Configure notification preferences
- `/help` - Show available commands

### Bot Webhook Payload
```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "username": "user"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "text": "/command",
    "date": 1640995200
  }
}
```

## Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": [
      {
        "field": "expirationDate",
        "message": "Must be a future date"
      }
    ],
    "timestamp": "2024-01-01T00:00:00Z",
    "traceId": "uuid"
  }
}
```

## Rate Limiting Headers
- `X-RateLimit-Limit` - Request limit per window
- `X-RateLimit-Remaining` - Remaining requests in window
- `X-RateLimit-Reset` - Unix timestamp when window resets

## Authentication Headers
- `Authorization: Bearer <jwt_token>`
- `X-Household-Id` - Active household context (optional)

## API Versioning
- Version in URL path: `/api/v1/...`
- Version in header: `X-API-Version: 1.0`