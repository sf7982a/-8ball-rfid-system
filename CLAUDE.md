# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Development
- **Start development server**: `npm run dev` (runs on localhost:5173)
- **Build for production**: `npm run build` (TypeScript compilation + Vite build)
- **Preview production build**: `npm run preview`
- **Lint code**: `npm run lint` (ESLint with TypeScript support)

### Database Operations
- **Push schema changes**: `npm run db:push` (pushes Drizzle schema to PostgreSQL)
- **Generate migrations**: `npm run db:generate`
- **Run migrations**: `npm run db:migrate`
- **Open database studio**: `npm run db:studio` (Drizzle Kit Studio)
- **Pull schema from database**: `npm run db:pull`

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Supabase Auth
- **State Management**: React Context + TanStack Query
- **Routing**: React Router DOM v6
- **Forms**: React Hook Form + Zod validation

### Project Structure
This is an RFID bottle tracking system for hospitality businesses with the following core domains:

- **Authentication & Authorization**: Role-based access control (super_admin, company_admin, manager, staff)
- **Multi-tenancy**: Organization-scoped data with proper isolation
- **Inventory Management**: RFID-tagged bottle tracking with status management
- **Location Management**: Physical location tracking for bottles
- **Scanning & Sessions**: Real-time RFID scanning workflows
- **Reporting & Analytics**: Data visualization with Recharts
- **Activity Logging**: Comprehensive audit trails

### Key Components
- **AuthContext** (`src/contexts/AuthContext.tsx`): Handles user authentication, profile management, and role-based permissions
- **Database Schema** (`src/lib/db/schema.ts`): Drizzle schema defining organizations, profiles, bottles, locations, scan sessions, and activity logs
- **Supabase Client** (`src/lib/supabase.ts`): Configured for PKCE auth flow and realtime subscriptions
- **Protected Routes**: Role-based route protection with hierarchical permissions

### Database Schema Key Points
- Uses PostgreSQL enums for user roles and bottle status
- All tables are organization-scoped for multi-tenancy
- RFID tags are unique constraints for bottle identification
- Comprehensive metadata fields using JSONB for extensibility
- Activity logging for audit trails

### UI Components
Built with shadcn/ui and Radix UI primitives:
- Consistent design system with CSS custom properties
- Dark mode support via class-based toggle
- Responsive layouts with mobile-first approach
- Form components with built-in validation states

## Environment Setup
Requires `.env.local` file with:
- `DATABASE_URL` (PostgreSQL connection string)
- `VITE_SUPABASE_URL` 
- `VITE_SUPABASE_ANON_KEY`

## Development Notes
- Path aliases configured: `@/*` maps to `./src/*`
- TypeScript strict mode enabled
- ESLint configured for React + TypeScript
- Vite dev server configured for network access (host: true)
- Uses React 18 concurrent features

## Recent Project Status (Last Updated: January 2025)

### ✅ **Completed Major Milestones:**

#### **Database Schema Enhancement (COMPLETED)**
- ✅ **Enhanced PostgreSQL schema** successfully migrated to Supabase
- ✅ **Type-safe enums** created: `user_role`, `bottle_status`, `bottle_type`
- ✅ **Organization slugs** added for URL-friendly identifiers
- ✅ **Scan sessions table** created for RFID bulk scanning workflows
- ✅ **Activity logs table** implemented for comprehensive audit trails
- ✅ **Enhanced bottles table** with proper product/size fields and metadata
- ✅ **Locations enhanced** with codes and flexible settings

#### **Bulk RFID Scanning Implementation (COMPLETED)**
- ✅ **Unknown bottle detection** and bulk processing workflow
- ✅ **Enhanced ScanPage** with real-time RFID simulation
- ✅ **UnknownRFIDModal** with bulk/individual entry modes
- ✅ **Bulk bottle creation** API with proper validation
- ✅ **Memory leak fixes** in search debounce functionality
- ✅ **Console log cleanup** for cleaner development experience

#### **Supabase Integration (COMPLETED)**
- ✅ **Mock services removed** - All API calls now use real Supabase database
- ✅ **Database connections** - Full CRUD operations implemented
- ✅ **Authentication integration** - Connected to Supabase Auth
- ✅ **Real-time data** - Live database queries and updates

#### **Real-time Inventory Dashboard (COMPLETED)**
- ✅ **Dashboard overview** - Total bottles, value, low stock metrics with real Supabase data
- ✅ **Location-based filtering** - Stock levels at individual locations with drill-down
- ✅ **Brand breakdown** - Top brands across locations with search functionality
- ✅ **Type-based grouping** - Vodka, Whiskey, etc. with color-coded indicators
- ✅ **Low stock alerts** - Configurable thresholds with critical/warning levels
- ✅ **Real-time updates** - Supabase subscriptions for live data refresh
- ✅ **Mobile-first design** - Touch-friendly interface optimized for tablets/phones

#### **Interactive Reports & Analytics (COMPLETED)**
- ✅ **Inventory Analysis** - Drill-down bar chart with category → brand navigation
- ✅ **Location filtering** - Dynamic filtering across all report views
- ✅ **Metric switching** - Toggle between bottles count, dollar value, volume
- ✅ **Export functionality** - CSV export with location context in filenames
- ✅ **Time-series Trends** - Enhanced line chart with real Supabase data integration
- ✅ **Historical reconstruction** - Activity logs analysis with fallback strategies
- ✅ **Business insights** - Consumption velocity, trend indicators, stockout predictions
- ✅ **Visual enhancements** - 3px lines, hover effects, zoom controls, critical thresholds

#### **Code Quality Improvements (COMPLETED)**
- ✅ **TypeScript build** - zero errors, production ready
- ✅ **Form validation** - comprehensive Zod schemas with real-time validation
- ✅ **Mobile responsiveness** - proper breakpoints and touch targets
- ✅ **Error handling** - consistent patterns across all components
- ✅ **Performance optimizations** - proper cleanup and memory management
- ✅ **Real data integration** - All mock services replaced with Supabase queries

### 🎯 **Current State:**
- **Database**: Fully migrated enhanced schema in Supabase ✓
- **Frontend**: Complete RFID scanning workflows connected to Supabase ✓
- **API Integration**: All services using real Supabase database connections ✓
- **Dashboard**: Real-time inventory dashboard with live data and mobile optimization ✓
- **Reports**: Interactive analytics with drill-down charts and time-series trends ✓
- **Data Integration**: Historical reconstruction from activity logs with intelligent fallbacks ✓
- **Build Status**: Clean TypeScript compilation ✓
- **Testing**: All major workflows tested and verified ✓

### 🚀 **Next Phase Priorities:**

#### **Hardware Integration Phase (HIGH PRIORITY)**
1. **Real RFID Integration** - Replace simulation with actual RFID hardware APIs
2. **Multi-tenant Routing** - Implement organization-based URL routing with slugs
3. **Activity Log Enhancement** - Capture more granular inventory change events for better trend analysis

#### **Production Readiness (MEDIUM PRIORITY)**
1. **Error Boundaries** - Add React error boundaries for graceful failure handling
2. **Code Splitting** - Implement dynamic imports to reduce bundle size (currently ~1MB)
3. **Toast Notifications** - Replace basic alerts with proper toast system
4. **Accessibility** - Add ARIA labels and keyboard navigation improvements
5. **Performance Optimization** - Optimize chart rendering and data processing for large datasets

#### **Business Features (LOW PRIORITY)**
1. **Predictive Analytics** - ML-based consumption forecasting and reorder recommendations
2. **Advanced Exports** - PDF reports and Excel templates with charts
3. **Scheduled Reports** - Automated email delivery of inventory summaries
4. **Advanced Search** - Full-text search across bottles and locations with filters
5. **Custom Dashboards** - User-configurable dashboard layouts and widgets

### 📋 **Key Files & Structure:**
- **Core RFID Logic**: `src/pages/scan/ScanPage.tsx` - Main scanning interface
- **Bulk Processing**: `src/components/scan/UnknownRFIDModal.tsx` - Handle unknown bottles
- **Real-time Dashboard**: `src/pages/dashboard/DashboardPage.tsx` - Live inventory overview
- **Dashboard Components**: `src/components/dashboard/` - StatsCard, LocationStatsCard, BrandsList, etc.
- **Interactive Reports**: `src/pages/reports/ReportsPage.tsx` - Analytics and trends
- **Report Components**: `src/components/reports/` - InventoryAnalysisChart, InventoryTrends
- **API Layer**: `src/lib/api/bottles.ts`, `src/lib/api/dashboard.ts`, `src/lib/api/reports.ts` - All connected to Supabase
- **Database Schema**: `src/lib/db/schema.ts` - Matches deployed Supabase schema
- **Types**: `src/types/inventory.ts` - TypeScript definitions for all entities

### 🔧 **Development Commands Verified:**
- `npm run dev` - Starts development server (working)
- `npm run build` - Clean TypeScript build (working)  
- `npm run lint` - ESLint passes (working)
- Database operations completed via Supabase SQL Editor

The project now features a **complete real-time inventory management system** with:
- **Live dashboard** showing current stock levels across all locations
- **Interactive analytics** with drill-down capabilities and export functions  
- **Time-series trend analysis** with consumption velocity tracking
- **Enhanced mobile experience** optimized for tablets and smartphones
- **Real Supabase integration** with intelligent fallback strategies

**Ready for hardware integration and production deployment!**