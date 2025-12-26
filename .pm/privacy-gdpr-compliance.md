# Privacy & GDPR Compliance Strategy

## Overview
This document defines the privacy implementation for Pantrybot, ensuring proper GDPR compliance with true anonymization, not pseudonymization.

## 1. User Data Deletion & Anonymization

### The Problem with NULL User IDs
Setting `user_id` to NULL in logs is **pseudonymization**, not anonymization:
- All NULL entries can be linked together
- Patterns in NULL user actions can reveal identity
- This fails GDPR's anonymization requirements

### Correct Implementation

```sql
-- Static anonymous user ID for ALL deleted users
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SELECT uuid_nil(); -- Returns: 00000000-0000-0000-0000-000000000000

-- Activity logs table with proper anonymization
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL, -- Never NULL, uses uuid_nil() for deleted users
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB,
    ip_address_hash VARCHAR(64), -- Hashed, not plain IP
    user_agent_hash VARCHAR(64), -- Hashed user agent
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_user_ref CHECK (
        user_id = uuid_nil() OR 
        EXISTS (SELECT 1 FROM users WHERE id = user_id)
    )
);

-- Anonymization trigger for deleted users
CREATE OR REPLACE FUNCTION anonymize_user_logs()
RETURNS TRIGGER AS $$
BEGIN
    -- Replace all user_id references with anonymous ID
    UPDATE activity_logs 
    SET user_id = uuid_nil(),
        ip_address_hash = 'ANONYMIZED',
        user_agent_hash = 'ANONYMIZED',
        details = jsonb_strip_nulls(
            details - '{email,name,phone,address}'::text[]
        )
    WHERE user_id = OLD.id;
    
    UPDATE item_history 
    SET performed_by = uuid_nil(),
        notes = CASE 
            WHEN notes IS NOT NULL THEN '[Anonymized]' 
            ELSE NULL 
        END
    WHERE performed_by = OLD.id;
    
    UPDATE notifications 
    SET user_id = uuid_nil(),
        metadata = '{}'::jsonb
    WHERE user_id = OLD.id;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_anonymize_user_logs
BEFORE DELETE ON users
FOR EACH ROW EXECUTE FUNCTION anonymize_user_logs();
```

## 2. Personal Data Inventory

### Data Categories

```csharp
public enum PersonalDataCategory
{
    Identity,      // Name, email, phone
    Financial,     // Payment info, purchase history
    Behavioral,    // Usage patterns, preferences
    Location,      // IP addresses, timezone
    Content        // User-generated content (notes, photos)
}

[AttributeUsage(AttributeTargets.Property)]
public class PersonalDataAttribute : Attribute
{
    public PersonalDataCategory Category { get; }
    public bool RequiresEncryption { get; }
    public int RetentionDays { get; }
    
    public PersonalDataAttribute(
        PersonalDataCategory category, 
        bool requiresEncryption = false,
        int retentionDays = 365)
    {
        Category = category;
        RequiresEncryption = requiresEncryption;
        RetentionDays = retentionDays;
    }
}

public class User
{
    public Guid Id { get; set; }
    
    [PersonalData(PersonalDataCategory.Identity, true)]
    public string Email { get; set; }
    
    [PersonalData(PersonalDataCategory.Identity)]
    public string DisplayName { get; set; }
    
    [PersonalData(PersonalDataCategory.Location)]
    public string Timezone { get; set; }
    
    [PersonalData(PersonalDataCategory.Behavioral)]
    public UserPreferences Preferences { get; set; }
}
```

## 3. Right to Be Forgotten Implementation

```csharp
public class UserDeletionService
{
    private readonly ILogger<UserDeletionService> _logger;
    private readonly IDbContext _context;
    
    public async Task<DeletionResult> DeleteUserAsync(Guid userId, string reason)
    {
        using var transaction = await _context.BeginTransactionAsync();
        
        try
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return DeletionResult.NotFound;
            
            // 1. Export user data for their records (GDPR requirement)
            var exportedData = await ExportUserDataAsync(userId);
            
            // 2. Anonymize related data
            await AnonymizeUserDataAsync(userId);
            
            // 3. Delete user record (triggers anonymization of logs)
            _context.Users.Remove(user);
            
            // 4. Log the deletion (without personal data)
            await _context.DeletionLogs.AddAsync(new DeletionLog
            {
                DeletedAt = DateTime.UtcNow,
                Reason = reason,
                DataCategories = GetDataCategories(user),
                Success = true
            });
            
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();
            
            // 5. Send confirmation email before final deletion
            await SendDeletionConfirmationAsync(user.Email, exportedData);
            
            return DeletionResult.Success(exportedData);
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            _logger.LogError(ex, "Failed to delete user {UserId}", userId);
            return DeletionResult.Failed(ex.Message);
        }
    }
    
    private async Task AnonymizeUserDataAsync(Guid userId)
    {
        // Anonymize items created by user
        await _context.Database.ExecuteSqlRawAsync(@"
            UPDATE inventory_items 
            SET created_by = uuid_nil(), 
                updated_by = CASE 
                    WHEN updated_by = @userId THEN uuid_nil() 
                    ELSE updated_by 
                END,
                notes = CASE 
                    WHEN created_by = @userId THEN NULL 
                    ELSE notes 
                END
            WHERE created_by = @userId",
            new NpgsqlParameter("userId", userId));
        
        // Anonymize household ownership
        await _context.Database.ExecuteSqlRawAsync(@"
            UPDATE households 
            SET created_by = uuid_nil()
            WHERE created_by = @userId 
            AND EXISTS (
                SELECT 1 FROM household_members 
                WHERE household_id = households.id 
                AND user_id != @userId 
                AND role = 'admin'
            )",
            new NpgsqlParameter("userId", userId));
    }
}
```

## 4. Data Encryption at Rest

```csharp
public class EncryptionService
{
    private readonly IDataProtector _protector;
    
    public EncryptionService(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("PersonalData.v1");
    }
    
    public string Encrypt(string plaintext)
    {
        if (string.IsNullOrEmpty(plaintext)) return plaintext;
        return _protector.Protect(plaintext);
    }
    
    public string Decrypt(string ciphertext)
    {
        if (string.IsNullOrEmpty(ciphertext)) return ciphertext;
        return _protector.Unprotect(ciphertext);
    }
}

// Entity Framework Interceptor for automatic encryption
public class EncryptionInterceptor : SaveChangesInterceptor
{
    private readonly IEncryptionService _encryption;
    
    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData,
        InterceptionResult<int> result,
        CancellationToken cancellationToken = default)
    {
        var context = eventData.Context;
        
        foreach (var entry in context.ChangeTracker.Entries())
        {
            foreach (var property in entry.Properties)
            {
                var attribute = property.Metadata.PropertyInfo?
                    .GetCustomAttribute<PersonalDataAttribute>();
                    
                if (attribute?.RequiresEncryption == true && 
                    property.CurrentValue is string value)
                {
                    property.CurrentValue = _encryption.Encrypt(value);
                }
            }
        }
        
        return base.SavingChangesAsync(eventData, result, cancellationToken);
    }
}
```

## 5. Consent Management

```sql
CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    granted BOOLEAN NOT NULL,
    granted_at TIMESTAMP,
    revoked_at TIMESTAMP,
    ip_address_hash VARCHAR(64),
    version VARCHAR(20) NOT NULL, -- Version of terms/privacy policy
    CONSTRAINT valid_consent_type CHECK (consent_type IN (
        'marketing_emails',
        'data_analytics',
        'third_party_sharing',
        'telegram_notifications',
        'push_notifications'
    ))
);

CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);
CREATE INDEX idx_user_consents_active ON user_consents(user_id, consent_type) 
    WHERE revoked_at IS NULL;
```

```csharp
public class ConsentService
{
    public async Task<bool> HasConsentAsync(Guid userId, string consentType)
    {
        return await _context.UserConsents
            .AnyAsync(c => c.UserId == userId 
                && c.ConsentType == consentType 
                && c.Granted 
                && c.RevokedAt == null);
    }
    
    public async Task RecordConsentAsync(ConsentRequest request)
    {
        // Revoke previous consent of same type
        var existing = await _context.UserConsents
            .Where(c => c.UserId == request.UserId 
                && c.ConsentType == request.ConsentType 
                && c.RevokedAt == null)
            .FirstOrDefaultAsync();
            
        if (existing != null)
        {
            existing.RevokedAt = DateTime.UtcNow;
        }
        
        // Record new consent
        await _context.UserConsents.AddAsync(new UserConsent
        {
            UserId = request.UserId,
            ConsentType = request.ConsentType,
            Granted = request.Granted,
            GrantedAt = request.Granted ? DateTime.UtcNow : null,
            IpAddressHash = HashIpAddress(request.IpAddress),
            Version = GetCurrentPolicyVersion()
        });
        
        await _context.SaveChangesAsync();
    }
}
```

## 6. Data Retention Policy

```csharp
public class DataRetentionService : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            await CleanupOldDataAsync();
            await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
        }
    }
    
    private async Task CleanupOldDataAsync()
    {
        // Delete old activity logs (keep 90 days)
        await _context.Database.ExecuteSqlRawAsync(@"
            DELETE FROM activity_logs 
            WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days'");
        
        // Delete old notifications (keep 30 days)
        await _context.Database.ExecuteSqlRawAsync(@"
            DELETE FROM notifications 
            WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
            AND read_at IS NOT NULL");
        
        // Anonymize old item history (keep details for 1 year)
        await _context.Database.ExecuteSqlRawAsync(@"
            UPDATE item_history 
            SET notes = '[Retained for analytics]',
                previous_values = jsonb_strip_nulls(
                    previous_values - '{notes,image_url}'::text[]
                ),
                new_values = jsonb_strip_nulls(
                    new_values - '{notes,image_url}'::text[]
                )
            WHERE performed_at < CURRENT_TIMESTAMP - INTERVAL '1 year'");
    }
}
```

## 7. Data Portability

```csharp
public class DataExportService
{
    public async Task<ExportedData> ExportUserDataAsync(Guid userId)
    {
        var export = new ExportedData
        {
            ExportDate = DateTime.UtcNow,
            Format = "JSON",
            User = await GetUserDataAsync(userId),
            Households = await GetHouseholdDataAsync(userId),
            Items = await GetItemDataAsync(userId),
            ActivityLogs = await GetActivityLogsAsync(userId),
            Consents = await GetConsentsAsync(userId)
        };
        
        return export;
    }
    
    public async Task<byte[]> GenerateGdprExportAsync(Guid userId)
    {
        var data = await ExportUserDataAsync(userId);
        var json = JsonSerializer.Serialize(data, new JsonSerializerOptions
        {
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        });
        
        // Create ZIP with JSON and README
        using var stream = new MemoryStream();
        using (var archive = new ZipArchive(stream, ZipArchiveMode.Create, true))
        {
            var jsonEntry = archive.CreateEntry("user_data.json");
            using (var entryStream = jsonEntry.Open())
            using (var writer = new StreamWriter(entryStream))
            {
                await writer.WriteAsync(json);
            }
            
            var readmeEntry = archive.CreateEntry("README.txt");
            using (var entryStream = readmeEntry.Open())
            using (var writer = new StreamWriter(entryStream))
            {
                await writer.WriteAsync(GenerateReadme(data));
            }
        }
        
        return stream.ToArray();
    }
}
```

## 8. Privacy-Preserving Analytics

```csharp
public class PrivacyPreservingMetrics
{
    // Use differential privacy for aggregate metrics
    public async Task RecordMetricAsync(string metricName, double value)
    {
        // Add Laplace noise for differential privacy
        var noise = GenerateLaplaceNoise(sensitivity: 1.0, epsilon: 0.1);
        var noisyValue = value + noise;
        
        await _metrics.RecordAsync(new Metric
        {
            Name = metricName,
            Value = noisyValue,
            Timestamp = DateTime.UtcNow,
            // No user ID - only aggregate metrics
            HouseholdId = GetHashedHouseholdId(),
            DayOfWeek = DateTime.UtcNow.DayOfWeek,
            HourOfDay = DateTime.UtcNow.Hour
        });
    }
    
    private double GenerateLaplaceNoise(double sensitivity, double epsilon)
    {
        var random = new Random();
        var u = random.NextDouble() - 0.5;
        var b = sensitivity / epsilon;
        return -b * Math.Sign(u) * Math.Log(1 - 2 * Math.Abs(u));
    }
}
```

## 9. Security Headers & Cookie Configuration

```csharp
// Program.cs
app.Use(async (context, next) =>
{
    context.Response.Headers.Add("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Add("X-Frame-Options", "DENY");
    context.Response.Headers.Add("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Add("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Add("Permissions-Policy", 
        "geolocation=(), microphone=(), camera=()");
    
    await next();
});

// Cookie configuration
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.HttpOnly = true;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.Name = "pantrybot_session";
    options.ExpireTimeSpan = TimeSpan.FromMinutes(15);
    options.SlidingExpiration = true;
});
```

## 10. Compliance Checklist

- ✅ True anonymization (not pseudonymization) using uuid_nil()
- ✅ Encryption of sensitive personal data at rest
- ✅ Right to erasure (delete account) implementation
- ✅ Data portability (export user data)
- ✅ Consent management system
- ✅ Data retention policies
- ✅ Privacy-preserving analytics
- ✅ Audit logging without personal data after deletion
- ✅ Secure cookie configuration
- ✅ Data minimization principles