# Design Document: Render Deployment Fix

## Overview

This design addresses the deployment failure on Render.com where the application fails to start due to an incorrect start command. The root cause is that Render is executing `node start` (attempting to run a file named 'start') instead of `npm start` (which runs the npm script defined in package.json).

The fix involves:
1. Verifying and updating the render.yaml configuration
2. Checking and correcting the Render dashboard settings
3. Ensuring configuration precedence is properly understood
4. Updating documentation with troubleshooting guidance
5. Validating the deployment works correctly

This is a configuration fix rather than a code change, focusing on infrastructure-as-code best practices and proper deployment configuration management.

## Architecture

### Current State

```
GitHub Repository
├── package.json (defines "start": "node server.js")
├── render.yaml (defines startCommand: npm start)
└── server.js (Express application entry point)
        ↓
Render Platform
├── Dashboard Settings (may have conflicting start command)
├── Build Process (npm install)
└── Start Process (currently executing "node start" ❌)
```

### Target State

```
GitHub Repository
├── package.json (defines "start": "node server.js")
├── render.yaml (defines startCommand: npm start) ✓
└── server.js (Express application entry point)
        ↓
Render Platform
├── Dashboard Settings (aligned with render.yaml or removed)
├── Build Process (npm install) ✓
└── Start Process (executing "npm start" → "node server.js") ✓
```

### Configuration Precedence

Render's configuration precedence (highest to lowest):
1. **Dashboard manual overrides** - Settings configured in the Render web UI
2. **render.yaml** - Infrastructure-as-code configuration in repository
3. **Auto-detection** - Render's automatic detection of framework/runtime

The issue occurs when dashboard settings override the render.yaml configuration.

## Components and Interfaces

### 1. render.yaml Configuration File

**Location:** `/render.yaml` (repository root)

**Purpose:** Define infrastructure-as-code deployment configuration

**Current Configuration:**
```yaml
services:
  - type: web
    name: sahara-construction-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 5000
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: JWT_EXPIRE
        value: 7d
```

**Required Changes:** None - configuration is correct

**Validation:**
- `startCommand` must be `npm start` (not `node start`)
- File must be in repository root
- YAML syntax must be valid

### 2. Render Dashboard Configuration

**Location:** Render.com web interface → Service Settings → Start Command

**Purpose:** Web UI for managing service configuration

**Current State:** Likely contains `node start` or similar incorrect command

**Required Changes:**
- Option A: Remove/clear the start command field (let render.yaml control it)
- Option B: Update to `npm start` to match render.yaml

**Access Path:**
1. Log in to Render.com
2. Navigate to "sahara-construction-api" service
3. Click "Settings" tab
4. Scroll to "Start Command" field
5. Verify/update the command

### 3. package.json Scripts

**Location:** `/package.json`

**Purpose:** Define npm scripts for application lifecycle

**Current Configuration:**
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest --coverage"
  }
}
```

**Required Changes:** None - configuration is correct

**Behavior:**
- `npm start` executes `node server.js`
- This is the correct entry point for the Express application

### 4. Deployment Documentation

**Location:** `/DEPLOYMENT_GUIDE.md`

**Purpose:** Guide developers through deployment process

**Required Updates:**
- Add troubleshooting section for start command errors
- Explain configuration precedence (dashboard vs render.yaml)
- Document how to verify and fix dashboard settings
- Add validation steps to confirm deployment success

## Data Models

### Deployment Configuration Model

```
DeploymentConfig {
  service: {
    type: "web"
    name: string
    env: "node"
    buildCommand: string
    startCommand: string  // CRITICAL: Must be "npm start"
    envVars: EnvironmentVariable[]
  }
}

EnvironmentVariable {
  key: string
  value?: string
  sync?: boolean  // If true, synced from Render dashboard
}
```

### Deployment Log Model

```
DeploymentLog {
  timestamp: DateTime
  phase: "build" | "start" | "running"
  command: string
  output: string
  exitCode?: number
  error?: string
}
```

**Key Log Indicators:**

Success indicators:
- `==> Running 'npm start'` (correct command)
- `Server is running on port 5000` (application started)
- Exit code 0

Failure indicators:
- `==> Running 'node start'` (incorrect command)
- `Cannot find module '/opt/render/project/src/start'` (file not found)
- Exit code 1 or non-zero

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing the acceptance criteria, most testable items are specific examples rather than universal properties. This is appropriate for a deployment configuration fix, which involves:
- Verifying specific configuration values (render.yaml content)
- Checking specific log outputs (deployment logs)
- Testing specific endpoints (health checks)
- Validating specific documentation sections

Since this is primarily a configuration and documentation fix rather than algorithmic code, example-based testing is more suitable than property-based testing. The testable criteria focus on concrete validation points rather than universal behaviors across input ranges.

### Configuration Validation Examples

**Example 1: render.yaml contains correct start command**
Verify that the render.yaml file contains `startCommand: npm start` in the service configuration.
**Validates: Requirements 2.1**

**Example 2: render.yaml includes required environment variables**
Verify that render.yaml defines all required environment variables: NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRE.
**Validates: Requirements 2.4**

**Example 3: package.json defines start script**
Verify that package.json contains `"start": "node server.js"` in the scripts section.
**Validates: Requirements 1.2**

### Deployment Validation Examples

**Example 4: Deployment logs show correct command**
When reviewing deployment logs, verify that the logs contain `npm start` being executed (not `node start`).
**Validates: Requirements 1.1, 5.3**

**Example 5: Server starts successfully**
When the deployment completes, verify that logs contain a message indicating the server is listening on the configured port.
**Validates: Requirements 1.3, 5.4**

**Example 6: Health check endpoint responds**
When the application is deployed, making a GET request to the root endpoint should return a successful response (status 200).
**Validates: Requirements 5.1**

**Example 7: API endpoint returns valid JSON**
When making a GET request to `/api/sites`, the response should be valid JSON with a success field.
**Validates: Requirements 5.2**

### Error Condition Examples

**Example 8: Incorrect command fails with clear error**
If Render attempts to execute `node start`, the deployment should fail with error message "Cannot find module '/opt/render/project/src/start'".
**Validates: Requirements 1.4**

### Documentation Validation Examples

**Example 9: Deployment guide documents start command**
Verify that DEPLOYMENT_GUIDE.md contains a section explaining the correct start command configuration (`npm start`).
**Validates: Requirements 4.1**

**Example 10: Documentation explains configuration precedence**
Verify that DEPLOYMENT_GUIDE.md explains that Render dashboard settings can override render.yaml configuration.
**Validates: Requirements 4.2, 4.5**

**Example 11: Troubleshooting section exists**
Verify that DEPLOYMENT_GUIDE.md contains a troubleshooting section with steps for diagnosing start command errors.
**Validates: Requirements 4.3, 4.4**

## Error Handling

### Configuration Errors

**Invalid render.yaml syntax:**
- **Detection:** YAML parsing fails during Render deployment
- **Handling:** Render will display YAML syntax error in deployment logs
- **Prevention:** Validate YAML syntax before committing (use YAML linter)
- **Recovery:** Fix syntax errors and redeploy

**Missing start command:**
- **Detection:** render.yaml lacks startCommand field
- **Handling:** Render falls back to auto-detection (may be incorrect)
- **Prevention:** Always explicitly define startCommand in render.yaml
- **Recovery:** Add startCommand field and redeploy

**Incorrect start command:**
- **Detection:** Application fails to start, logs show "Cannot find module" error
- **Handling:** Deployment fails, service remains in failed state
- **Prevention:** Use `npm start` (not `node start` or other variations)
- **Recovery:** Update startCommand to `npm start` and redeploy

### Dashboard Configuration Conflicts

**Dashboard overrides render.yaml:**
- **Detection:** Deployment uses different command than specified in render.yaml
- **Handling:** Dashboard setting takes precedence, may cause deployment failure
- **Prevention:** Clear dashboard start command field or ensure it matches render.yaml
- **Recovery:** Update dashboard settings via Render web UI

**Environment variables missing:**
- **Detection:** Application fails to start, logs show connection errors
- **Handling:** Server crashes or fails to connect to MongoDB
- **Prevention:** Define all required env vars in render.yaml with sync: false
- **Recovery:** Add missing env vars in Render dashboard and redeploy

### Runtime Errors

**Port binding failure:**
- **Detection:** Logs show "EADDRINUSE" or port already in use error
- **Handling:** Deployment fails
- **Prevention:** Use PORT environment variable from Render (don't hardcode)
- **Recovery:** Verify server.js uses `process.env.PORT`

**MongoDB connection failure:**
- **Detection:** Logs show MongoDB connection timeout or authentication error
- **Handling:** Server starts but cannot serve requests
- **Prevention:** Verify MONGODB_URI is correct and MongoDB Atlas allows Render IPs
- **Recovery:** Update connection string or MongoDB Atlas network settings

## Testing Strategy

### Manual Validation Tests

Since this is a deployment configuration fix, testing primarily involves manual validation steps rather than automated unit or property tests. However, we can create validation scripts to automate some checks.

**Configuration Validation Script:**
- Parse render.yaml and verify startCommand value
- Parse package.json and verify start script
- Check that required environment variables are defined
- Validate YAML syntax

**Documentation Validation Script:**
- Check DEPLOYMENT_GUIDE.md contains required sections
- Verify troubleshooting steps are documented
- Ensure configuration precedence is explained

**Deployment Validation Checklist:**
1. Push changes to GitHub
2. Monitor Render deployment logs
3. Verify logs show `npm start` being executed
4. Verify logs show server listening message
5. Test health check endpoint (GET /)
6. Test API endpoint (GET /api/sites)
7. Verify response times are acceptable

### Integration Testing

**Pre-deployment validation:**
- Run configuration validation script locally
- Verify all files are committed to Git
- Check render.yaml syntax with YAML linter

**Post-deployment validation:**
- Automated health check requests
- API endpoint smoke tests
- Log analysis for error patterns

### Test Configuration

For any automated validation scripts:
- Use Node.js with standard libraries (fs, path, yaml parser)
- Exit with code 0 for success, non-zero for failure
- Output clear error messages for validation failures
- Tag tests with: **Feature: render-deployment-fix**

### Validation Priorities

**Critical (must pass):**
1. render.yaml contains `startCommand: npm start`
2. Deployment logs show `npm start` execution
3. Server starts and responds to health checks
4. API endpoints return valid responses

**Important (should pass):**
1. All environment variables defined
2. Documentation updated with troubleshooting steps
3. Configuration precedence explained

**Nice-to-have:**
1. Automated validation scripts
2. Pre-commit hooks for YAML validation
3. Deployment monitoring alerts
