# Azure Deployment Guide

This guide walks you through deploying the Gigi's Copy Tool backend to Microsoft Azure.

## 📋 Prerequisites

- Azure account with active subscription
- Azure CLI installed (`az` command)
- Docker installed locally
- GitHub repository with the code

## 🚀 Deployment Options

### Option 1: Azure Container Instances (Recommended for Assignment)

**Pros:**
- Simplest setup
- No infrastructure management
- Pay per second
- Perfect for demos and assignments

**Cons:**
- No auto-scaling
- Public IP only (no VNet integration in basic tier)

### Option 2: Azure App Service

**Pros:**
- Built-in CI/CD
- Auto-scaling
- Custom domains
- SSL certificates

**Cons:**
- More expensive
- More complex setup

### Option 3: Azure Kubernetes Service (AKS)

**Pros:**
- Production-grade
- Full orchestration
- Advanced monitoring

**Cons:**
- Overkill for this project
- Complex and expensive

---

## 🔧 Setup Steps (Azure Container Instances)

### Step 1: Install Azure CLI

```bash
# macOS
brew install azure-cli

# Or download from
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli
```

### Step 2: Login to Azure

```bash
az login
```

This will open your browser for authentication.

### Step 3: Create Resource Group

```bash
# Set variables
RESOURCE_GROUP="gigis-copy-tool-rg"
LOCATION="eastus"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION
```

### Step 4: Create Azure Container Registry (ACR)

```bash
ACR_NAME="gigiscopytoolacr"  # Must be globally unique, lowercase, no special chars

az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true
```

### Step 5: Get ACR Credentials

```bash
# Get login server
ACR_LOGIN_SERVER=$(az acr show \
  --name $ACR_NAME \
  --query loginServer \
  --output tsv)

# Get credentials
ACR_USERNAME=$(az acr credential show \
  --name $ACR_NAME \
  --query username \
  --output tsv)

ACR_PASSWORD=$(az acr credential show \
  --name $ACR_NAME \
  --query passwords[0].value \
  --output tsv)

echo "ACR Login Server: $ACR_LOGIN_SERVER"
echo "ACR Username: $ACR_USERNAME"
echo "ACR Password: $ACR_PASSWORD"
```

**Save these credentials! You'll need them for GitHub Secrets.**

### Step 6: Build and Push Docker Image

```bash
# Navigate to backend directory
cd backend

# Build the image
docker build -t gigis-copy-tool-backend:latest .

# Login to ACR
az acr login --name $ACR_NAME

# Tag the image
docker tag gigis-copy-tool-backend:latest \
  $ACR_LOGIN_SERVER/gigis-copy-tool-backend:latest

# Push to ACR
docker push $ACR_LOGIN_SERVER/gigis-copy-tool-backend:latest
```

### Step 7: Deploy to Azure Container Instances

```bash
az container create \
  --resource-group $RESOURCE_GROUP \
  --name gigis-backend \
  --image $ACR_LOGIN_SERVER/gigis-copy-tool-backend:latest \
  --registry-login-server $ACR_LOGIN_SERVER \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --dns-name-label gigis-copy-tool \
  --ports 3000 \
  --cpu 1 \
  --memory 1 \
  --environment-variables NODE_ENV=production PORT=3000 LOG_LEVEL=info
```

### Step 8: Get the Public URL

```bash
az container show \
  --resource-group $RESOURCE_GROUP \
  --name gigis-backend \
  --query ipAddress.fqdn \
  --output tsv
```

This will output something like: `gigis-copy-tool.eastus.azurecontainer.io`

### Step 9: Test the Deployment

```bash
# Get the URL
URL=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name gigis-backend \
  --query ipAddress.fqdn \
  --output tsv)

# Test health endpoint
curl http://$URL:3000/health

# Test metrics endpoint
curl http://$URL:3000/metrics
```

---

## 🔐 GitHub Secrets Configuration

For automated CI/CD deployment, add these secrets to your GitHub repository:

1. Go to GitHub Repository → Settings → Secrets and variables → Actions
2. Click "New repository secret"
3. Add the following secrets:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `AZURE_CREDENTIALS` | JSON object | See below |
| `AZURE_RESOURCE_GROUP` | `gigis-copy-tool-rg` | Your resource group name |
| `ACR_LOGIN_SERVER` | `gigiscopytoolacr.azurecr.io` | From Step 5 |
| `ACR_USERNAME` | `gigiscopytoolacr` | From Step 5 |
| `ACR_PASSWORD` | `<password>` | From Step 5 |

### Getting AZURE_CREDENTIALS

```bash
az ad sp create-for-rbac \
  --name "gigis-copy-tool-sp" \
  --role contributor \
  --scopes /subscriptions/{subscription-id}/resourceGroups/gigis-copy-tool-rg \
  --sdk-auth

# Replace {subscription-id} with your actual subscription ID
# Get subscription ID with: az account show --query id -o tsv
```

This will output JSON - copy the entire JSON and paste it as the `AZURE_CREDENTIALS` secret.

---

## 📊 Monitoring the Deployment

### View Container Logs

```bash
az container logs \
  --resource-group $RESOURCE_GROUP \
  --name gigis-backend \
  --follow
```

### Check Container Status

```bash
az container show \
  --resource-group $RESOURCE_GROUP \
  --name gigis-backend \
  --query "{FQDN:ipAddress.fqdn,ProvisioningState:provisioningState,RestartCount:instanceView.currentState.detailStatus}" \
  --output table
```

### View Container Metrics

```bash
# CPU usage
az monitor metrics list \
  --resource /subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerInstance/containerGroups/gigis-backend \
  --metric CPUUsage

# Memory usage  
az monitor metrics list \
  --resource /subscriptions/{subscription-id}/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerInstance/containerGroups/gigis-backend \
  --metric MemoryUsage
```

---

## 🔄 Updating the Deployment

### Option 1: Manual Update

```bash
# Build and push new image
docker build -t gigis-copy-tool-backend:latest .
docker tag gigis-copy-tool-backend:latest $ACR_LOGIN_SERVER/gigis-copy-tool-backend:latest
docker push $ACR_LOGIN_SERVER/gigis-copy-tool-backend:latest

# Restart container to pull new image
az container restart \
  --resource-group $RESOURCE_GROUP \
  --name gigis-backend
```

### Option 2: Automatic via GitHub Actions

Just push to the `main` branch and the workflow will:
1. Build the Docker image
2. Push to ACR
3. Deploy to Azure Container Instances

---

## 💰 Cost Estimation

**Azure Container Instances:**
- 1 vCPU, 1 GB RAM: ~$0.0000125/second = ~$0.045/hour = ~$32/month
- Network egress: First 5 GB free, then ~$0.087/GB

**Azure Container Registry (Basic):**
- $0.167/day = ~$5/month
- 10 GB storage included

**Total estimated cost: ~$37/month**

*For assignment purposes, you can use the free trial credits.*

---

## 🧹 Cleanup

When you're done with the assignment:

```bash
# Delete everything
az group delete \
  --name $RESOURCE_GROUP \
  --yes \
  --no-wait
```

---

## 🐛 Troubleshooting

### Container won't start

```bash
# Check logs
az container logs --resource-group $RESOURCE_GROUP --name gigis-backend

# Check events
az container show --resource-group $RESOURCE_GROUP --name gigis-backend
```

### Can't pull image from ACR

- Verify ACR credentials are correct
- Ensure admin account is enabled: `az acr update --name $ACR_NAME --admin-enabled true`

### Health check failing

- Verify port 3000 is exposed in Dockerfile
- Check application logs
- Test locally first with Docker

### Connection refused

- Wait 2-3 minutes after deployment
- Verify security group rules (ACI is usually open by default)
- Check container is running: `az container show`

---

## 📚 Additional Resources

- [Azure Container Instances Documentation](https://learn.microsoft.com/en-us/azure/container-instances/)
- [Azure Container Registry Documentation](https://learn.microsoft.com/en-us/azure/container-registry/)
- [GitHub Actions for Azure](https://github.com/Azure/actions)

---

## ✅ Verification Checklist

Before submitting your assignment, verify:

- [ ] Container is running: `az container show --name gigis-backend`
- [ ] Health endpoint works: `curl http://<URL>:3000/health`
- [ ] Metrics endpoint works: `curl http://<URL>:3000/metrics`
- [ ] Prometheus metrics are valid
- [ ] GitHub Actions workflow is configured
- [ ] All secrets are set in GitHub
- [ ] Documentation is complete
- [ ] Screenshots taken for report

---

*Last Updated: Nov 18, 2025*
