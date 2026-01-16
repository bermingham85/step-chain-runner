# Security and Environment Variables Guide

## ⚠️ Critical Security Information

This document explains how environment variables and API keys are managed in this project to ensure security.

## Environment Files Overview

### What Gets Committed to GitHub

✅ **SAFE - These files ARE in version control:**
- `.env.example` (template with placeholder values)
- `backend/.env.example` (backend template)
- All source code files

❌ **NEVER COMMITTED - These files are IGNORED:**
- `.env` (actual configuration)
- `backend/.env` (contains real API keys)
- `frontend/.env` (if it contains secrets)
- Any file matching `*.env` pattern

## Current Configuration

### Backend Environment Template (`backend/.env.example`)

```bash
# Database Configuration
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
DATABASE_PATH="data/runs.db"

# API Configuration
CORS_ORIGINS="*"

# Anthropic API (Required)
ANTHROPIC_API_KEY="your_anthropic_api_key_here"
ANTHROPIC_MODEL="claude-3-5-sonnet-20241022"
```

### Actual Backend Environment (`backend/.env`)

**Status**: ✅ Cleaned and secured
- All hardcoded API keys removed
- File is in `.gitignore`
- Contains placeholder: `your_anthropic_api_key_here`
- Users must add their own API key

## Setup for New Users

### Step 1: Clone the Repository

```bash
git clone https://github.com/bermingham85/step-chain-runner.git
cd step-chain-runner
```

### Step 2: Create Your Environment File

```bash
cd backend
cp .env.example .env
```

### Step 3: Add Your API Key

Edit `backend/.env` and replace the placeholder:

```bash
# Before:
ANTHROPIC_API_KEY="your_anthropic_api_key_here"

# After:
ANTHROPIC_API_KEY="sk-ant-api03-YOUR_ACTUAL_KEY_HERE"
```

### Step 4: Verify Security

Check that your `.env` file is ignored:

```bash
# This should output: backend/.env
git check-ignore backend/.env

# This should show .env is NOT in staging
git status
```

## GitIgnore Configuration

The `.gitignore` file is configured to exclude ALL environment files:

```gitignore
# Environment files (CRITICAL - Never commit these)
.env
.env.local
.env.*.local
*.env
backend/.env
frontend/.env

# Keep example files
!.env.example
!**/.env.example
```

## How API Keys are Used

### In Code (backend/runner.py)

```python
import os
from langchain_anthropic import ChatAnthropic

# API key is loaded from environment variable
api_key = os.getenv("ANTHROPIC_API_KEY")

# Used securely without hardcoding
model = ChatAnthropic(
    model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
    api_key=api_key  # Never hardcoded
)
```

### Environment Loading (backend/server.py)

```python
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')  # Loads from .env file

# All keys accessed via os.environ
api_key = os.environ.get('ANTHROPIC_API_KEY')
```

## Verification Checklist

Before pushing to GitHub, verify:

- [ ] No hardcoded API keys in any `.py`, `.js`, or `.ts` files
- [ ] `backend/.env` is in `.gitignore`
- [ ] `backend/.env.example` contains placeholders only
- [ ] Running `git status` shows `.env` files are not staged
- [ ] All API keys are loaded from environment variables
- [ ] Documentation explains how to set up `.env` files

## For Developers

### Adding New Environment Variables

1. Add the variable to `.env.example` with a placeholder:
   ```bash
   NEW_API_KEY="your_new_api_key_here"
   ```

2. Add the same variable to your local `.env` with the real value:
   ```bash
   NEW_API_KEY="sk-real-api-key-12345"
   ```

3. Update documentation (SETUP_GUIDE.md) with instructions

4. Use in code via `os.environ.get('NEW_API_KEY')`

### Scanning for Leaked Keys

Before committing, scan for potential secrets:

```bash
# Search for common key patterns
grep -r "sk-ant-api03" . --exclude-dir=node_modules --exclude-dir=.git

# Check what's being committed
git diff --cached

# Verify .env files are ignored
git status --ignored | grep .env
```

## Emergency: Key Was Committed

If you accidentally commit an API key:

### Step 1: Revoke the Key Immediately
1. Go to https://console.anthropic.com/
2. Delete the compromised API key
3. Generate a new one

### Step 2: Remove from Git History
```bash
# WARNING: This rewrites history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (only if repo is private or before sharing)
git push origin --force --all
```

### Step 3: Update Local Configuration
```bash
# Add new key to .env
echo 'ANTHROPIC_API_KEY="new_key_here"' > backend/.env
```

## Best Practices

✅ **DO:**
- Always use `.env.example` files as templates
- Load secrets from environment variables
- Add all `.env` patterns to `.gitignore`
- Use `os.environ.get()` or `process.env` to access secrets
- Document required environment variables
- Rotate API keys regularly

❌ **DON'T:**
- Hardcode API keys in source code
- Commit `.env` files to version control
- Share API keys in chat, email, or documentation
- Use the same API key across multiple projects
- Store secrets in frontend code (they're visible to users)

## Deployment Considerations

### For Production Deployments

**Option 1: Environment Variables (Recommended)**
- Most hosting platforms (Heroku, Vercel, AWS) allow setting environment variables in their dashboard
- Set `ANTHROPIC_API_KEY` in the platform's environment settings
- No `.env` file needed in production

**Option 2: Secrets Management**
- Use services like AWS Secrets Manager, Azure Key Vault, or Google Secret Manager
- Load secrets at runtime
- Rotate keys automatically

**Option 3: Container Secrets**
- For Docker/Kubernetes deployments
- Use secrets management (Kubernetes Secrets, Docker Secrets)
- Mount secrets as files or environment variables

## Questions?

- **Q: Can I commit `.env.example`?**
  - Yes! It contains only placeholders, not real secrets.

- **Q: How do I share my configuration with team members?**
  - Share the `.env.example` file
  - Document any special setup in SETUP_GUIDE.md
  - Never share actual `.env` files with real keys

- **Q: What if I need different keys for dev/staging/prod?**
  - Use different `.env` files: `.env.development`, `.env.staging`, `.env.production`
  - All should be in `.gitignore`
  - Load the appropriate one based on environment

- **Q: Is the frontend `.env` file safe?**
  - Only if it doesn't contain secrets
  - `REACT_APP_BACKEND_URL` is safe (it's just a URL)
  - Never put API keys in frontend `.env` files

## Summary

🔒 **Security Status: SECURED**

- ✅ All API keys removed from codebase
- ✅ `.env` files properly ignored
- ✅ `.env.example` templates provided
- ✅ Documentation updated
- ✅ Code loads keys from environment
- ✅ Ready for safe GitHub push

**The repository is now safe to push to GitHub!** 🎉
