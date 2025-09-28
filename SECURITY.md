# Security Configuration Guide

## Environment Variables Security

### Development
- Use `.env.local` for local development (already gitignored)
- Copy from `.env.example` and fill in actual values
- Never commit real credentials to version control

### Production Deployment
- Use platform-specific environment variable configuration:
  - **Vercel**: Project settings → Environment Variables
  - **Netlify**: Site settings → Environment variables
  - **Docker**: Use secrets management or encrypted environment files
  - **AWS/GCP/Azure**: Use their respective secret management services

### Required Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://user:pass@host:port/db
```

### Security Best Practices

#### 1. Environment Variable Management
- ✅ Use different keys for development, staging, and production
- ✅ Rotate keys regularly (quarterly recommended)
- ✅ Use least-privilege access (anon key, not service role key in frontend)
- ✅ Monitor key usage and audit logs
- ❌ Never hardcode credentials in source code
- ❌ Never commit `.env.local` or production environment files

#### 2. Supabase Security
- ✅ Enable Row Level Security (RLS) on all tables
- ✅ Use proper user roles and permissions
- ✅ Configure CORS properly for your domain
- ✅ Enable email confirmation for new users
- ✅ Set up MFA for admin accounts
- ✅ Regular security audit of database policies

#### 3. Application Security
- ✅ Input validation using Zod schemas (implemented)
- ✅ SQL injection prevention (implemented)
- ✅ Authentication bypass prevention (implemented)
- ✅ Sensitive data logging removal (implemented)
- ✅ HTTPS enforcement in production
- ✅ Content Security Policy (CSP) headers
- ✅ Rate limiting on API endpoints

#### 4. Database Security
```sql
-- Enable RLS on all tables
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ... (enable for all tables)

-- Example RLS policy for organization-scoped data
CREATE POLICY "Users can only access their org bottles"
ON bottles FOR ALL
TO authenticated
USING (organization_id = get_user_org_id());
```

#### 5. Deployment Security Checklist
- [ ] Environment variables configured on hosting platform
- [ ] HTTPS enabled and enforced
- [ ] Database connection uses SSL
- [ ] RLS policies tested and verified
- [ ] Admin users have strong passwords
- [ ] Backup and recovery procedures tested
- [ ] Monitoring and alerting configured
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Error messages don't expose sensitive information

#### 6. Monitoring and Compliance
- Monitor failed login attempts
- Log all data access and modifications
- Regular security audits
- GDPR/privacy compliance for user data
- Data retention policies
- Incident response procedures

## Emergency Response

### Security Incident Response
1. **Immediate**: Rotate all API keys and credentials
2. **Assess**: Determine scope of potential breach
3. **Notify**: Inform users if personal data may be affected
4. **Document**: Log all actions taken
5. **Review**: Conduct post-incident security review

### Key Rotation Procedure
1. Generate new keys in Supabase dashboard
2. Update environment variables on hosting platform
3. Test application functionality
4. Revoke old keys
5. Monitor for any issues

## Contact
For security concerns or vulnerabilities, please contact the development team through secure channels.