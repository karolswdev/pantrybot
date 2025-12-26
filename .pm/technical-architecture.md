# Technical Architecture Requirements

## 1. Architecture Overview

### System Architecture Pattern
The system follows a **Modular Monolith** architecture with **Ports & Adapters (Hexagonal Architecture)** pattern, preparing for potential future decomposition into microservices.

### Key Architectural Principles
- **Domain-Driven Design (DDD)**: Clear bounded contexts and aggregates
- **CQRS**: Separate read and write models where beneficial
- **Event-Driven**: Domain events for loose coupling between modules
- **Dependency Inversion**: Core domain independent of infrastructure
- **Clean Architecture**: Clear separation of concerns

## 2. Technology Stack

### Backend (.NET/C#)
- **Framework**: .NET 8 (latest LTS)
- **API**: ASP.NET Core Web API
- **Real-time**: SignalR for WebSocket connections
- **ORM**: Entity Framework Core 8
- **Database**: PostgreSQL 15+
- **Caching**: Redis (In-memory for MVP)
- **Message Queue**: MediatR (in-process for MVP)
- **Background Jobs**: Hangfire or hosted services
- **Testing**: xUnit, Moq, FluentAssertions
- **API Documentation**: Swagger/OpenAPI
- **Logging**: Serilog with structured logging
- **Validation**: FluentValidation

### Frontend (React/Next.js)
- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **UI Library**: React 18+
- **State Management**: Zustand or Redux Toolkit
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui or Material-UI
- **Real-time**: SignalR client
- **Forms**: React Hook Form
- **Validation**: Zod
- **API Client**: Axios or native fetch with interceptors
- **Testing**: Jest, React Testing Library
- **PWA**: next-pwa for offline capabilities

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose (MVP), Kubernetes-ready
- **CI/CD**: GitHub Actions
- **Cloud**: AWS or Azure (cloud-agnostic design)
- **Monitoring**: Application Insights or custom logging
- **Secrets**: Azure Key Vault or AWS Secrets Manager

## 3. Backend Architecture (Ports & Adapters)

### Project Structure
```
src/
├── Pantrybot.Domain/              # Core domain (entities, value objects, domain services)
│   ├── Aggregates/
│   ├── Events/
│   ├── Exceptions/
│   ├── Services/
│   └── ValueObjects/
├── Pantrybot.Application/          # Application layer (use cases, DTOs, interfaces)
│   ├── Commands/
│   ├── Queries/
│   ├── DTOs/
│   ├── Interfaces/
│   └── Services/
├── Pantrybot.Infrastructure/       # Infrastructure (adapters, persistence, external services)
│   ├── Persistence/
│   ├── Identity/
│   ├── Notifications/
│   ├── Telegram/
│   └── Caching/
├── Pantrybot.API/                  # Web API (controllers, middleware, configuration)
│   ├── Controllers/
│   ├── Middleware/
│   ├── Filters/
│   └── Hubs/
└── Pantrybot.Tests/               # Test projects
    ├── Unit/
    ├── Integration/
    └── E2E/
```

### Domain Model

#### Core Aggregates
```csharp
// User Aggregate
public class User : AggregateRoot
{
    public UserId Id { get; private set; }
    public Email Email { get; private set; }
    public HashedPassword Password { get; private set; }
    public UserProfile Profile { get; private set; }
    public List<HouseholdMembership> Memberships { get; private set; }
    
    // Domain logic methods
    public void JoinHousehold(HouseholdId householdId, MemberRole role) { }
    public void UpdateProfile(UserProfile profile) { }
}

// Household Aggregate
public class Household : AggregateRoot
{
    public HouseholdId Id { get; private set; }
    public HouseholdName Name { get; private set; }
    public List<Member> Members { get; private set; }
    public HouseholdSettings Settings { get; private set; }
    
    // Domain logic methods
    public void AddMember(UserId userId, MemberRole role) { }
    public void RemoveMember(UserId userId) { }
    public void UpdateSettings(HouseholdSettings settings) { }
}

// Inventory Item Aggregate
public class InventoryItem : AggregateRoot
{
    public ItemId Id { get; private set; }
    public HouseholdId HouseholdId { get; private set; }
    public ItemName Name { get; private set; }
    public Quantity Quantity { get; private set; }
    public StorageLocation Location { get; private set; }
    public ExpirationInfo Expiration { get; private set; }
    public Category Category { get; private set; }
    
    // Domain logic methods
    public void Consume(Quantity amount, UserId consumedBy) { }
    public void MarkAsWasted(Quantity amount, string reason, UserId wastedBy) { }
    public void MoveToLocation(StorageLocation newLocation) { }
    public bool IsExpiringSoon(int warningDays) { }
}
```

### Application Services

#### Command Handlers (CQRS Write Side)
```csharp
public class AddInventoryItemCommandHandler : IRequestHandler<AddInventoryItemCommand, ItemId>
{
    private readonly IInventoryRepository _repository;
    private readonly IEventDispatcher _eventDispatcher;
    
    public async Task<ItemId> Handle(AddInventoryItemCommand command, CancellationToken ct)
    {
        var item = InventoryItem.Create(
            command.HouseholdId,
            command.Name,
            command.Quantity,
            command.Location,
            command.ExpirationDate
        );
        
        await _repository.AddAsync(item, ct);
        await _eventDispatcher.DispatchAsync(new ItemAddedEvent(item), ct);
        
        return item.Id;
    }
}
```

#### Query Handlers (CQRS Read Side)
```csharp
public class GetExpiringItemsQueryHandler : IRequestHandler<GetExpiringItemsQuery, List<ExpiringItemDto>>
{
    private readonly IReadOnlyInventoryRepository _repository;
    
    public async Task<List<ExpiringItemDto>> Handle(GetExpiringItemsQuery query, CancellationToken ct)
    {
        var items = await _repository.GetExpiringItemsAsync(
            query.HouseholdId, 
            query.DaysAhead, 
            ct
        );
        
        return items.Select(i => new ExpiringItemDto
        {
            Id = i.Id,
            Name = i.Name,
            DaysUntilExpiration = i.DaysUntilExpiration,
            Location = i.Location
        }).ToList();
    }
}
```

### Infrastructure Adapters

#### Repository Implementation
```csharp
public class EfInventoryRepository : IInventoryRepository
{
    private readonly PantrybotDbContext _context;
    
    public async Task<InventoryItem> GetByIdAsync(ItemId id, CancellationToken ct)
    {
        return await _context.Items
            .Where(i => i.Id == id)
            .FirstOrDefaultAsync(ct);
    }
    
    public async Task AddAsync(InventoryItem item, CancellationToken ct)
    {
        await _context.Items.AddAsync(item, ct);
        await _context.SaveChangesAsync(ct);
    }
}
```

#### Notification Adapter
```csharp
public interface INotificationPort
{
    Task SendAsync(NotificationRequest request, CancellationToken ct);
}

public class EmailNotificationAdapter : INotificationPort
{
    private readonly IEmailService _emailService;
    
    public async Task SendAsync(NotificationRequest request, CancellationToken ct)
    {
        var email = new EmailMessage
        {
            To = request.Recipient,
            Subject = request.Subject,
            Body = request.Content
        };
        
        await _emailService.SendAsync(email, ct);
    }
}

public class TelegramNotificationAdapter : INotificationPort
{
    private readonly ITelegramBotClient _botClient;
    
    public async Task SendAsync(NotificationRequest request, CancellationToken ct)
    {
        await _botClient.SendTextMessageAsync(
            request.TelegramChatId,
            request.Content,
            cancellationToken: ct
        );
    }
}
```

## 4. API Design

### RESTful Principles
- Resource-based URLs
- HTTP verbs for operations
- Stateless communication
- JSON request/response
- HATEOAS where beneficial

### API Versioning Strategy
```csharp
[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/[controller]")]
public class InventoryController : ControllerBase
{
    // Controller implementation
}
```

### Authentication & Authorization
```csharp
public class JwtAuthenticationMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var token = context.Request.Headers["Authorization"]
            .FirstOrDefault()?.Split(" ").Last();
            
        if (token != null)
        {
            var principal = ValidateToken(token);
            context.User = principal;
        }
        
        await next(context);
    }
}

[Authorize(Policy = "HouseholdMember")]
public class InventoryController : ControllerBase
{
    [HttpPost]
    [Authorize(Policy = "CanEditInventory")]
    public async Task<IActionResult> AddItem([FromBody] AddItemRequest request)
    {
        // Implementation
    }
}
```

### Error Handling
```csharp
public class GlobalExceptionMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        try
        {
            await next(context);
        }
        catch (DomainException ex)
        {
            await HandleDomainException(context, ex);
        }
        catch (ValidationException ex)
        {
            await HandleValidationException(context, ex);
        }
        catch (Exception ex)
        {
            await HandleGenericException(context, ex);
        }
    }
}
```

## 5. Database Design

### Multi-tenancy Strategy
- **Row-level security**: All tables include HouseholdId
- **Query filters**: Automatic filtering by household
- **Indexes**: Composite indexes on (HouseholdId, other columns)

### Core Tables
```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP
);

-- Households table
CREATE TABLE households (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    timezone VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id)
);

-- Household members junction table
CREATE TABLE household_members (
    household_id UUID REFERENCES households(id),
    user_id UUID REFERENCES users(id),
    role VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP NOT NULL,
    PRIMARY KEY (household_id, user_id)
);

-- Inventory items table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY,
    household_id UUID REFERENCES households(id),
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(20),
    location VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    expiration_date DATE,
    best_before_date DATE,
    purchase_date DATE,
    price DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    INDEX idx_household_expiration (household_id, expiration_date),
    INDEX idx_household_location (household_id, location)
);

-- Activity log table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY,
    household_id UUID REFERENCES households(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB,
    timestamp TIMESTAMP NOT NULL,
    INDEX idx_household_timestamp (household_id, timestamp DESC)
);

-- Notification preferences table
CREATE TABLE notification_preferences (
    user_id UUID REFERENCES users(id),
    household_id UUID REFERENCES households(id),
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    telegram_enabled BOOLEAN DEFAULT false,
    telegram_chat_id VARCHAR(100),
    warning_days INTEGER DEFAULT 3,
    notification_types TEXT[],
    preferred_time TIME,
    PRIMARY KEY (user_id, household_id)
);
```

## 6. Security Requirements

### Authentication
- JWT tokens with refresh token rotation
- Token expiration: Access (15 min), Refresh (7 days)
- Secure password requirements enforced
- Account lockout after failed attempts

### Authorization
- Role-based access control (RBAC)
- Resource-based authorization
- Household isolation enforcement

### Data Protection
- Encryption at rest (database)
- Encryption in transit (TLS 1.2+)
- Sensitive data masking in logs
- Input validation and sanitization
- SQL injection prevention via parameterized queries
- XSS protection via content security policy

### API Security
- Rate limiting per user/IP
- CORS configuration
- API key for service-to-service
- Request signing for webhooks

## 7. Performance Requirements

### Caching Strategy
```csharp
public class CachedInventoryService : IInventoryService
{
    private readonly IMemoryCache _cache;
    private readonly IInventoryService _innerService;
    
    public async Task<List<InventoryItem>> GetHouseholdItemsAsync(HouseholdId id)
    {
        var cacheKey = $"household:{id}:items";
        
        return await _cache.GetOrCreateAsync(cacheKey, async entry =>
        {
            entry.SlidingExpiration = TimeSpan.FromMinutes(5);
            return await _innerService.GetHouseholdItemsAsync(id);
        });
    }
}
```

### Database Optimization
- Connection pooling
- Query optimization with proper indexes
- Pagination for large result sets
- Batch operations where possible
- Read replicas for reporting (future)

### Real-time Updates
- SignalR hubs for WebSocket connections
- Efficient message serialization
- Connection management and reconnection
- Message queuing for offline clients

## 8. Deployment Architecture

### Container Configuration
```dockerfile
# Backend Dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Pantrybot.API/Pantrybot.API.csproj", "Pantrybot.API/"]
COPY ["Pantrybot.Application/Pantrybot.Application.csproj", "Pantrybot.Application/"]
COPY ["Pantrybot.Domain/Pantrybot.Domain.csproj", "Pantrybot.Domain/"]
COPY ["Pantrybot.Infrastructure/Pantrybot.Infrastructure.csproj", "Pantrybot.Infrastructure/"]
RUN dotnet restore "Pantrybot.API/Pantrybot.API.csproj"
COPY . .
WORKDIR "/src/Pantrybot.API"
RUN dotnet build "Pantrybot.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Pantrybot.API.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Pantrybot.API.dll"]
```

### Docker Compose (MVP)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: pantrybot
      POSTGRES_USER: pantrybot
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      ConnectionStrings__DefaultConnection: ${DB_CONNECTION}
      Redis__ConnectionString: redis:6379
      Jwt__Secret: ${JWT_SECRET}
      Email__SmtpHost: ${SMTP_HOST}
      Telegram__BotToken: ${TELEGRAM_TOKEN}
    depends_on:
      - postgres
      - redis
    ports:
      - "5000:80"

  frontend:
    build: ./frontend
    environment:
      NEXT_PUBLIC_API_URL: http://backend:80
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

## 9. Testing Strategy

### Unit Testing
```csharp
[Fact]
public async Task AddItem_WithValidData_CreatesItem()
{
    // Arrange
    var household = new Household(HouseholdId.New(), "Test House");
    var command = new AddItemCommand
    {
        Name = "Milk",
        Quantity = 1,
        Location = StorageLocation.Fridge
    };
    
    // Act
    var item = await _handler.Handle(command, CancellationToken.None);
    
    // Assert
    item.Should().NotBeNull();
    item.Name.Should().Be("Milk");
    _repository.Verify(r => r.AddAsync(It.IsAny<InventoryItem>(), It.IsAny<CancellationToken>()), Times.Once);
}
```

### Integration Testing
```csharp
public class InventoryApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task GetItems_ReturnsOnlyHouseholdItems()
    {
        // Arrange
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Add test database
            });
        }).CreateClient();
        
        // Act
        var response = await client.GetAsync("/api/v1/households/123/items");
        
        // Assert
        response.EnsureSuccessStatusCode();
        var items = await response.Content.ReadAsAsync<List<ItemDto>>();
        items.Should().OnlyContain(i => i.HouseholdId == "123");
    }
}
```

## 10. Monitoring & Observability (Post-MVP)

### Structured Logging
```csharp
public class InventoryService
{
    private readonly ILogger<InventoryService> _logger;
    
    public async Task<ItemId> AddItemAsync(AddItemRequest request)
    {
        using var activity = Activity.StartActivity("AddItem");
        
        _logger.LogInformation("Adding item {ItemName} to household {HouseholdId}",
            request.Name, request.HouseholdId);
        
        try
        {
            var itemId = await _repository.AddAsync(item);
            
            _logger.LogInformation("Successfully added item {ItemId}", itemId);
            return itemId;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to add item {ItemName}", request.Name);
            throw;
        }
    }
}
```

### Health Checks
```csharp
public class Startup
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddHealthChecks()
            .AddDbContextCheck<PantrybotDbContext>()
            .AddRedis(Configuration.GetConnectionString("Redis"))
            .AddUrlGroup(new Uri(Configuration["Telegram:WebhookUrl"]), "telegram");
    }
}
```