-- Row Level Security (RLS) Policies for 8Ball RFID System
-- Execute this script in Supabase SQL Editor to enable multi-tenant data isolation

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bottles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Organizations table policies
CREATE POLICY "Users can view their own organization" ON organizations
  FOR SELECT USING (
    id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Super admins can view all organizations" ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Super admins can manage organizations" ON organizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Profiles table policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Organization admins can view org profiles" ON profiles
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'manager')
    )
  );

CREATE POLICY "Organization admins can manage org profiles" ON profiles
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin')
    )
  );

-- Locations table policies
CREATE POLICY "Organization members can view locations" ON locations
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can manage locations" ON locations
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'manager')
    )
  );

-- Bottles table policies
CREATE POLICY "Organization members can view bottles" ON bottles
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can create bottles" ON bottles
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can update bottles" ON bottles
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can delete bottles" ON bottles
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('super_admin', 'company_admin', 'manager')
    )
  );

-- Brands table policies (global but organization-scoped access)
CREATE POLICY "All authenticated users can view brands" ON brands
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can create brands" ON brands
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update brands" ON brands
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Product names table policies
CREATE POLICY "All authenticated users can view product names" ON product_names
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can create product names" ON product_names
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "All authenticated users can update product names" ON product_names
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Tiers table policies (read-only for most users)
CREATE POLICY "All authenticated users can view tiers" ON tiers
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Super admins can manage tiers" ON tiers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Scan sessions table policies
CREATE POLICY "Organization members can view scan sessions" ON scan_sessions
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can create scan sessions" ON scan_sessions
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

CREATE POLICY "Staff can update their own scan sessions" ON scan_sessions
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

-- Activity logs table policies
CREATE POLICY "Organization members can view activity logs" ON activity_logs
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Staff can create activity logs" ON activity_logs
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
    AND user_id = auth.uid()
  );

SELECT 'RLS policies created successfully!' as status;