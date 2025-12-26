# Concurrency Control Strategy

## Overview
This document defines the concurrency control mechanisms for Pantrybot to prevent data corruption and race conditions in our multi-user, real-time collaborative system.

## 1. HTTP API Concurrency (Optimistic Locking with ETags)

### Implementation

All mutable resources will use HTTP ETag headers for optimistic concurrency control:

```csharp
// Domain Entity Base
public abstract class Entity
{
    public Guid Id { get; protected set; }
    public byte[] RowVersion { get; protected set; } // PostgreSQL xmin or custom version
    public DateTime UpdatedAt { get; protected set; }
    
    public string GenerateETag() 
    {
        return Convert.ToBase64String(RowVersion ?? BitConverter.GetBytes(UpdatedAt.Ticks));
    }
}

// Controller Implementation
[HttpPatch("items/{id}")]
public async Task<IActionResult> UpdateItem(
    Guid id, 
    [FromBody] UpdateItemRequest request,
    [FromHeader(Name = "If-Match")] string ifMatch)
{
    if (string.IsNullOrEmpty(ifMatch))
        return BadRequest("If-Match header is required for updates");
    
    var item = await _itemService.GetByIdAsync(id);
    if (item == null)
        return NotFound();
    
    var currentETag = item.GenerateETag();
    if (ifMatch != currentETag)
    {
        return StatusCode(409, new ConflictResponse
        {
            Message = "Resource has been modified",
            CurrentETag = currentETag,
            CurrentData = item
        });
    }
    
    var updated = await _itemService.UpdateAsync(id, request);
    Response.Headers.Add("ETag", updated.GenerateETag());
    
    return Ok(updated);
}
```

### Database Configuration

```sql
-- Add row versioning to all mutable tables
ALTER TABLE inventory_items ADD COLUMN row_version BIGINT DEFAULT 0;
ALTER TABLE households ADD COLUMN row_version BIGINT DEFAULT 0;
ALTER TABLE users ADD COLUMN row_version BIGINT DEFAULT 0;

-- Trigger to auto-increment version on update
CREATE OR REPLACE FUNCTION increment_row_version()
RETURNS TRIGGER AS $$
BEGIN
    NEW.row_version = OLD.row_version + 1;
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_items_version
BEFORE UPDATE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION increment_row_version();
```

## 2. WebSocket Real-Time Updates

### Versioned Events

All WebSocket events include version information:

```csharp
public class ItemUpdatedEvent : DomainEvent
{
    public Guid ItemId { get; set; }
    public Guid HouseholdId { get; set; }
    public long Version { get; set; }  // Row version
    public DateTime Timestamp { get; set; }
    public string UpdatedBy { get; set; }
    public ItemDto Data { get; set; }
}

// SignalR Hub
public class InventoryHub : Hub
{
    public async Task BroadcastItemUpdate(ItemUpdatedEvent evt)
    {
        await Clients.Group($"household-{evt.HouseholdId}")
            .SendAsync("ItemUpdated", evt);
    }
}
```

### Client-Side Conflict Resolution

```typescript
// React/Next.js client
interface VersionedItem {
  id: string;
  version: number;
  timestamp: Date;
  data: Item;
}

const useInventorySync = () => {
  const [items, setItems] = useState<Map<string, VersionedItem>>();
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([]);
  
  const handleItemUpdate = (event: ItemUpdatedEvent) => {
    setItems(current => {
      const existing = current.get(event.itemId);
      
      // No conflict - accept update
      if (!existing || existing.version < event.version) {
        return new Map(current).set(event.itemId, {
          id: event.itemId,
          version: event.version,
          timestamp: event.timestamp,
          data: event.data
        });
      }
      
      // Version conflict - user has newer local changes
      if (existing.version > event.version) {
        console.log(`Ignoring stale update for item ${event.itemId}`);
        return current;
      }
      
      // Same version but different data - conflict
      if (JSON.stringify(existing.data) !== JSON.stringify(event.data)) {
        setConflicts(prev => [...prev, {
          itemId: event.itemId,
          localData: existing.data,
          remoteData: event.data,
          timestamp: event.timestamp
        }]);
      }
      
      return current;
    });
  };
  
  return { items, conflicts, resolveConflict };
};
```

## 3. Distributed Lock for Critical Operations

For operations that must be serialized (e.g., consuming the last item):

```csharp
public interface IDistributedLock
{
    Task<IDisposable> AcquireAsync(string resource, TimeSpan timeout);
}

public class RedisDistributedLock : IDistributedLock
{
    private readonly IConnectionMultiplexer _redis;
    
    public async Task<IDisposable> AcquireAsync(string resource, TimeSpan timeout)
    {
        var lockKey = $"lock:{resource}";
        var lockValue = Guid.NewGuid().ToString();
        var expiry = TimeSpan.FromSeconds(30);
        
        var acquired = await _redis.GetDatabase()
            .StringSetAsync(lockKey, lockValue, expiry, When.NotExists);
            
        if (!acquired)
            throw new LockAcquisitionException($"Failed to acquire lock for {resource}");
            
        return new LockHandle(lockKey, lockValue, _redis);
    }
}

// Usage in service
public async Task<ConsumeItemResult> ConsumeItemAsync(Guid itemId, decimal quantity)
{
    using (await _distributedLock.AcquireAsync($"item:{itemId}", TimeSpan.FromSeconds(5)))
    {
        var item = await _repository.GetByIdAsync(itemId);
        
        if (item.Quantity < quantity)
            throw new InsufficientQuantityException();
            
        item.Consume(quantity);
        await _repository.UpdateAsync(item);
        
        return new ConsumeItemResult { Success = true, RemainingQuantity = item.Quantity };
    }
}
```

## 4. Conflict Resolution Strategies

### Strategy 1: Last-Write-Wins (Default for non-critical fields)
- Used for: Item names, categories, notes
- Implementation: Accept the most recent update based on timestamp

### Strategy 2: Merge (For quantity operations)
- Used for: Quantity adjustments
- Implementation: Apply deltas rather than absolute values

```csharp
public class QuantityAdjustmentCommand
{
    public Guid ItemId { get; set; }
    public decimal Delta { get; set; } // +/- adjustment, not absolute value
    public string Reason { get; set; }
}
```

### Strategy 3: User Prompt (For critical conflicts)
- Used for: Expiration date changes, complete item deletion
- Implementation: Present both versions to user for manual resolution

## 5. Event Sourcing for Audit Trail

All operations are captured as events for complete auditability:

```csharp
public class ItemEventStore
{
    public async Task AppendAsync(ItemEvent evt)
    {
        await _context.ItemEvents.AddAsync(new ItemEventEntity
        {
            ItemId = evt.ItemId,
            EventType = evt.GetType().Name,
            EventData = JsonSerializer.Serialize(evt),
            Version = evt.Version,
            Timestamp = evt.Timestamp,
            UserId = evt.UserId
        });
        
        await _context.SaveChangesAsync();
    }
}
```

## 6. Testing Concurrency

```csharp
[Fact]
public async Task UpdateItem_WithStaleETag_Returns409Conflict()
{
    // Arrange
    var item = await CreateTestItem();
    var originalETag = item.GenerateETag();
    
    // Act - Update item (changes ETag)
    await UpdateItem(item.Id, new { Name = "Updated" });
    
    // Act - Try to update with stale ETag
    var response = await Client.PatchAsync($"/api/items/{item.Id}",
        JsonContent(new { Quantity = 5 }),
        headers: new { "If-Match" = originalETag });
    
    // Assert
    Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    var conflict = await response.Content.ReadAsAsync<ConflictResponse>();
    Assert.NotEqual(originalETag, conflict.CurrentETag);
}
```

## 7. Performance Considerations

- ETag generation is lightweight (base64 of version number)
- Version checks happen at database level using WHERE clauses
- Distributed locks have 30-second timeout to prevent deadlocks
- WebSocket events are throttled to max 10 updates/second per item

## 8. Monitoring & Metrics

Track these concurrency-related metrics:
- Conflict rate per endpoint
- Lock acquisition failures
- Average lock hold time
- WebSocket event lag
- Version drift between clients

```csharp
public class ConcurrencyMetrics
{
    private readonly IMetricsCollector _metrics;
    
    public void RecordConflict(string resource)
    {
        _metrics.Increment("concurrency.conflicts", tags: new { resource });
    }
    
    public void RecordLockAcquisition(string resource, TimeSpan duration, bool success)
    {
        _metrics.Histogram("concurrency.lock.duration", duration.TotalMilliseconds, 
            tags: new { resource, success });
    }
}
```