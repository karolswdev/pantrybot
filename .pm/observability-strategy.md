# Observability Strategy - MVP Implementation

## Overview
Observability is **NOT** deferred. It is a Day 1 requirement for production readiness. This document defines the observability implementation for MVP.

## 1. The Three Pillars (All in MVP)

### 1.1 Structured Logging

```csharp
// Program.cs
builder.Host.UseSerilog((context, services, configuration) => configuration
    .ReadFrom.Configuration(context.Configuration)
    .ReadFrom.Services(services)
    .Enrich.FromLogContext()
    .Enrich.WithCorrelationId()
    .Enrich.WithMachineName()
    .Enrich.WithEnvironmentName()
    .WriteTo.Console(new JsonFormatter())
    .WriteTo.OpenTelemetry(options =>
    {
        options.Endpoint = "http://otel-collector:4317";
        options.Protocol = OtlpProtocol.Grpc;
    }));

// Correlation ID Middleware
public class CorrelationIdMiddleware
{
    public async Task InvokeAsync(HttpContext context, RequestDelegate next)
    {
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault() 
            ?? Guid.NewGuid().ToString();
            
        context.Items["CorrelationId"] = correlationId;
        context.Response.Headers.Add("X-Correlation-ID", correlationId);
        
        using (LogContext.PushProperty("CorrelationId", correlationId))
        using (LogContext.PushProperty("UserId", context.User?.Identity?.Name))
        using (LogContext.PushProperty("RequestPath", context.Request.Path))
        {
            await next(context);
        }
    }
}
```

### 1.2 Distributed Tracing

```csharp
// Program.cs - OpenTelemetry Setup
builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService("Fridgr.API")
        .AddAttributes(new Dictionary<string, object>
        {
            ["deployment.environment"] = builder.Environment.EnvironmentName,
            ["service.version"] = Assembly.GetExecutingAssembly().GetName().Version?.ToString() ?? "1.0.0"
        }))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation(options =>
        {
            options.RecordException = true;
            options.Filter = (httpContext) => !httpContext.Request.Path.StartsWithSegments("/health");
        })
        .AddHttpClientInstrumentation()
        .AddEntityFrameworkCoreInstrumentation(options =>
        {
            options.SetDbStatementForText = true;
            options.SetDbStatementForStoredProcedure = true;
        })
        .AddSource("Fridgr.Application")
        .AddOtlpExporter(options =>
        {
            options.Endpoint = new Uri("http://otel-collector:4317");
        }));

// Custom Activity Source for Business Operations
public class InventoryService
{
    private static readonly ActivitySource ActivitySource = new("Fridgr.Application");
    
    public async Task<ItemDto> AddItemAsync(CreateItemRequest request)
    {
        using var activity = ActivitySource.StartActivity("AddItem", ActivityKind.Internal);
        activity?.SetTag("household.id", request.HouseholdId);
        activity?.SetTag("item.category", request.Category);
        
        try
        {
            // Business logic
            var result = await _repository.AddAsync(item);
            activity?.SetTag("item.id", result.Id);
            activity?.SetStatus(ActivityStatusCode.Ok);
            return result;
        }
        catch (Exception ex)
        {
            activity?.SetStatus(ActivityStatusCode.Error, ex.Message);
            activity?.RecordException(ex);
            throw;
        }
    }
}
```

### 1.3 Metrics

```csharp
// Metrics Configuration
builder.Services.AddOpenTelemetry()
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddMeter("Fridgr.Metrics")
        .AddOtlpExporter(options =>
        {
            options.Endpoint = new Uri("http://otel-collector:4317");
        }));

// Custom Business Metrics
public class FridgrMetrics
{
    private readonly Meter _meter;
    private readonly Counter<long> _itemsAdded;
    private readonly Counter<long> _itemsConsumed;
    private readonly Counter<long> _itemsExpired;
    private readonly Histogram<double> _apiResponseTime;
    private readonly UpDownCounter<long> _activeUsers;
    
    public FridgrMetrics(IMeterFactory meterFactory)
    {
        _meter = meterFactory.Create("Fridgr.Metrics");
        
        _itemsAdded = _meter.CreateCounter<long>("fridgr.items.added", 
            description: "Number of items added to inventory");
            
        _itemsConsumed = _meter.CreateCounter<long>("fridgr.items.consumed",
            description: "Number of items consumed from inventory");
            
        _itemsExpired = _meter.CreateCounter<long>("fridgr.items.expired",
            description: "Number of items that expired");
            
        _apiResponseTime = _meter.CreateHistogram<double>("fridgr.api.response_time",
            unit: "ms", description: "API response time in milliseconds");
            
        _activeUsers = _meter.CreateUpDownCounter<long>("fridgr.users.active",
            description: "Number of currently active users");
    }
    
    public void RecordItemAdded(string householdId, string category)
    {
        _itemsAdded.Add(1, new KeyValuePair<string, object?>("household.id", householdId),
                           new KeyValuePair<string, object?>("item.category", category));
    }
}
```

## 2. Health Checks (MVP)

```csharp
// Health Check Configuration
builder.Services.AddHealthChecks()
    .AddNpgSql(
        connectionString: builder.Configuration.GetConnectionString("Default"),
        name: "database",
        tags: new[] { "db", "sql", "postgresql" })
    .AddRedis(
        builder.Configuration.GetConnectionString("Redis"),
        name: "redis-cache",
        tags: new[] { "cache", "redis" })
    .AddUrlGroup(
        new Uri("https://api.telegram.org/bot/getMe"),
        name: "telegram-api",
        tags: new[] { "external", "telegram" })
    .AddCheck<CustomBusinessHealthCheck>("business-logic");

// Custom Business Health Check
public class CustomBusinessHealthCheck : IHealthCheck
{
    private readonly IDbContext _context;
    
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            // Check if we can query the database
            var itemCount = await _context.Items.CountAsync(cancellationToken);
            
            // Check if background jobs are running
            var lastJobRun = await _context.BackgroundJobs
                .OrderByDescending(j => j.LastRun)
                .FirstOrDefaultAsync(cancellationToken);
                
            if (lastJobRun?.LastRun < DateTime.UtcNow.AddHours(-1))
            {
                return HealthCheckResult.Degraded("Background jobs may be stalled");
            }
            
            return HealthCheckResult.Healthy($"System operational. {itemCount} items tracked.");
        }
        catch (Exception ex)
        {
            return HealthCheckResult.Unhealthy("Database connection failed", ex);
        }
    }
}

// Health Check Endpoints
app.MapHealthChecks("/health/live", new HealthCheckOptions
{
    Predicate = _ => false // Liveness - just check if service is responsive
});

app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("db") || check.Tags.Contains("cache"),
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});

app.MapHealthChecks("/health/startup", new HealthCheckOptions
{
    Predicate = _ => true, // All checks for startup probe
    ResponseWriter = UIResponseWriter.WriteHealthCheckUIResponse
});
```

## 3. Application Performance Monitoring (APM)

```csharp
// Performance Tracking Middleware
public class PerformanceTrackingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly FridgrMetrics _metrics;
    private readonly ILogger<PerformanceTrackingMiddleware> _logger;
    
    public async Task InvokeAsync(HttpContext context)
    {
        var stopwatch = Stopwatch.StartNew();
        
        try
        {
            await _next(context);
        }
        finally
        {
            stopwatch.Stop();
            var responseTime = stopwatch.Elapsed.TotalMilliseconds;
            
            _metrics.RecordResponseTime(
                context.Request.Path,
                context.Request.Method,
                context.Response.StatusCode,
                responseTime);
            
            if (responseTime > 1000) // Log slow requests
            {
                _logger.LogWarning("Slow request detected: {Method} {Path} took {ResponseTime}ms",
                    context.Request.Method,
                    context.Request.Path,
                    responseTime);
            }
        }
    }
}
```

## 4. Error Tracking

```csharp
// Global Exception Handler with Detailed Tracking
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;
    
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            var errorId = Guid.NewGuid().ToString();
            
            _logger.LogError(ex, 
                "Unhandled exception occurred. ErrorId: {ErrorId}, Path: {Path}, Method: {Method}, User: {User}",
                errorId,
                context.Request.Path,
                context.Request.Method,
                context.User?.Identity?.Name ?? "Anonymous");
            
            // Record exception in metrics
            Activity.Current?.RecordException(ex);
            Activity.Current?.SetStatus(ActivityStatusCode.Error, ex.Message);
            
            await HandleExceptionAsync(context, ex, errorId);
        }
    }
    
    private async Task HandleExceptionAsync(HttpContext context, Exception exception, string errorId)
    {
        context.Response.StatusCode = exception switch
        {
            NotFoundException => 404,
            ValidationException => 400,
            UnauthorizedException => 401,
            ConflictException => 409,
            _ => 500
        };
        
        await context.Response.WriteAsJsonAsync(new
        {
            error = new
            {
                id = errorId,
                message = exception.Message,
                type = exception.GetType().Name,
                timestamp = DateTime.UtcNow,
                path = context.Request.Path.ToString()
            }
        });
    }
}
```

## 5. Dashboard & Alerting (MVP with Open Source Stack)

### Docker Compose for Observability Stack

```yaml
version: '3.8'

services:
  otel-collector:
    image: otel/opentelemetry-collector-contrib:latest
    command: ["--config=/etc/otel-collector-config.yaml"]
    volumes:
      - ./otel-collector-config.yaml:/etc/otel-collector-config.yaml
    ports:
      - "4317:4317"   # OTLP gRPC
      - "4318:4318"   # OTLP HTTP
      - "8888:8888"   # Prometheus metrics
      
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
      
  grafana:
    image: grafana/grafana:latest
    environment:
      - GF_AUTH_ANONYMOUS_ENABLED=true
      - GF_AUTH_ANONYMOUS_ORG_ROLE=Admin
    ports:
      - "3000:3000"
    volumes:
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
      
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
```

### Key Metrics to Track (MVP)

1. **Golden Signals**
   - Latency: P50, P95, P99 response times
   - Traffic: Requests per second
   - Errors: 4xx and 5xx rates
   - Saturation: CPU, memory, database connections

2. **Business Metrics**
   - Items added/consumed per hour
   - Expiration warning effectiveness
   - User engagement (active users, sessions)
   - API usage by endpoint

3. **Alert Rules**
   ```yaml
   # prometheus-alerts.yml
   groups:
     - name: fridgr
       rules:
         - alert: HighErrorRate
           expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
           for: 5m
           annotations:
             summary: "High error rate detected"
             
         - alert: SlowAPIResponse
           expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1
           for: 10m
           annotations:
             summary: "95th percentile response time above 1 second"
             
         - alert: DatabaseDown
           expr: up{job="postgresql"} == 0
           for: 1m
           annotations:
             summary: "PostgreSQL database is down"
   ```

## 6. Development Tools

```csharp
// MiniProfiler for Development
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddMiniProfiler(options =>
    {
        options.RouteBasePath = "/profiler";
        options.ColorScheme = StackExchange.Profiling.ColorScheme.Dark;
    }).AddEntityFramework();
    
    app.UseMiniProfiler();
}

// Swagger with Health Check UI
builder.Services.AddHealthChecksUI()
    .AddInMemoryStorage();
    
app.MapHealthChecksUI(options =>
{
    options.UIPath = "/health-ui";
    options.ApiPath = "/health-api";
});
```

## 7. Cost-Effective Implementation

For MVP with minimal cost:
1. Use OpenTelemetry Collector to export to multiple backends
2. Start with open-source stack (Prometheus + Grafana + Loki)
3. Use sampling for traces (sample 10% of requests initially)
4. Implement log levels properly (Debug only in dev, Info in production)
5. Use structured logging to reduce storage needs

## 8. Migration Path

When ready to scale:
1. Cloud-native: Azure Monitor / AWS CloudWatch
2. Commercial APM: DataDog, New Relic, or Dynatrace
3. Dedicated log management: ELK Stack or Splunk
4. Incident management: PagerDuty or Opsgenie integration