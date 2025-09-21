# Database Setup and Management

This directory contains all database-related SQL scripts and documentation for the 8Ball RFID bottle tracking system.

## Directory Structure

```
database/
├── migrations/          # Database schema and migration scripts
├── functions/          # Stored procedures and database functions
├── monitoring/         # Database monitoring and performance scripts
├── backup/            # Backup and restore scripts
└── README.md          # This documentation file
```

## Deployment Order

For a fresh database setup, execute scripts in this order:

### 1. Initial Setup
```bash
# Execute the main schema setup
psql -d your_database -f database/migrations/001-initial-schema.sql

# Apply tier classification system
psql -d your_database -f database/migrations/002-tier-migration.sql

# Add performance indexes
psql -d your_database -f database/migrations/003-indexes.sql

# Configure Row Level Security policies
psql -d your_database -f database/migrations/004-rls-policies.sql
```

### 2. Database Functions
```bash
# Install custom database functions
psql -d your_database -f database/functions/database-functions.sql
```

### 3. Monitoring Setup
```bash
# Setup monitoring queries and views
psql -d your_database -f database/monitoring/database-monitoring.sql
```

## Migration Files

- **001-initial-schema.sql** - Complete database schema with tables, indexes, and constraints
- **002-tier-migration.sql** - Tier classification system (Rail, Call, Premium, Super Premium, Ultra Premium)
- **003-indexes.sql** - Performance optimization indexes for queries
- **004-rls-policies.sql** - Row Level Security policies for multi-tenant data isolation

## Functions

- **database-functions.sql** - Custom stored procedures and database functions

## Monitoring

- **database-monitoring.sql** - Monitoring queries, performance views, and health checks

## Backup & Recovery

- **database-backup-script.sql** - Comprehensive backup procedures
- **quick-backup-check.sql** - Quick validation and health check queries

## Environment Variables

Ensure these environment variables are set:
- `DATABASE_URL` - PostgreSQL connection string
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

## Development Commands

From the project root:
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate new migrations
- `npm run db:migrate` - Run pending migrations
- `npm run db:studio` - Open Drizzle Studio

## Production Deployment

1. Run migration scripts in order (001 → 004)
2. Install database functions
3. Setup monitoring
4. Configure backup schedule
5. Verify all indexes are created
6. Test RLS policies

## Notes

- All scripts are designed for PostgreSQL 13+
- Scripts include proper error handling and rollback procedures
- RLS policies ensure proper multi-tenant data isolation
- Indexes are optimized for the application's query patterns

For questions or issues, refer to the main project documentation in CLAUDE.md.