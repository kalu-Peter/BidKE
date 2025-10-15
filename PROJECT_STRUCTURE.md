# BidKE Project Structure (After Cleanup)

## 📁 Root Directory

```
BidKE/
├── 📄 .env                    (Development environment variables)
├── 📄 .env.production         (Production environment variables)
├── 📄 .gitignore
├── 📄 BRAND_COLORS.md
├── 📄 ENVIRONMENT_SETUP.md    (Environment setup documentation)
├── 📄 bun.lockb
├── 📄 components.json
├── 📄 eslint.config.js
├── 📄 index.html
├── 📄 package.json
├── 📄 postcss.config.js
├── 📄 README.md
├── 📄 start-dev.ps1           (PowerShell dev startup script)
├── 📄 start-dev.sh            (Bash dev startup script)
├── 📄 static.html
├── 📄 tailwind.config.ts
├── 📄 tsconfig.app.json
├── 📄 tsconfig.json
├── 📄 tsconfig.node.json
└── 📄 vite.config.ts
```

## 📁 Main Directories

### 🔧 `/api/` - Backend API (39 files)

```
api/
├── 📄 auction-details.php
├── 📄 auctions.php
├── 📄 list-auctions.php
├── 📄 notifications.php
├── 📄 place-bid.php
├── 📄 README.md
├── 📄 schema.sql
├── 📄 test-config.php          (Environment configuration testing)
├── 📄 upload.php
├── 📄 watchlist.php
├── 📁 admin/          (Admin endpoints)
├── 📁 auctions/       (Auction management)
├── 📁 auth/           (Authentication)
├── 📁 cache/          (Cache files)
├── 📁 config/         (Enhanced database config with multi-environment support)
├── 📁 endpoints/      (API endpoints)
├── 📁 logs/           (Log files)
├── 📁 models/         (PHP models)
├── 📁 uploads/        (File uploads)
└── 📁 utils/          (Utility functions)
```

### ⚛️ `/src/` - Frontend React Application

```
src/
├── 📄 App.css
├── 📄 App.tsx
├── 📄 index.css
├── 📄 main.tsx
├── 📄 vite-env.d.ts
├── 📁 assets/         (Images & static files)
├── 📁 components/     (React components)
│   └── 📁 ui/         (UI components - shadcn/ui)
├── 📁 contexts/       (React contexts)
├── 📁 hooks/          (Custom hooks)
├── 📁 lib/            (Utilities & environment management)
│   └── � environment.ts   (Environment detection utility)
├── 📁 pages/          (Page components)
│   └── � EnvironmentTest.tsx   (Environment testing page)
└── 📁 services/       (Enhanced API services with multi-environment support)
```

### 🗃️ Other Directories

```
├── 📁 database/       (Database schemas & migrations)
├── 📁 public/         (Static assets)
│   ├── � logo.png
│   ├── 📄 manifest.json
│   ├── 📄 placeholder.svg
│   ├── � robots.txt
│   └── 📁 icons/
├── 📁 temp/           (Temporary files & test data)
└── 📁 tools/          (Development tools & utilities)
```

## 🌍 Environment Configuration

### ✅ Multi-Environment Setup:

- **Development Environment**: Local PostgreSQL (port 5054) with automatic detection
- **Production Environment**: Render PostgreSQL (port 5432) with SSL support
- **Environment Files**: `.env` for development, `.env.production` for production
- **Automatic Switching**: Frontend and backend auto-detect environment based on hostname/deployment context

### 🔧 Environment Features:

- **CORS Enhancement**: Multi-origin support for development and production domains
- **Database Configuration**: Automatic switching between local and production databases
- **Development Automation**: PowerShell and Bash scripts for automated development server startup
- **Configuration Testing**: Test endpoints for validating environment setup
- **Environment Manager**: TypeScript utility for centralized environment detection

### 📊 Current Stats:

- **Total Directories**: 8 main directories (streamlined structure)
- **API Files**: Enhanced with multi-environment support and configuration testing
- **Frontend Files**: Environment-aware React application with automatic API URL detection
- **Development Tools**: Automated startup scripts and environment utilities

## 🎯 Key Features:

- **Frontend**: Modern React + TypeScript with Vite and environment-aware configuration
- **UI Framework**: shadcn/ui components with consistent design system
- **Backend**: Enhanced PHP REST API with multi-environment support
- **Database**: PostgreSQL with automatic local/production switching (ports 5054/5432)
- **Environment Management**: Automatic detection and configuration switching
- **CORS Enhancement**: Multi-origin support for development workflows
- **Development Automation**: PowerShell and Bash scripts for streamlined development
- **Configuration Testing**: Built-in endpoints for validating environment setup
- **Authentication**: JWT-based auth system (to be implemented)
- **File Upload**: Image handling for auctions
- **Admin Panel**: Complete admin management system

## 🚀 Development Workflow:

1. **Quick Start**: Use `start-dev.ps1` (Windows) or `start-dev.sh` (Unix) for automated development server startup
2. **Environment Detection**: Application automatically detects and configures for local vs production
3. **Database Switching**: Seamlessly switch between local PostgreSQL (5054) and Render PostgreSQL (5432)
4. **Configuration Testing**: Visit `/api/test-config.php` and `EnvironmentTest` page to verify setup
5. **CORS Support**: Enhanced CORS policy supports multiple development origins (localhost:8080, localhost:8082)
