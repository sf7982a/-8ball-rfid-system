# 8Ball RFID Project Structure

## 📁 Complete Project Tree

```
8ball-rfid/
├── 📄 Configuration Files
│   ├── .env.local                    # Environment variables (Supabase config)
│   ├── .eslintrc.cjs                 # ESLint configuration
│   ├── .gitignore                    # Git ignore patterns
│   ├── .prettierrc                   # Prettier formatting config
│   ├── components.json               # shadcn/ui component config
│   ├── drizzle.config.ts             # Drizzle ORM configuration
│   ├── index.html                    # Main HTML template
│   ├── package.json                  # Dependencies and scripts
│   ├── package-lock.json             # Locked dependency versions
│   ├── postcss.config.js             # PostCSS configuration
│   ├── tailwind.config.js            # Tailwind CSS configuration
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tsconfig.node.json            # TypeScript Node.js config
│   └── vite.config.ts                # Vite build configuration
│
├── 📊 Database Files
│   ├── database-setup.sql            # Initial database schema
│   ├── database-tier-migration.sql   # Tier classification migration
│   ├── database-indexes.sql          # Performance optimization indexes
│   ├── database-rls-policies.sql     # Row Level Security policies
│   ├── database-functions.sql        # Database helper functions
│   ├── database-monitoring.sql       # Health monitoring setup
│   ├── database-backup-script.sql    # Backup procedures
│   └── quick-backup-check.sql        # Pre-migration verification
│
├── 📚 Documentation
│   ├── CLAUDE.md                     # Project instructions for Claude
│   └── docs/                         # Organized documentation
│       ├── README.md                 # Documentation navigation
│       ├── deployment/               # Production deployment guides
│       │   └── PRODUCTION_DEPLOYMENT_GUIDE.md
│       ├── integration/              # Hardware integration guides
│       │   ├── BLUETOOTH_TESTING_GUIDE.md
│       │   └── IOS-BRIDGE-INTEGRATION.md
│       ├── architecture/             # System design and structure
│       │   ├── PROJECT_STRUCTURE.md
│       │   └── TIER-SYSTEM-IMPLEMENTATION.md
│       └── development/              # Development and testing docs
│           ├── claude-instructions.md
│           ├── TEST-CREDENTIALS.md
│           └── test-fixes.md
│
├── 🏗️ Build & Dist
│   ├── dist/                         # Production build output
│   │   ├── index.html
│   │   └── assets/
│   │       ├── index-Bw4b2yUp.css
│   │       └── index-DmaQ2zED.js
│   └── drizzle/                      # Database migrations
│       └── meta/                     # Migration metadata
│
├── 🎨 Public Assets
│   └── public/                       # Static assets
│
└── 💻 Source Code (src/)
    ├── 📱 Main Application
    │   ├── App.tsx                   # Root React component
    │   ├── main.tsx                  # Application entry point
    │   └── vite-env.d.ts             # Vite type definitions
    │
    ├── 🧩 Components (src/components/)
    │   ├── auth/
    │   │   └── ProtectedRoute.tsx    # Route protection wrapper
    │   ├── dashboard/
    │   │   ├── BrandsList.tsx        # Brand statistics display
    │   │   ├── LocationStatsCard.tsx # Location-based metrics
    │   │   ├── LowStockAlert.tsx     # Stock alert notifications
    │   │   ├── StatsCard.tsx         # General statistics card
    │   │   └── TypeStats.tsx         # Bottle type statistics
    │   ├── inventory/
    │   │   ├── BottleForm.tsx        # Add/edit bottle form
    │   │   ├── BottleTable.tsx       # Bottle listing table
    │   │   └── DeleteBottleDialog.tsx # Delete confirmation
    │   ├── layout/
    │   │   ├── AppLayout.tsx         # Main application layout
    │   │   ├── Header.tsx            # Application header
    │   │   └── Navigation.tsx        # Navigation menu
    │   ├── locations/
    │   │   ├── DeleteLocationDialog.tsx # Delete location dialog
    │   │   └── LocationForm.tsx      # Add/edit location form
    │   ├── reports/
    │   │   ├── InventoryAnalysisChart.tsx # Interactive analytics
    │   │   └── InventoryTrends.tsx   # Time-series trends
    │   ├── scan/
    │   │   ├── BluetoothPairingModal.tsx # Bluetooth RFID pairing
    │   │   ├── IOSBridgeStatus.tsx   # iOS WebView status
    │   │   ├── RFIDErrorBoundary.tsx # RFID error handling
    │   │   ├── RFIDStatusMonitor.tsx # RFID hardware status
    │   │   └── UnknownRFIDModal.tsx  # Unknown bottle processing
    │   └── ui/                       # shadcn/ui components
    │       ├── alert.tsx
    │       ├── avatar.tsx
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── combobox.tsx
    │       ├── dialog.tsx
    │       ├── dropdown-menu.tsx
    │       ├── EightBallLogo.tsx     # Custom logo component
    │       ├── ErrorBoundary.tsx     # Global error boundary
    │       ├── form.tsx
    │       ├── input.tsx
    │       ├── label.tsx
    │       ├── popover.tsx
    │       ├── select.tsx
    │       ├── separator.tsx
    │       ├── sheet.tsx
    │       ├── simple-combobox-test.tsx
    │       ├── skeleton.tsx
    │       ├── sonner.tsx
    │       ├── stable-async-combobox.tsx # High-performance autocomplete
    │       ├── switch.tsx
    │       ├── table.tsx
    │       ├── tabs.tsx
    │       └── textarea.tsx
    │
    ├── 🔄 State Management (src/contexts/)
    │   ├── AuthContext.tsx           # Authentication state
    │   └── OrganizationContext.tsx   # Organization context
    │
    ├── 🎣 Custom Hooks (src/hooks/)
    │   ├── useRealtime.ts            # Supabase realtime integration
    │   ├── useRFIDIntegration.ts     # iOS bridge RFID integration
    │   ├── useRFIDScanner.ts         # RFID scanner management
    │   └── useSupabase.ts            # Supabase client hook
    │
    ├── 📚 Library Code (src/lib/)
    │   ├── api/                      # API service layer
    │   │   ├── bottles.ts            # Bottle CRUD operations
    │   │   ├── brands.ts             # Brand and product management
    │   │   ├── dashboard.ts          # Dashboard data aggregation
    │   │   ├── migration.ts          # Data migration services
    │   │   ├── reports.ts            # Analytics and reporting
    │   │   ├── rfid-ingest.ts        # RFID data processing
    │   │   ├── scanning.ts           # Scan session management
    │   │   ├── tier-migration.ts     # Tier system migration
    │   │   └── tiers.ts              # Tier classification API
    │   ├── db/                       # Database layer
    │   │   ├── index.ts              # Database client setup
    │   │   └── schema.ts             # Drizzle schema definitions
    │   ├── rfid/                     # RFID integration layer
    │   │   ├── bluetooth-rfd40.ts    # Bluetooth RFID service
    │   │   ├── mock-rfid-service.ts  # Development mock service
    │   │   └── zebra-rfd40.ts        # Zebra Enterprise Browser API
    │   ├── supabase.ts               # Supabase client configuration
    │   └── utils.ts                  # Utility functions
    │
    ├── 📄 Pages (src/pages/)
    │   ├── auth/
    │   │   ├── LoginPage.tsx         # User login
    │   │   └── SignupPage.tsx        # User registration
    │   ├── dashboard/
    │   │   └── DashboardPage.tsx     # Main dashboard
    │   ├── inventory/
    │   │   └── InventoryPage.tsx     # Bottle inventory management
    │   ├── locations/
    │   │   └── LocationsPage.tsx     # Location management
    │   ├── reports/
    │   │   └── ReportsPage.tsx       # Analytics and reports
    │   ├── scan/
    │   │   └── ScanPage.tsx          # RFID scanning interface
    │   ├── settings/
    │   │   └── SettingsPage.tsx      # User settings
    │   └── team/
    │       └── TeamPage.tsx          # Team management
    │
    ├── 🔧 Scripts (src/scripts/)
    │   ├── add-indexes.ts            # Database index creation
    │   ├── migration-node.ts         # Node.js migration runner
    │   ├── run-migration.ts          # Migration execution
    │   ├── supabase-node.ts          # Node.js Supabase client
    │   ├── test-ios-bridge.ts        # iOS bridge testing
    │   ├── test-normalization.ts     # Data normalization tests
    │   ├── test-queries-only.ts      # Database query tests
    │   └── test-tier-system.ts       # Tier system validation
    │
    ├── 🏷️ Type Definitions (src/types/)
    │   ├── auth.ts                   # Authentication types
    │   ├── database.ts               # Database schema types
    │   ├── inventory.ts              # Inventory system types
    │   └── ios-bridge.ts             # iOS bridge interfaces
    │
    └── 🛠️ Utilities (src/utils/)
        ├── inventoryRFIDIntegration.ts # RFID-inventory workflow
        └── migration-runner.ts       # Migration execution utilities
```

## 🏗️ Architecture Layers

### **Frontend Layer** (React + TypeScript)
- **Pages**: Route-level components with business logic
- **Components**: Reusable UI components organized by feature
- **Hooks**: Custom React hooks for state and API management
- **Contexts**: Global state management (Auth, Organization)

### **API Service Layer** (src/lib/api/)
- **bottles.ts**: Complete bottle lifecycle management
- **brands.ts**: Brand/product normalization and autocomplete
- **tiers.ts**: 5-tier classification system
- **dashboard.ts**: Real-time analytics aggregation
- **reports.ts**: Time-series and trend analysis
- **scanning.ts**: RFID scan session management
- **migration.ts**: Data normalization utilities

### **RFID Integration Layer** (src/lib/rfid/)
- **zebra-rfd40.ts**: Enterprise Browser API integration
- **bluetooth-rfd40.ts**: Web Bluetooth API for mobile
- **mock-rfid-service.ts**: Development testing service

### **Database Layer** (src/lib/db/)
- **schema.ts**: Drizzle ORM schema with tier support
- **index.ts**: Database client configuration
- **Migration Scripts**: Production-ready SQL deployment

### **Type System** (src/types/)
- **Complete TypeScript coverage** for all entities
- **Database schema mapping** with Drizzle integration
- **API response interfaces** for type safety
- **RFID hardware interfaces** for multiple integration methods

## 🔑 Key Features Implemented

### ✅ **Tier Classification System**
- 5-tier hierarchy: Rail → Call → Premium → Super Premium → Ultra Premium
- Smart auto-fill based on brand defaults
- Learning system that updates brand tiers based on user input
- Complete migration from product names to tier structure

### ✅ **Multi-Platform RFID Integration**
- **Zebra Enterprise Browser**: Direct API integration
- **Web Bluetooth**: Mobile device pairing with RFD40
- **iOS WebView Bridge**: Native app integration support
- **Mock Service**: Development testing without hardware

### ✅ **Real-time Dashboard & Analytics**
- Live inventory tracking with Supabase realtime
- Tier-based distribution analysis
- Location-specific metrics and low stock alerts
- Interactive drill-down charts and time-series trends

### ✅ **Multi-tenant Architecture**
- Organization-scoped data isolation
- Role-based access control (Staff/Manager/Admin)
- Row Level Security (RLS) policies
- Comprehensive audit logging

### ✅ **Advanced Autocomplete System**
- Normalized brand and product relationships
- High-performance async combobox with debouncing
- Create-on-the-fly functionality
- Flicker-free rendering and smooth UX

### ✅ **Production-Ready Features**
- Clean TypeScript compilation with zero errors
- Comprehensive error boundaries and handling
- Performance-optimized database queries and indexes
- Mobile-responsive design with touch-friendly interface
- Complete backup and monitoring procedures

## 📊 Database Schema

### **Core Tables**
- **organizations**: Multi-tenant organization management
- **profiles**: User accounts with role-based permissions
- **locations**: Physical location tracking
- **bottles**: RFID-tagged inventory with tier classification
- **brands**: Normalized brand management with default tiers
- **product_names**: Product catalog linked to brands
- **tiers**: 5-tier classification system
- **scan_sessions**: RFID scanning workflow management
- **activity_logs**: Comprehensive audit trail

### **Performance Optimization**
- **27 strategic indexes** for optimal query performance
- **Composite indexes** for multi-tenant and time-series queries
- **Full-text search indexes** for advanced search capabilities
- **Foreign key optimization** for relationship queries

## 🚀 Deployment Status

- ✅ **Development Environment**: Complete and functional
- ✅ **Database Migration**: Production-ready SQL scripts
- ✅ **Performance Indexes**: Optimized for large-scale deployment
- ✅ **Security Policies**: RLS and multi-tenant isolation
- ✅ **Monitoring Setup**: Health checks and anomaly detection
- ✅ **Backup Procedures**: Automated backup and recovery
- 🔄 **Hardware Testing**: Ready for Zebra RFD40 integration
- 🔄 **Production Deployment**: Database scripts prepared

The project is **production-ready** with comprehensive documentation, testing procedures, and deployment guides!