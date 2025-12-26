/**
 * Prometheus Metrics Configuration
 *
 * Defines application metrics for monitoring:
 * - HTTP request metrics (latency, count, errors)
 * - Business metrics (inventory, households, users)
 * - Database connection pool metrics
 * - Node.js runtime metrics
 */

const promClient = require('prom-client');

// Create a Registry to register metrics
const register = new promClient.Registry();

// Add default Node.js metrics (event loop, heap, GC, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'pantrybot_',
  labels: { service: 'pantrybot-backend' }
});

// ============================================
// HTTP Request Metrics
// ============================================

/**
 * HTTP request duration histogram
 * Tracks response time distribution
 */
const httpRequestDuration = new promClient.Histogram({
  name: 'pantrybot_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register]
});

/**
 * HTTP request counter
 * Tracks total number of requests
 */
const httpRequestTotal = new promClient.Counter({
  name: 'pantrybot_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

/**
 * HTTP request errors counter
 * Tracks 4xx and 5xx responses
 */
const httpErrorsTotal = new promClient.Counter({
  name: 'pantrybot_http_errors_total',
  help: 'Total number of HTTP errors (4xx and 5xx)',
  labelNames: ['method', 'route', 'status_code', 'error_type'],
  registers: [register]
});

/**
 * Active HTTP connections gauge
 */
const httpActiveConnections = new promClient.Gauge({
  name: 'pantrybot_http_active_connections',
  help: 'Number of active HTTP connections',
  registers: [register]
});

// ============================================
// Business Metrics
// ============================================

/**
 * User registration counter
 */
const userRegistrations = new promClient.Counter({
  name: 'pantrybot_user_registrations_total',
  help: 'Total number of user registrations',
  registers: [register]
});

/**
 * Login attempts counter
 */
const loginAttempts = new promClient.Counter({
  name: 'pantrybot_login_attempts_total',
  help: 'Total number of login attempts',
  labelNames: ['success'],
  registers: [register]
});

/**
 * Inventory items gauge (by household)
 */
const inventoryItemsGauge = new promClient.Gauge({
  name: 'pantrybot_inventory_items_count',
  help: 'Current number of inventory items',
  labelNames: ['household_id', 'status'],
  registers: [register]
});

/**
 * Inventory operations counter
 */
const inventoryOperations = new promClient.Counter({
  name: 'pantrybot_inventory_operations_total',
  help: 'Total number of inventory operations',
  labelNames: ['operation', 'household_id'],
  registers: [register]
});

/**
 * Items wasted counter (for waste tracking)
 */
const itemsWasted = new promClient.Counter({
  name: 'pantrybot_items_wasted_total',
  help: 'Total number of items marked as wasted',
  labelNames: ['reason', 'category'],
  registers: [register]
});

/**
 * Items consumed counter
 */
const itemsConsumed = new promClient.Counter({
  name: 'pantrybot_items_consumed_total',
  help: 'Total number of items consumed',
  labelNames: ['category'],
  registers: [register]
});

/**
 * Expiring items gauge
 */
const expiringItemsGauge = new promClient.Gauge({
  name: 'pantrybot_expiring_items_count',
  help: 'Number of items expiring within warning period',
  labelNames: ['household_id', 'days_until_expiry'],
  registers: [register]
});

/**
 * Households gauge
 */
const householdsGauge = new promClient.Gauge({
  name: 'pantrybot_households_count',
  help: 'Total number of households',
  registers: [register]
});

/**
 * Household members gauge
 */
const householdMembersGauge = new promClient.Gauge({
  name: 'pantrybot_household_members_count',
  help: 'Number of members per household',
  labelNames: ['household_id', 'role'],
  registers: [register]
});

// ============================================
// WebSocket Metrics
// ============================================

/**
 * Active WebSocket connections gauge
 */
const websocketConnections = new promClient.Gauge({
  name: 'pantrybot_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  registers: [register]
});

/**
 * WebSocket messages counter
 */
const websocketMessages = new promClient.Counter({
  name: 'pantrybot_websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['event_type', 'direction'],
  registers: [register]
});

// ============================================
// Database Metrics
// ============================================

/**
 * Database query duration histogram
 */
const dbQueryDuration = new promClient.Histogram({
  name: 'pantrybot_db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'model'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
  registers: [register]
});

/**
 * Database connection pool gauge
 */
const dbConnectionPool = new promClient.Gauge({
  name: 'pantrybot_db_connection_pool',
  help: 'Database connection pool status',
  labelNames: ['status'],
  registers: [register]
});

// ============================================
// Notification Metrics
// ============================================

/**
 * Notifications sent counter
 */
const notificationsSent = new promClient.Counter({
  name: 'pantrybot_notifications_sent_total',
  help: 'Total number of notifications sent',
  labelNames: ['channel', 'type'],
  registers: [register]
});

/**
 * Notification delivery failures counter
 */
const notificationFailures = new promClient.Counter({
  name: 'pantrybot_notification_failures_total',
  help: 'Total number of notification delivery failures',
  labelNames: ['channel', 'type', 'error'],
  registers: [register]
});

// ============================================
// Helper Functions
// ============================================

/**
 * Normalize route path for metrics labels
 * Replaces IDs with :id placeholder to avoid high cardinality
 */
function normalizeRoute(path) {
  if (!path) return 'unknown';

  return path
    // Replace UUIDs
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id')
    // Replace numeric IDs
    .replace(/\/\d+/g, '/:id')
    // Replace alphanumeric IDs (24+ chars, likely MongoDB ObjectIds)
    .replace(/\/[a-f0-9]{24,}/gi, '/:id');
}

/**
 * Get error type from status code
 */
function getErrorType(statusCode) {
  if (statusCode >= 500) return 'server_error';
  if (statusCode === 401) return 'authentication';
  if (statusCode === 403) return 'authorization';
  if (statusCode === 404) return 'not_found';
  if (statusCode === 400) return 'validation';
  if (statusCode === 409) return 'conflict';
  if (statusCode === 429) return 'rate_limit';
  return 'client_error';
}

// ============================================
// Exports
// ============================================

module.exports = {
  // Registry
  register,

  // HTTP Metrics
  httpRequestDuration,
  httpRequestTotal,
  httpErrorsTotal,
  httpActiveConnections,

  // Business Metrics
  userRegistrations,
  loginAttempts,
  inventoryItemsGauge,
  inventoryOperations,
  itemsWasted,
  itemsConsumed,
  expiringItemsGauge,
  householdsGauge,
  householdMembersGauge,

  // WebSocket Metrics
  websocketConnections,
  websocketMessages,

  // Database Metrics
  dbQueryDuration,
  dbConnectionPool,

  // Notification Metrics
  notificationsSent,
  notificationFailures,

  // Helper Functions
  normalizeRoute,
  getErrorType
};
