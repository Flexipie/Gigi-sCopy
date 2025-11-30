# DevOps Assignment Report
**Project:** Gigi's Copy Tool - Chrome Extension  
**Student:** Felix  
**Date:** November 2025     
**Disclaimer** AI was used for structuring this report for markdown :)

---

## Executive Summary

This report documents the improvements made to the Chrome Extension Gigi's Copy Tool project to better use best practices, including code refactoring especially for code smells, comprehensive testing, CI/CD pipeline, and the addition of a backend microservice for cross-device synchronization, and health endpoints for monitoring. As the actual chrome extension is not able to be dockerised or have endpoints, the backend microservice is used as a workaround.

---

## 1. Code Quality Improvements

### Refactoring & Architecture
- **Extracted Services:** Created dedicated service classes (`ClipService`, `DedupService`, `TagRuleEngine`, `SyncService`) following Single Responsibility Principle
- **Removed Code Smells:** Eliminated code duplication, extracted long methods, removed all hardcoded values into `constants.js`
- **SOLID Principles:** Applied dependency injection, interface segregation, and separated concerns across the different modules
- **File Structure:**
  ```
  ChromeExtension/
  ├── services/        # Business logic (4 services)
  ├── utils/           # Helper functions
  ├── background.js    # Event handlers only
  ├── storage.js       # Data persistence layer
  └── constants.js     # Configuration
  ```

### Testing Infrastructure
- **153 Automated Tests:** 8 unit test suites + 1 integration test suite
- **Coverage:** Achieved **94.32%** code coverage
- **Test Types:**
  - Unit tests for services, storage, utilities
  - Integration tests for end-to-end workflows
  - Edge case testing for error handling

---

## 2. Backend Microservice (Workaround Solution)

### Problem & Solution
**Original Challenge:** Chrome extensions have limited cross-device sync capabilities.  
**Solution:** Implemented a Node.js backend microservice to enable clip synchronization across devices, as well as then allowing me to containerise the extension backend and deploy it to Azure.

### Backend Architecture
- **Framework:** Node.js + Express
- **Database:** SQLite for persistent clip storage
- **API:** RESTful endpoints for CRUD operations
- **Deployment:** Azure Container Instances

### Sync Service Implementation
**Extension-Side (`SyncService.js`):**
- Automatic sync every 5 minutes using Chrome alarms
- Two-way synchronization (upload local clips, download remote clips)
- Conflict resolution using last-write-wins strategy
- Device ID tracking

**Backend-Side:**
- 8 API endpoints for clip management
- Batch upload support for efficiency
- Incremental sync with `?since=timestamp` parameter
- Database statistics and health monitoring

---

## 3. Continuous Integration (CI)

### Pipeline Configuration
**File:** `.github/workflows/ci.yml`

**Jobs:**
1. **Test & Coverage** (Node 18.x, 20.x)
   - Runs 153 automated tests
   - Measures code coverage
   - Enforces 70% threshold otherwise it fails
   - Uploads coverage reports to Codecov

2. **Validate Extension**
   - Validates `manifest.json` structure
   - Checks for required files
   - Verifies directory structure

3. **Build Artifact**
   - Packages extension files
   - Creates distributable artifact
   - Only runs if tests pass

**Trigger:** Runs on every push to `main`,

---

## 4. Continuous Deployment (CD)

### Docker Containerization
**File:** `backend/Dockerfile`
- Multi-stage build for optimized image size
- Production-ready Node.js now usingDebian-slim base (switched from Alpine for better-sqlite3 compatibility, because the container instance kept crashing as soon as the image was built but this ended up working)
- Non-root user for security
- Health check endpoint configured

### Azure Deployment
**Platform:** Azure Container Instances  
**File:** `.github/workflows/azure-deploy.yml`

**Deployment Process:**
1. Build Docker image with Docker Buildx for `linux/amd64` architecture
2. Push to Azure Container Registry with automatic tagging
3. Restart container instance to pull latest image
4. Expose on public endpoint with DNS label

**Configuration:**
- **Registry:** `felixextensionbackend.azurecr.io`
- **Resource Group:** `BCSAI2025-DEVOPS-STUDENTS-B`
- **Backend URL:** `http://57.152.29.139:3000` (DNS: `gigis-backend-felix.eastus.azurecontainer.io:3000`)
- **IP Address:** 57.152.29.139
- **Port:** 3000

**Deployment Status:** ✅ **FULLY OPERATIONAL**
- Uptime: Stable (no crashes since deployment)
- Response Time: <5ms average
- Zero errors in production

---

## 5. Monitoring & Observability

### Health Endpoints
- `/health` - Basic health status
- `/health/detailed` - Full system diagnostics
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

### Metrics Collection
**Prometheus Integration:**
- Request count by endpoint and method
- Response time histograms
- Error rate tracking
- Active connections monitoring

**File:** `backend/src/routes/metrics.js`  
**Endpoint:** `/metrics` (Prometheus format)

### Monitoring Stack
**Configuration:** `backend/docker-compose.yml`
- **Prometheus:** Metrics collection and alerting
- **Grafana:** Pre-configured dashboards
- Custom dashboard: `backend/grafana/dashboards/backend-dashboard.json`

---

## 6. Key Achievements

| Requirement | Target | Achieved | Status |
|-------------|--------|----------|--------|
| Code Coverage | 70% | **94.32%** | ✅ Exceeded |
| Automated Tests | Required | **153 tests** | ✅ Complete |
| CI Pipeline | Required | ✅ Full automation | ✅ Complete |
| Docker Container | Required | ✅ Multi-stage build | ✅ Complete |
| Cloud Deployment | Required | ✅ Azure ACI | ✅ Complete |
| Health Endpoints | Required | ✅ 4 endpoints | ✅ Complete |
| Metrics | Required | ✅ Prometheus | ✅ Complete |

---

## 7. Technical Decisions

### Node.js Backend
- JavaScript ecosystem consistency with Chrome extension
- Express.js provides a very lightweight, fast API
- Easy integration with Azure services

### Why SQLite?
- its a Zero-configuration database
- Perfect for single-instance deployments
- Easy backup


---

## 8. Challenges & Solutions

### Challenge 1: Chrome Extension Structure
**Problem:** Chrome doesn't load extensions with `__tests__` folders  
**Solution:** Moved tests to separate `tests/` folder, updated CI to reference correct path

### Challenge 2: Docker Architecture Mismatch
**Problem:** ARM64 image (Mac M1) failed on Azure (x86_64)  
**Solution:** Build with `--platform linux/amd64` flag

### Challenge 3: Native Module Compatibility (Critical)
**Problem:** `better-sqlite3` native module compiled for glibc (Ubuntu) but Alpine uses musl libc, causing `ld-linux-x86-64.so.2` errors and container crashes  
**Solution:** Switched from `node:20-alpine` to `node:20-slim` (Debian-based) to ensure native modules compile correctly for the target environment

### Challenge 4: Azure AD Permissions
**Problem:** At first I wasn't able to create a service prinicpe due to permission issues
**Solution:** Used instead an existing service principal credentials provided by professor for automatic deployment

---

## 9. Project Statistics


**Repository:**
- GitHub: https://github.com/Flexipie/Gigi-sCopy
- Branches: `main` (production-ready)
- Commits: 20+ commits documenting progress

**Infrastructure:**
- Azure Container Registry: 1 registry
- Container Instances: 1 instance (1 vCPU, 1.5GB RAM)
- Public Endpoint: Functional

---


**Repository:** https://github.com/Flexipie/Gigi-sCopy  
**Backend:** http://gigis-backend-felix.eastus.azurecontainer.io:3000
