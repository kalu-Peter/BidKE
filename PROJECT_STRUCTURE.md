# BidKE Project Structure (After Cleanup)

## 📁 Root Directory

```
BidKE/
├── 📄 .gitignore
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 bun.lockb
├── 📄 components.json
├── 📄 eslint.config.js
├── 📄 index.html
├── 📄 postcss.config.js
├── 📄 tailwind.config.ts
├── 📄 tsconfig.json
├── 📄 tsconfig.app.json
├── 📄 tsconfig.node.json
├── 📄 vite.config.ts
├── 📄 README.md
├── 📄 static.html
└── 📄 Various config and documentation files
```

## 📁 Main Directories

### 🔧 `/api/` - Backend API (39 files)

```
api/
├── 📄 .htaccess.disabled
├── 📄 auction-details.php
├── 📄 auctions.php
├── 📄 bids.php
├── 📄 messages.php
├── 📄 notifications.php
├── 📄 payout-methods.php
├── 📄 place-bid.php
├── 📄 seller_sales.php
├── 📄 upload.php
├── 📄 watchlist.php
├── 📄 withdraw-bid.php
├── 📄 won-auctions.php
├── 📁 admin/          (Admin endpoints)
├── 📁 auth/           (Authentication)
├── 📁 auctions/       (Auction management)
├── 📁 config/         (Database config)
├── 📁 cron/           (Cron jobs)
├── 📁 models/         (PHP models)
├── 📁 payments/       (Payment processing)
├── 📁 utils/          (Utility functions)
├── 📁 uploads/        (File uploads)
├── 📁 logs/           (Log files)
└── 📁 cache/          (Cache files)
```

### ⚛️ `/src/` - Frontend React Application

```
src/
├── 📄 App.tsx
├── 📄 main.tsx
├── 📄 index.css
├── 📄 App.css
├── 📄 vite-env.d.ts
├── 📁 assets/         (Images & static files)
├── 📁 components/     (React components)
│   ├── 📁 auth/       (Auth components)
│   ├── 📁 bidding/    (Bidding features)
│   ├── 📁 dashboard/  (Dashboard components)
│   ├── 📁 messaging/  (Chat system)
│   ├── 📁 modals/     (Modal dialogs)
│   ├── 📁 notifications/ (Notifications)
│   ├── 📁 payout/     (Payout management)
│   └── 📁 ui/         (UI components - shadcn/ui)
├── 📁 contexts/       (React contexts)
├── 📁 hooks/          (Custom hooks)
├── 📁 lib/            (Utilities)
├── 📁 pages/          (Page components)
│   ├── 📁 auth/       (Auth pages)
│   ├── 📁 dashboard/  (Dashboard pages)
│   └── 📁 profile/    (Profile pages)
└── 📁 services/       (API services)
```

### 🗃️ Other Directories

```
├── 📁 public/         (Static assets)
├── 📁 database/       (Database schemas)
├── 📁 dist/           (Build output)
├── 📁 docs/           (Documentation)
├── 📁 node_modules/   (Dependencies)
├── 📁 temp/           (Temporary files)
├── 📁 uploads/        (User uploads)
├── 📁 tools/          (Development tools - 60 files)
└── 📁 tools_backup/   (Backup of tools - 61 files)
```

## 🧹 Cleanup Status

### ✅ Successfully Removed:

- **Test files**: Most test\_\*.php files from api/ directory
- **Debug files**: check_images.php, setup_notifications.php
- **Duplicate files**: Root level password reset files

### ⚠️ Note:

It appears that `git reset --hard HEAD` may have restored some files that were previously cleaned up. The `tools/` directory is back alongside `tools_backup/`, and some test files may have been restored.

### 📊 Current Stats:

- **Total Directories**: 11 main directories
- **API Files**: 39 files (clean, functional endpoints)
- **Frontend Files**: Well-organized React structure
- **Development Tools**: Both original (60 files) and backup (61 files) exist

## 🎯 Key Features:

- **Frontend**: Modern React + TypeScript with Vite
- **UI Framework**: shadcn/ui components
- **Backend**: PHP REST API
- **Database**: PostgreSQL
- **Authentication**: JWT-based auth system
- **Real-time**: WebSocket notifications
- **File Upload**: Image handling for auctions
- **Payment**: Integrated payment processing
- **Admin Panel**: Complete admin management system
