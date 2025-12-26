# Telegram Bot Integration Requirements

## Overview

The Pantrybot Telegram bot provides users with a convenient way to receive notifications and interact with their household inventory through Telegram messenger. The bot supports both push notifications and interactive commands.

## Bot Configuration

### Bot Setup
- **Bot Name**: @PantrybotBot
- **Bot Username**: pantrybot_bot
- **Description**: "Manage your household food inventory and receive expiration alerts"
- **Commands Menu**: Display available commands in Telegram UI

### Technical Configuration
```csharp
public class TelegramBotConfiguration
{
    public string BotToken { get; set; }
    public string WebhookUrl { get; set; }
    public string SecretToken { get; set; } // For webhook validation
    public int MaxConnections { get; set; } = 40;
    public string[] AllowedUpdates { get; set; } = { "message", "callback_query" };
}
```

## Authentication & Linking

### Account Linking Flow
1. User initiates linking from web/mobile app
2. System generates unique 6-character verification code
3. User sends `/link <code>` to bot
4. Bot verifies code and links accounts
5. User receives confirmation in both app and Telegram

### Verification Code Generation
```csharp
public class VerificationCodeService
{
    public string GenerateCode()
    {
        // Generate 6-character alphanumeric code
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new SecureRandom();
        return new string(Enumerable.Range(0, 6)
            .Select(_ => chars[random.Next(chars.Length)])
            .ToArray());
    }
    
    public TimeSpan CodeExpiration => TimeSpan.FromMinutes(10);
}
```

### Security Requirements
- Verification codes expire after 10 minutes
- One-time use only
- Rate limiting on verification attempts
- Secure token storage
- User privacy protection (no sharing between households)

## Bot Commands

### Basic Commands

#### /start
- **Description**: Initialize bot and show welcome message
- **Response**: Welcome message with instructions
- **Example Response**:
```
Welcome to Pantrybot Bot! 🏠

I can help you manage your household inventory and send you notifications about expiring items.

To get started, link your Pantrybot account:
1. Go to Settings in the Pantrybot app
2. Select "Link Telegram"
3. Use /link <code> with the code shown

Type /help to see all available commands.
```

#### /link `<code>`
- **Description**: Link Telegram account to Pantrybot
- **Parameters**: 6-character verification code
- **Response**: Success/failure message
- **Example**: `/link ABC123`

#### /unlink
- **Description**: Unlink Telegram account
- **Response**: Confirmation request with inline keyboard
- **Requires**: Confirmation via callback query

#### /help
- **Description**: Show all available commands
- **Response**: Formatted list of commands with descriptions

### Inventory Commands

#### /status
- **Description**: Show household inventory overview
- **Response**: Summary statistics
- **Example Response**:
```
📊 Household: Home
Total Items: 127
Expiring Soon: 3
Expired: 1
Low Stock: 5

Type /expiring to see items expiring soon
```

#### /expiring
- **Description**: List items expiring within warning period
- **Response**: Formatted list with details
- **Example Response**:
```
⚠️ Items Expiring Soon:

1. 🥛 Milk (Fridge)
   Expires: Tomorrow
   Quantity: 0.5 gallon

2. 🥪 Bread (Pantry)
   Expires: In 2 days
   Quantity: 1 loaf

3. 🧀 Cheese (Fridge)
   Expires: In 3 days
   Quantity: 200g
```

#### /search `<query>`
- **Description**: Search for items in inventory
- **Parameters**: Search query
- **Response**: Matching items list
- **Example**: `/search milk`

#### /add `<item>`
- **Description**: Quick add item to inventory
- **Parameters**: Item name
- **Response**: Inline keyboard for details
- **Flow**:
  1. User types `/add Milk`
  2. Bot responds with inline keyboard for location selection
  3. User selects location
  4. Bot asks for quantity
  5. Bot confirms addition

#### /shopping
- **Description**: Show active shopping list
- **Response**: Current shopping list items
- **Interactive**: Mark items as purchased via inline buttons

### Notification Commands

#### /settings
- **Description**: Configure notification preferences
- **Response**: Current settings with inline keyboard for changes
- **Options**:
  - Enable/disable notifications
  - Set warning days (1-7)
  - Choose notification types
  - Set quiet hours

#### /mute `<hours>`
- **Description**: Temporarily mute notifications
- **Parameters**: Number of hours (1-24)
- **Response**: Confirmation message
- **Example**: `/mute 8`

#### /unmute
- **Description**: Resume notifications
- **Response**: Confirmation message

## Notification Types

### Expiration Warnings
```
⚠️ Expiration Alert - Home

3 items expiring soon:
• Milk - Tomorrow
• Yogurt - In 2 days  
• Bread - In 3 days

Tap to mark as consumed:
[Milk ✓] [Yogurt ✓] [Bread ✓]
```

### Daily Summary
```
📅 Daily Summary - Home

Expiring Today: 1 item
Expiring This Week: 5 items
Low Stock: 3 items
Shopping List: 8 items

View details in app →
```

### Item Added by Others
```
➕ New Item Added - Home

Jane added:
• Apples (6 pieces) to Pantry

Current Pantry Items: 32
```

### Shopping Reminder
```
🛒 Shopping Reminder

You have 12 items on your shopping list.
Going shopping today?

[View List] [Snooze 1hr]
```

## Inline Keyboards & Callbacks

### Inline Keyboard Types

#### Action Buttons
```csharp
var keyboard = new InlineKeyboardMarkup(new[]
{
    new[]
    {
        InlineKeyboardButton.CallbackData("✅ Consumed", $"consume:{itemId}"),
        InlineKeyboardButton.CallbackData("🗑 Wasted", $"waste:{itemId}")
    },
    new[]
    {
        InlineKeyboardButton.CallbackData("📝 Edit", $"edit:{itemId}"),
        InlineKeyboardButton.CallbackData("ℹ️ Details", $"details:{itemId}")
    }
});
```

#### Navigation
```csharp
var keyboard = new InlineKeyboardMarkup(new[]
{
    new[]
    {
        InlineKeyboardButton.CallbackData("◀️ Previous", $"page:{page-1}"),
        InlineKeyboardButton.CallbackData($"{page}/{total}", "noop"),
        InlineKeyboardButton.CallbackData("Next ▶️", $"page:{page+1}")
    }
});
```

### Callback Query Handling
```csharp
public async Task HandleCallbackQuery(CallbackQuery query)
{
    var data = query.Data.Split(':');
    var action = data[0];
    var parameter = data.Length > 1 ? data[1] : null;
    
    switch (action)
    {
        case "consume":
            await HandleConsumeItem(query.From.Id, parameter);
            break;
        case "waste":
            await HandleWasteItem(query.From.Id, parameter);
            break;
        case "page":
            await HandlePagination(query.Message, int.Parse(parameter));
            break;
    }
    
    // Answer callback to remove loading state
    await botClient.AnswerCallbackQueryAsync(query.Id);
}
```

## Webhook Integration

### Webhook Setup
```csharp
public class TelegramWebhookController : ControllerBase
{
    [HttpPost("telegram/webhook")]
    public async Task<IActionResult> Webhook(
        [FromBody] Update update,
        [FromHeader(Name = "X-Telegram-Bot-Api-Secret-Token")] string secretToken)
    {
        if (secretToken != _config.SecretToken)
            return Unauthorized();
            
        await _botService.HandleUpdateAsync(update);
        return Ok();
    }
}
```

### Webhook Configuration
```bash
# Set webhook
curl -X POST https://api.telegram.org/bot{token}/setWebhook \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.pantrybot.app/telegram/webhook",
    "secret_token": "your_secret_token",
    "allowed_updates": ["message", "callback_query"]
  }'
```

## Message Formatting

### Rich Text Formatting
```csharp
public class MessageFormatter
{
    public string FormatExpiringItem(InventoryItem item)
    {
        return $"*{EscapeMarkdown(item.Name)}*\n" +
               $"📍 _{item.Location}_\n" +
               $"📅 Expires: {item.DaysUntilExpiration} days\n" +
               $"📦 Quantity: {item.Quantity} {item.Unit}";
    }
    
    private string EscapeMarkdown(string text)
    {
        var escapeChars = new[] { '_', '*', '[', ']', '(', ')', '~', '`', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!' };
        foreach (var c in escapeChars)
            text = text.Replace(c.ToString(), $"\\{c}");
        return text;
    }
}
```

### Emoji Usage
```csharp
public static class EmojiConstants
{
    public const string House = "🏠";
    public const string Warning = "⚠️";
    public const string Clock = "⏰";
    public const string ShoppingCart = "🛒";
    public const string CheckMark = "✅";
    public const string CrossMark = "❌";
    public const string Fridge = "❄️";
    public const string Fire = "🔥"; // For expired
    public const string Leaf = "🌿"; // For fresh
    
    // Category emojis
    public const string Produce = "🍎";
    public const string Dairy = "🥛";
    public const string Meat = "🥩";
    public const string Bakery = "🍞";
    public const string Frozen = "🧊";
}
```

## Error Handling

### User-Friendly Error Messages
```csharp
public class BotErrorHandler
{
    public string GetUserMessage(Exception ex)
    {
        return ex switch
        {
            AccountNotLinkedException => "❌ Your account is not linked. Use /link <code> to connect.",
            NoHouseholdException => "❌ You're not a member of any household.",
            NoPermissionException => "❌ You don't have permission for this action.",
            InvalidCommandException => "❌ Invalid command format. Type /help for usage.",
            _ => "❌ Something went wrong. Please try again or contact support."
        };
    }
}
```

### Rate Limiting
- 30 messages per second per user
- 1 message per second to same chat
- Implement exponential backoff for retries

## Monitoring & Analytics

### Metrics to Track
- Daily active users
- Command usage frequency
- Notification delivery rate
- Link/unlink success rate
- Response times
- Error rates

### Logging
```csharp
public class TelegramBotLogger
{
    public void LogCommand(long userId, string command, string parameters)
    {
        _logger.LogInformation("Telegram command executed: {Command} by {UserId} with {Parameters}",
            command, userId, parameters);
    }
    
    public void LogNotification(long chatId, string notificationType, bool success)
    {
        _logger.LogInformation("Telegram notification sent: {Type} to {ChatId}, Success: {Success}",
            notificationType, chatId, success);
    }
}
```

## Deployment Considerations

### High Availability
- Deploy bot service separately from main API
- Use message queue for notification processing
- Implement circuit breaker for Telegram API calls
- Handle webhook failures gracefully

### Scaling
```csharp
public class TelegramNotificationQueue
{
    private readonly IBackgroundTaskQueue _queue;
    
    public async Task EnqueueNotification(TelegramNotification notification)
    {
        await _queue.QueueBackgroundWorkItemAsync(async token =>
        {
            await SendNotificationWithRetry(notification, token);
        });
    }
    
    private async Task SendNotificationWithRetry(TelegramNotification notification, CancellationToken ct)
    {
        var retryPolicy = Policy
            .Handle<ApiRequestException>()
            .WaitAndRetryAsync(3, retryAttempt => 
                TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)));
                
        await retryPolicy.ExecuteAsync(async () =>
            await _botClient.SendTextMessageAsync(notification.ChatId, notification.Message, ct));
    }
}
```

## Privacy & Compliance

### Data Protection
- Store minimal user data
- Encrypt chat IDs at rest
- No message content logging
- Clear data on unlink
- GDPR compliance for EU users

### User Consent
- Explicit opt-in for notifications
- Clear privacy policy
- Easy opt-out mechanism
- Data deletion on request

## Future Enhancements

### Phase 2 Features
- Voice commands
- Image recognition for items
- Location sharing for store recommendations
- Group chat support for household coordination
- Rich media messages (charts, images)

### Phase 3 Features
- Natural language processing
- Barcode scanning via photo
- Recipe suggestions
- Meal planning integration
- Shopping list collaboration