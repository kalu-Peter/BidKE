# Multi-Environment Setup for BidKE

## 🎯 Problem Solved

Fixed CORS issues and enabled seamless switching between local development (port 5054) and production (Render - port 5432) environments.

## 🔧 Configuration Changes Made

### 1. Environment Detection

- **Frontend**: Automatic environment detection based on hostname
- **Backend**: Environment detection based on HTTP_HOST or environment variables
- **Database**: Separate configurations for local (port 5054) and production (port 5432)

### 2. Files Modified/Created

#### New Files:

- ✅ `.env` - Development environment variables
- ✅ `.env.production` - Production environment variables
- ✅ `src/lib/environment.ts` - Environment manager utility
- ✅ `api/test-config.php` - Configuration test endpoint
- ✅ `start-dev.ps1` - PowerShell development startup script
- ✅ `start-dev.sh` - Bash development startup script
- ✅ `src/pages/EnvironmentTest.tsx` - Environment testing page

#### Modified Files:

- ✅ `src/services/api.ts` - Multi-environment API service
- ✅ `api/config/connect.php` - Enhanced database config with CORS
- ✅ `package.json` - Added development scripts

## 🚀 How to Use

### Local Development (Port 5054)

```bash
# Option 1: Manual startup
npm run start:api    # Start PHP server (port 8000)
npm run dev          # Start Vite server (port 8082)

# Option 2: Automated startup (Windows)
npm run dev:full     # Starts both servers automatically

# Option 3: PowerShell script
./start-dev.ps1      # Windows PowerShell script
```

### Production (Render - Port 5432)

The system automatically detects production environment when deployed to Render.

### Environment Variables

#### Development (`.env`):

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_ENV=development
VITE_DB_HOST=localhost
VITE_DB_PORT=5054
```

#### Production (`.env.production`):

```env
VITE_API_BASE_URL=https://bidke-php.onrender.com
VITE_APP_ENV=production
VITE_DB_PORT=5432
```

## 🔍 Testing the Setup

### 1. Test Configuration

Visit: `http://localhost:8000/test-config.php`

- Shows current environment settings
- Tests database connection
- Displays CORS configuration

### 2. Frontend Environment Test

Add this route to your router:

```tsx
import EnvironmentTest from "@/pages/EnvironmentTest";
// Add route: /environment-test -> <EnvironmentTest />
```

### 3. Verify CORS

The system now properly handles CORS for:

- ✅ `http://localhost:8080` (Original dev server)
- ✅ `http://localhost:8082` (New Vite dev server)
- ✅ `https://bidke-php.onrender.com` (Production API)
- ✅ Any localhost origin in development

## 📊 Environment Detection Logic

### Frontend:

```typescript
const isDevelopment =
  import.meta.env.DEV ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
```

### Backend:

```php
$isProduction = (
    isset($_SERVER['HTTP_HOST']) &&
    (strpos($_SERVER['HTTP_HOST'], 'onrender.com') !== false)
) || getenv('ENVIRONMENT') === 'production';
```

## 🗄️ Database Configuration

### Local Development:

- **Host**: localhost
- **Port**: 5054
- **SSL**: disabled
- **User**: postgres
- **Database**: bidlode

### Production (Render):

- **Host**: Environment variable `DB_HOST`
- **Port**: 5432 (default)
- **SSL**: required
- **User**: Environment variable `DB_USER`
- **Database**: Environment variable `DB_NAME`

## 🔒 CORS Configuration

Enhanced CORS policy supports:

- Multiple allowed origins
- Credential support
- Preflight request handling
- Environment-specific rules

## 🎯 Next Steps

1. **Deploy to Render**: Set environment variables in Render dashboard
2. **Update Frontend Domain**: Replace placeholder URLs with actual production domain
3. **Test Production**: Verify CORS and database connections in production
4. **Monitor**: Use the test endpoints to verify configuration

## 📝 Available Scripts

```json
{
  "dev": "vite --port 8082 --host localhost",
  "dev:full": "powershell -ExecutionPolicy Bypass -File start-dev.ps1",
  "start:api": "cd api && php -S localhost:8000",
  "start:local": "npm run dev"
}
```

## ✅ Benefits Achieved

- 🔄 **Seamless Environment Switching**: Automatic detection and configuration
- 🌐 **CORS Issues Fixed**: Proper headers for all environments
- 🗄️ **Multi-Database Support**: Local (5054) and Production (5432)
- 🔍 **Easy Testing**: Built-in configuration testing endpoints
- 🚀 **Simplified Development**: One-command startup scripts
- 📊 **Better Debugging**: Environment logging and status information

The system now automatically detects whether you're running locally or in production and configures itself accordingly!
