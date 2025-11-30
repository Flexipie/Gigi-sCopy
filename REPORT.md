# DevOps Assignment Report
**Project:** Gigi's Copy Tool - Chrome Extension  
**Student:** Felix  
**Date:** November 2025

---

## Executive Summary

This report documents the improvements made to the Chrome Extension project to meet DevOps best practices, including code refactoring, comprehensive testing, CI/CD automation, and the addition of a backend microservice for cross-device synchronization.

---

## 1. Code Quality Improvements

### Refactoring & Architecture
- **Extracted Services:** Created dedicated service classes (`ClipService`, `DedupService`, `TagRuleEngine`, `SyncService`) following Single Responsibility Principle
- **Removed Code Smells:** Eliminated code duplication, extracted long methods, removed hardcoded values into `constants.js`
- **SOLID Principles:** Applied dependency injection, interface segregation, and separated concerns across modules
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
- **Coverage:** Achieved **94.32%** code coverage (exceeds 70% requirement by 24%)
- **Test Types:**
  - Unit tests for services, storage, utilities
  - Integration tests for end-to-end workflows
  - Edge case testing for error handling

**Key Metrics:**
- Lines: 94.32%
- Statements: 94.43%
- Functions: 95.08%
- Branches: 90.90%

---

## 2. Backend Microservice (Workaround Solution)

### Problem & Solution
**Original Challenge:** Chrome extensions have limited cross-device sync capabilities.  
**Solution:** Implemented a Node.js backend microservice to enable clip synchronization across devices.

### Backend Architecture
- **Framework:** Node.js + Express
- **Database:** SQLite for persistent clip storage
- **API:** RESTful endpoints for CRUD operations
- **Deployment:** Azure Container Instances

### Sync Service Implementation
**Extension-Side (`SyncService.js`):**
- Automatic sync every 5 minutes via Chrome alarms
- Two-way synchronization (upload local clips, download remote clips)
- Conflict resolution using last-write-wins strategy
- Device ID tracking for multi-device support

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
   - Enforces 70% threshold (fails build if below)
   - Uploads coverage reports to Codecov

2. **Validate Extension**
   - Validates `manifest.json` structure
   - Checks for required files
   - Verifies directory structure

3. **Build Artifact**
   - Packages extension files
   - Creates distributable artifact
   - Only runs if tests pass

**Trigger:** Runs on every push to `main`, `develop`, and feature branches

---

## 4. Continuous Deployment (CD)

### Docker Containerization
**File:** `backend/Dockerfile`
- Multi-stage build for optimized image size
- Production-ready Node.js Debian-slim base (switched from Alpine for better-sqlite3 compatibility)
- Non-root user for security
- Health check endpoint configured

### Azure Deployment
**Platform:** Azure Container Instances  
**File:** `.github/workflows/azure-deploy.yml`

**Deployment Process:**
1. Build Docker image with Docker Buildx for `linux/amd64` architecture
2. Push to Azure Container Registry (ACR) with automatic tagging
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

### Why Node.js Backend?
- JavaScript ecosystem consistency with Chrome extension
- Express.js provides lightweight, fast API framework
- Easy integration with Azure services
- Excellent Docker support

### Why SQLite?
- Zero-configuration database
- Perfect for single-instance deployments
- Sufficient for assignment requirements
- Easy backup and portability

### Why Azure Container Instances?
- Serverless container deployment (no VM management)
- Quick deployment process
- Cost-effective for demo/assignment
- Native integration with Azure Container Registry

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
**Problem:** Cannot create service principal with student account  
**Solution:** Used existing service principal credentials provided by professor for automatic deployment

### Challenge 5: Container Instance Quota
**Problem:** West Europe region exhausted  
**Solution:** Deployed to East US region successfully

---

## 9. Project Statistics

**Codebase:**
- Extension: ~3,500 lines of JavaScript
- Backend: ~2,000 lines of JavaScript
- Tests: ~2,500 lines of test code
- Total: ~8,000 lines of code

**Repository:**
- GitHub: https://github.com/Flexipie/Gigi-sCopy
- Branches: `main` (production-ready)
- Commits: 20+ commits documenting progress

**Infrastructure:**
- Azure Container Registry: 1 registry
- Container Instances: 1 instance (1 vCPU, 1.5GB RAM)
- Public Endpoint: ✅ Functional

---

## 10. Conclusion

This project successfully demonstrates modern DevOps practices including:
- High-quality, well-tested code (94% coverage)
- Automated CI pipeline with quality gates
- Containerized microservice architecture
- Cloud deployment with monitoring
- Professional documentation and reporting

The addition of the backend sync service not only solved the cross-device limitation but also provided an opportunity to implement a full-stack DevOps workflow including containerization, cloud deployment, and production monitoring.

All assignment requirements have been met or exceeded, with particular strengths in code quality (94% vs 70% required coverage) and comprehensive monitoring infrastructure.

---

**Repository:** https://github.com/Flexipie/Gigi-sCopy  
**Backend:** http://gigis-backend-felix.eastus.azurecontainer.io:3000
