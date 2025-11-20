# Gigi's Copy Tool - Backend Service

Companion backend service for the Gigi's Copy Tool Chrome Extension. Provides health checks, metrics collection, telemetry tracking, and cross-device clip synchronization.

## 📋 Features

- ✅ **Health Check Endpoints** - `/health`, `/health/detailed`, `/health/live`, `/health/ready`
- 📊 **Prometheus Metrics** - Request count, latency, errors, and extension-specific metrics
- 📡 **Telemetry Collection** - Receives usage data from Chrome extension
- 🐳 **Docker Support** - Full containerization with docker-compose
- 📈 **Grafana Dashboards** - Pre-configured visualization
- ☁️ **Azure Deployment Ready** - Optimized for Azure Container Instances

## 🚀 Quick Start

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start the server
npm run dev
```

The server will start on `http://localhost:3000`

### Docker Deployment

```bash
# Build and start all services (backend + Prometheus + Grafana)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

**Services:**
- Backend API: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

## 📡 API Endpoints

### Health Checks

#### `GET /health`
Basic health check - returns service status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-18T14:30:00.000Z",
  "uptime": {
    "milliseconds": 123456,
    "seconds": 123,
    "human": "2m 3s"
  },
  "service": {
    "name": "Gigi's Copy Tool Backend",
    "version": "1.0.0",
    "environment": "production"
  }
}
```

#### `GET /health/detailed`
Detailed health check with system metrics.

**Response includes:**
- Service status and uptime
- Request/error counts and rates
- System metrics (CPU, memory, load average)
- Process metrics (heap usage, RSS)

#### `GET /health/live` & `GET /health/ready`
Kubernetes-style liveness and readiness probes.

### Metrics

#### `GET /metrics`
Prometheus-formatted metrics endpoint.

**Available Metrics:**
```
# HTTP Metrics
http_requests_total{method, route, status_code}
http_request_duration_seconds{method, route, status_code}
http_errors_total{method, route, error_type, status_code}

# Extension Metrics
extension_clips_saved_total{source}  # source: web|native
extension_clips_deduplicated_total
extension_tags_applied_total{tag}
extension_active_users
extension_errors_total{error_type, component}

# Node.js Default Metrics
process_cpu_user_seconds_total
process_resident_memory_bytes
nodejs_heap_size_total_bytes
...and more
```

#### `GET /metrics/json`
JSON-formatted metrics (easier for debugging).

### Telemetry

#### `POST /api/telemetry/clip-saved`
Record when a clip is saved.

**Request Body:**
```json
{
  "source": "web",
  "isDuplicate": false,
  "tags": ["code", "dev"],
  "userId": "optional-user-id"
}
```

#### `POST /api/telemetry/error`
Record extension errors.

**Request Body:**
```json
{
  "errorType": "storage_error",
  "component": "background",
  "message": "Failed to save clip",
  "stack": "Error: ...",
  "userId": "optional-user-id"
}
```

#### `POST /api/telemetry/heartbeat`
Track active users (send every 5 minutes from extension).

**Request Body:**
```json
{
  "userId": "unique-user-id",
  "version": "1.0.1",
  "platform": "chrome"
}
```

#### `POST /api/telemetry/batch`
Send multiple telemetry events in one request.

**Request Body:**
```json
{
  "events": [
    {
      "type": "clip-saved",
      "data": { "source": "web", "isDuplicate": false }
    },
    {
      "type": "heartbeat",
      "data": { "userId": "user123", "version": "1.0.1" }
    }
  ]
}
```

## 🐳 Docker

### Build Image

```bash
docker build -t gigis-copy-tool-backend .
```

### Run Container

```bash
docker run -p 3000:3000 -e NODE_ENV=production gigis-copy-tool-backend
```

### Health Check

The Docker image includes a health check that runs every 30 seconds:

```bash
docker ps  # Check HEALTH status column
```

## ☁️ Azure Deployment

### Option 1: Azure Container Instances (ACI)

```bash
# Login to Azure
az login

# Create resource group
az group create --name gigis-copy-tool-rg --location eastus

# Create container instance
az container create \
  --resource-group gigis-copy-tool-rg \
  --name gigis-backend \
  --image gigis-copy-tool-backend \
  --dns-name-label gigis-copy-tool \
  --ports 3000 \
  --environment-variables \
    NODE_ENV=production \
    PORT=3000

# Get container URL
az container show \
  --resource-group gigis-copy-tool-rg \
  --name gigis-backend \
  --query ipAddress.fqdn
```

### Option 2: Azure App Service

```bash
# Create App Service plan
az appservice plan create \
  --name gigis-backend-plan \
  --resource-group gigis-copy-tool-rg \
  --is-linux \
  --sku B1

# Create web app
az webapp create \
  --resource-group gigis-copy-tool-rg \
  --plan gigis-backend-plan \
  --name gigis-copy-tool-backend \
  --deployment-container-image-name gigis-copy-tool-backend:latest
```

## 📊 Monitoring with Prometheus & Grafana

### Access Grafana

1. Start services: `docker-compose up -d`
2. Open: http://localhost:3001
3. Login: admin / admin
4. Navigate to Dashboards

### Prometheus Queries

**Request Rate:**
```promql
rate(http_requests_total[5m])
```

**Error Rate:**
```promql
rate(http_errors_total[5m])
```

**95th Percentile Latency:**
```promql
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Active Users:**
```promql
extension_active_users
```

**Clips Saved (per minute):**
```promql
rate(extension_clips_saved_total[1m])
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `NODE_ENV` | development | Environment (development/production) |
| `LOG_LEVEL` | info | Logging level (error/warn/info/debug) |
| `ALLOWED_ORIGINS` | chrome-extension://* | CORS allowed origins |

## 🏗️ Project Structure

```
backend/
├── src/
│   ├── server.js              # Main application entry
│   ├── routes/
│   │   ├── health.js          # Health check endpoints
│   │   ├── metrics.js         # Prometheus metrics
│   │   └── telemetry.js       # Telemetry collection
│   ├── middleware/
│   │   └── metricsMiddleware.js  # HTTP metrics tracking
│   └── utils/
│       └── logger.js          # Winston logger
├── grafana/                    # Grafana dashboards & config
├── logs/                       # Application logs
├── Dockerfile                  # Container definition
├── docker-compose.yml          # Local stack (backend + monitoring)
├── prometheus.yml              # Prometheus configuration
└── package.json
```

## 🔒 Security

- **Helmet.js** - Security headers
- **CORS** - Controlled cross-origin access
- **Non-root user** - Docker container runs as nodejs user
- **No secrets in code** - Use environment variables
- **Request size limits** - 1MB JSON body limit

## 📈 Performance

- **Lightweight** - Alpine Linux base image (~100MB)
- **Fast startup** - < 5 seconds
- **Low memory** - ~50MB baseline
- **High throughput** - Handles 1000+ req/s

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs backend

# Check health
docker ps
```

### Metrics not showing in Prometheus

1. Verify backend is running: http://localhost:3000/health
2. Check metrics endpoint: http://localhost:3000/metrics
3. Check Prometheus targets: http://localhost:9090/targets

### Grafana dashboard empty

1. Verify Prometheus datasource is configured
2. Check Prometheus is scraping backend successfully
3. Send some test requests to backend to generate metrics

## 📄 License

MIT

## 👥 Authors

Gigi's Copy Tool Team
