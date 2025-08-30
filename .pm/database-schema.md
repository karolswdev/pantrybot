# Database Schema Requirements

## Database Configuration

### PostgreSQL Settings
- **Version**: PostgreSQL 15+
- **Character Set**: UTF8
- **Collation**: en_US.UTF-8
- **Timezone**: UTC
- **Connection Pool**: Min 10, Max 100 connections

### Multi-tenancy Strategy
- Row-level security with HouseholdId in all tenant-specific tables
- Global query filters in Entity Framework Core
- Composite indexes on (HouseholdId, frequently queried columns)

## Core Schema

### Users Table
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    normalized_email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    avatar_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    failed_login_attempts INT DEFAULT 0,
    lockout_end TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT false,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_login_at TIMESTAMP,
    deleted_at TIMESTAMP,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

CREATE INDEX idx_users_email ON users(normalized_email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;
```

### Households Table
```sql
CREATE TABLE households (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP,
    CONSTRAINT name_length CHECK (LENGTH(name) >= 1)
);

CREATE INDEX idx_households_created_by ON households(created_by);
CREATE INDEX idx_households_deleted_at ON households(deleted_at) WHERE deleted_at IS NULL;
```

### Household Members Junction Table
```sql
CREATE TABLE household_members (
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    invited_by UUID REFERENCES users(id),
    invitation_accepted_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    notification_settings JSONB DEFAULT '{}',
    PRIMARY KEY (household_id, user_id),
    CONSTRAINT valid_role CHECK (role IN ('admin', 'member', 'viewer'))
);

CREATE INDEX idx_household_members_user_id ON household_members(user_id);
CREATE INDEX idx_household_members_role ON household_members(household_id, role);
```

### Inventory Items Table
```sql
-- Simplified: Only tracks CURRENT state of items in inventory
-- Historical data is tracked in item_history table
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3) NOT NULL DEFAULT 1,
    unit VARCHAR(50),
    location VARCHAR(20) NOT NULL,
    category VARCHAR(50),
    brand VARCHAR(100),
    barcode VARCHAR(50),
    expiration_date DATE,
    expiration_date_type VARCHAR(20) DEFAULT 'useBy', -- 'useBy' or 'bestBefore'
    purchase_date DATE,
    price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    image_url VARCHAR(500),
    is_shared BOOLEAN DEFAULT true,
    row_version BIGINT DEFAULT 0, -- For optimistic concurrency control
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    CONSTRAINT valid_quantity CHECK (quantity > 0), -- Items with 0 quantity are removed
    CONSTRAINT valid_location CHECK (location IN ('fridge', 'freezer', 'pantry', 'other')),
    CONSTRAINT valid_expiration_type CHECK (expiration_date_type IN ('useBy', 'bestBefore')),
    CONSTRAINT valid_dates CHECK (
        expiration_date IS NULL OR expiration_date >= purchase_date
    )
);

-- Note: No consumed_at, consumed_by, deleted_at, deleted_by fields
-- When an item is consumed/deleted, it is removed from this table
-- and the action is recorded in item_history

CREATE INDEX idx_items_household_id ON inventory_items(household_id);
CREATE INDEX idx_items_household_location ON inventory_items(household_id, location);
CREATE INDEX idx_items_household_expiration ON inventory_items(household_id, expiration_date) 
    WHERE expiration_date IS NOT NULL;
CREATE INDEX idx_items_household_category ON inventory_items(household_id, category);
CREATE INDEX idx_items_barcode ON inventory_items(barcode) WHERE barcode IS NOT NULL;
CREATE INDEX idx_items_row_version ON inventory_items(id, row_version); -- For concurrency checks
```

### Item History Table (Audit Log)
```sql
CREATE TABLE item_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    quantity_change DECIMAL(10,3),
    previous_values JSONB,
    new_values JSONB,
    reason VARCHAR(255),
    notes TEXT,
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    performed_by UUID NOT NULL REFERENCES users(id),
    CONSTRAINT valid_action CHECK (action IN (
        'created', 'updated', 'consumed', 'wasted', 
        'moved', 'deleted', 'restored'
    ))
);

CREATE INDEX idx_item_history_item_id ON item_history(item_id);
CREATE INDEX idx_item_history_household_id ON item_history(household_id);
CREATE INDEX idx_item_history_performed_at ON item_history(household_id, performed_at DESC);
```

### Shopping Lists Table
```sql
CREATE TABLE shopping_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMP,
    updated_by UUID REFERENCES users(id),
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id)
);

CREATE INDEX idx_shopping_lists_household_id ON shopping_lists(household_id);
CREATE INDEX idx_shopping_lists_active ON shopping_lists(household_id, is_active);
```

### Shopping List Items Table
```sql
CREATE TABLE shopping_list_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    quantity DECIMAL(10,3),
    unit VARCHAR(50),
    category VARCHAR(50),
    notes TEXT,
    is_completed BOOLEAN DEFAULT false,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    added_by UUID NOT NULL REFERENCES users(id),
    completed_at TIMESTAMP,
    completed_by UUID REFERENCES users(id),
    sort_order INT DEFAULT 0
);

CREATE INDEX idx_shopping_list_items_list_id ON shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_completed ON shopping_list_items(shopping_list_id, is_completed);
```

### Notification Preferences Table
```sql
CREATE TABLE notification_preferences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT false,
    telegram_enabled BOOLEAN DEFAULT false,
    telegram_chat_id VARCHAR(100),
    telegram_username VARCHAR(100),
    expiration_warning_days INT DEFAULT 3,
    low_stock_threshold INT DEFAULT 2,
    notification_types TEXT[] DEFAULT ARRAY['expiration', 'low_stock', 'shopping_reminder'],
    preferred_time TIME DEFAULT '09:00:00',
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    PRIMARY KEY (user_id, household_id),
    CONSTRAINT valid_warning_days CHECK (expiration_warning_days BETWEEN 1 AND 30),
    CONSTRAINT valid_threshold CHECK (low_stock_threshold >= 0)
);

CREATE INDEX idx_notification_prefs_telegram ON notification_preferences(telegram_chat_id) 
    WHERE telegram_enabled = true;
```

### Notifications Table
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    household_id UUID REFERENCES households(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    scheduled_for TIMESTAMP,
    sent_at TIMESTAMP,
    read_at TIMESTAMP,
    error_message TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_type CHECK (type IN (
        'expiration_warning', 'item_expired', 'low_stock', 
        'shopping_reminder', 'member_joined', 'member_left'
    )),
    CONSTRAINT valid_channel CHECK (channel IN ('email', 'in_app', 'push', 'telegram')),
    CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed', 'cancelled'))
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'pending';
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_for) 
    WHERE status = 'pending' AND scheduled_for IS NOT NULL;
CREATE INDEX idx_notifications_read ON notifications(user_id, read_at) 
    WHERE read_at IS NULL;
```

### Activity Logs Table
```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    entity_name VARCHAR(200),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    correlation_id UUID
);

CREATE INDEX idx_activity_logs_household_id ON activity_logs(household_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(household_id, timestamp DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX idx_activity_logs_correlation ON activity_logs(correlation_id);
```

### Categories Table (Reference Data)
```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    color VARCHAR(7),
    parent_id UUID REFERENCES categories(id),
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (name, display_name, icon, color, sort_order) VALUES
    ('produce', 'Produce', 'apple', '#4CAF50', 1),
    ('dairy', 'Dairy', 'cheese', '#2196F3', 2),
    ('meat', 'Meat & Seafood', 'meat', '#F44336', 3),
    ('bakery', 'Bakery', 'bread', '#FF9800', 4),
    ('frozen', 'Frozen', 'snowflake', '#00BCD4', 5),
    ('pantry', 'Pantry', 'cabinet', '#795548', 6),
    ('beverages', 'Beverages', 'bottle', '#9C27B0', 7),
    ('snacks', 'Snacks', 'cookie', '#FFC107', 8),
    ('condiments', 'Condiments & Sauces', 'sauce', '#FF5722', 9),
    ('other', 'Other', 'box', '#607D8B', 10);
```

### Units Table (Reference Data)
```sql
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(50) NOT NULL,
    abbreviation VARCHAR(10),
    type VARCHAR(20) NOT NULL,
    base_unit VARCHAR(50),
    conversion_factor DECIMAL(10,6),
    is_metric BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    CONSTRAINT valid_type CHECK (type IN ('weight', 'volume', 'count', 'length'))
);

INSERT INTO units (name, display_name, abbreviation, type, is_metric, sort_order) VALUES
    ('piece', 'Piece', 'pc', 'count', false, 1),
    ('dozen', 'Dozen', 'dz', 'count', false, 2),
    ('pound', 'Pound', 'lb', 'weight', false, 3),
    ('ounce', 'Ounce', 'oz', 'weight', false, 4),
    ('kilogram', 'Kilogram', 'kg', 'weight', true, 5),
    ('gram', 'Gram', 'g', 'weight', true, 6),
    ('liter', 'Liter', 'L', 'volume', true, 7),
    ('milliliter', 'Milliliter', 'mL', 'volume', true, 8),
    ('gallon', 'Gallon', 'gal', 'volume', false, 9),
    ('quart', 'Quart', 'qt', 'volume', false, 10),
    ('cup', 'Cup', 'cup', 'volume', false, 11);
```

### Telegram Links Table
```sql
CREATE TABLE telegram_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    telegram_user_id BIGINT UNIQUE NOT NULL,
    telegram_username VARCHAR(100),
    chat_id BIGINT NOT NULL,
    verification_code VARCHAR(10),
    verified BOOLEAN DEFAULT false,
    linked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP,
    CONSTRAINT unique_user_telegram UNIQUE (user_id)
);

CREATE INDEX idx_telegram_links_user_id ON telegram_links(user_id);
CREATE INDEX idx_telegram_links_chat_id ON telegram_links(chat_id);
CREATE INDEX idx_telegram_links_verification ON telegram_links(verification_code) 
    WHERE verified = false;
```

## Views

### Expiring Items View
```sql
CREATE VIEW expiring_items_view AS
SELECT 
    i.id,
    i.household_id,
    i.name,
    i.quantity,
    i.unit,
    i.location,
    i.category,
    i.expiration_date,
    i.best_before_date,
    CASE 
        WHEN i.expiration_date IS NOT NULL THEN 
            i.expiration_date - CURRENT_DATE
        WHEN i.best_before_date IS NOT NULL THEN 
            i.best_before_date - CURRENT_DATE
        ELSE NULL
    END AS days_until_expiration,
    CASE 
        WHEN i.expiration_date <= CURRENT_DATE OR i.best_before_date <= CURRENT_DATE THEN 'expired'
        WHEN i.expiration_date <= CURRENT_DATE + INTERVAL '3 days' OR 
             i.best_before_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'expiring_soon'
        ELSE 'fresh'
    END AS expiration_status,
    u.display_name AS created_by_name
FROM inventory_items i
LEFT JOIN users u ON i.created_by = u.id
WHERE i.deleted_at IS NULL
  AND (i.expiration_date IS NOT NULL OR i.best_before_date IS NOT NULL);
```

### Household Statistics View
```sql
CREATE VIEW household_statistics AS
SELECT 
    h.id AS household_id,
    COUNT(DISTINCT i.id) FILTER (WHERE i.deleted_at IS NULL) AS total_items,
    COUNT(DISTINCT i.id) FILTER (
        WHERE i.deleted_at IS NULL 
        AND (i.expiration_date <= CURRENT_DATE + INTERVAL '3 days' 
             OR i.best_before_date <= CURRENT_DATE + INTERVAL '3 days')
    ) AS expiring_items,
    COUNT(DISTINCT i.id) FILTER (
        WHERE i.deleted_at IS NULL 
        AND (i.expiration_date <= CURRENT_DATE 
             OR i.best_before_date <= CURRENT_DATE)
    ) AS expired_items,
    COUNT(DISTINCT ih.id) FILTER (
        WHERE ih.action = 'consumed' 
        AND ih.performed_at >= CURRENT_DATE - INTERVAL '30 days'
    ) AS consumed_this_month,
    COUNT(DISTINCT ih.id) FILTER (
        WHERE ih.action = 'wasted' 
        AND ih.performed_at >= CURRENT_DATE - INTERVAL '30 days'
    ) AS wasted_this_month,
    SUM(i.price * i.quantity) FILTER (WHERE i.deleted_at IS NULL) AS total_value
FROM households h
LEFT JOIN inventory_items i ON h.id = i.household_id
LEFT JOIN item_history ih ON i.id = ih.item_id
GROUP BY h.id;
```

## Indexes Strategy

### Primary Indexes
- All primary keys have automatic B-tree indexes
- Foreign keys should have indexes for JOIN performance

### Composite Indexes
- Include household_id as first column for multi-tenant queries
- Add frequently filtered columns (location, category, status)

### Partial Indexes
- Use WHERE clauses for soft-deleted records
- Optimize for common query patterns

### Full-Text Search (Future)
```sql
-- For item search functionality
CREATE INDEX idx_items_search ON inventory_items 
USING gin(to_tsvector('english', name || ' ' || COALESCE(notes, '')));
```

## Database Migrations

### Migration Naming Convention
- `YYYYMMDD_HHMMSS_DescriptiveName.sql`
- Example: `20240130_120000_CreateUsersTable.sql`

### Migration Tools
- Entity Framework Core Migrations for C#/.NET
- Maintain both up and down migrations
- Version control all migration files

### Sample Migration
```sql
-- Up Migration
BEGIN;

CREATE TABLE IF NOT EXISTS __EFMigrationsHistory (
    MigrationId varchar(150) NOT NULL,
    ProductVersion varchar(32) NOT NULL,
    CONSTRAINT PK___EFMigrationsHistory PRIMARY KEY (MigrationId)
);

-- Create tables here

INSERT INTO __EFMigrationsHistory (MigrationId, ProductVersion)
VALUES ('20240130120000_InitialCreate', '8.0.0');

COMMIT;

-- Down Migration
BEGIN;

-- Drop tables in reverse order

DELETE FROM __EFMigrationsHistory WHERE MigrationId = '20240130120000_InitialCreate';

COMMIT;
```

## Performance Considerations

### Query Optimization
- Use EXPLAIN ANALYZE for slow queries
- Maintain statistics with ANALYZE command
- Consider materialized views for complex aggregations

### Partitioning Strategy (Future)
```sql
-- Partition activity_logs by month for better performance
CREATE TABLE activity_logs_2024_01 PARTITION OF activity_logs
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Connection Pooling
```csharp
// Entity Framework configuration
services.AddDbContext<FridgrDbContext>(options =>
    options.UseNpgsql(connectionString, npgsqlOptions =>
    {
        npgsqlOptions.EnableRetryOnFailure(3);
    })
    .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking)
);
```

## Backup and Recovery

### Backup Strategy
- Daily automated backups
- Point-in-time recovery enabled
- Backup retention: 30 days
- Test restore procedures monthly

### Backup Commands
```bash
# Full backup
pg_dump -h localhost -U fridgr -d fridgr -F c -b -v -f fridgr_backup_$(date +%Y%m%d).backup

# Restore
pg_restore -h localhost -U fridgr -d fridgr -v fridgr_backup_20240130.backup
```

## Security Considerations

### Row-Level Security (RLS)
```sql
-- Enable RLS on inventory_items
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- Create policy for household members
CREATE POLICY household_member_policy ON inventory_items
    FOR ALL
    TO application_user
    USING (
        household_id IN (
            SELECT household_id 
            FROM household_members 
            WHERE user_id = current_setting('app.current_user_id')::uuid
        )
    );
```

### Encryption
- Use pgcrypto extension for sensitive data
- Encrypt PII at rest
- SSL/TLS for connections

### Audit Requirements
- Log all data modifications
- Maintain audit trail for compliance
- Regular security assessments