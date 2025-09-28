#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function fixActivityLogsSchema() {
  console.log('🚀 Starting Activity Logs Schema Fix...\n')

  try {
    // Step 1: Check if resource_type column exists
    console.log('1. Checking activity_logs schema...')

    // Try to select resource_type column to see if it exists
    const { data: testData, error: testError } = await supabase
      .from('activity_logs')
      .select('id, resource_type')
      .limit(1)

    if (testError && testError.code === '42703') {
      console.log('❌ resource_type column does not exist, adding it...')

      // Use the RPC function to execute raw SQL
      const { data, error: addColumnError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE activity_logs ADD COLUMN resource_type TEXT;'
      })

      if (addColumnError) {
        console.error('❌ Failed to add column via RPC:', addColumnError.message)
        console.log('\n📋 Please add the column manually in Supabase SQL Editor:')
        console.log('ALTER TABLE activity_logs ADD COLUMN resource_type TEXT;')
        return
      }

      console.log('✅ resource_type column added successfully')
    } else if (testError) {
      console.error('❌ Error checking schema:', testError.message)
      return
    } else {
      console.log('✅ resource_type column already exists')
    }

    // Step 2: Update existing records with default resource_type
    console.log('2. Updating existing records...')

    const { count: recordsWithoutType, error: countError } = await supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .is('resource_type', null)

    if (countError) {
      console.error('❌ Error counting records:', countError.message)
      return
    }

    console.log(`Found ${recordsWithoutType || 0} records without resource_type`)

    if ((recordsWithoutType || 0) > 0) {
      // Update records without resource_type based on action patterns
      const updateQueries = [
        {
          description: 'bulk_inventory_processing actions',
          filter: { action: 'bulk_inventory_processing' },
          resourceType: 'bottles'
        },
        {
          description: 'scan session actions',
          filter: { action: 'scan_session_started' },
          resourceType: 'scan_session'
        },
        {
          description: 'scan session actions',
          filter: { action: 'scan_session_completed' },
          resourceType: 'scan_session'
        },
        {
          description: 'other actions (default)',
          filter: {},
          resourceType: 'bottle'
        }
      ]

      for (const query of updateQueries) {
        if (Object.keys(query.filter).length > 0) {
          const { count: updated, error: updateError } = await supabase
            .from('activity_logs')
            .update({ resource_type: query.resourceType })
            .match(query.filter)
            .is('resource_type', null)
            .select('id', { count: 'exact', head: true })

          if (updateError) {
            console.error(`❌ Error updating ${query.description}:`, updateError.message)
          } else {
            console.log(`✅ Updated ${updated || 0} records for ${query.description}`)
          }
        } else {
          // Handle remaining records without specific filters
          const { count: remaining, error: remainingError } = await supabase
            .from('activity_logs')
            .update({ resource_type: query.resourceType })
            .is('resource_type', null)
            .select('id', { count: 'exact', head: true })

          if (remainingError) {
            console.error(`❌ Error updating remaining records:`, remainingError.message)
          } else {
            console.log(`✅ Updated ${remaining || 0} remaining records with default resource_type`)
          }
        }
      }
    }

    // Step 3: Verify the fix
    console.log('3. Verifying fix...')

    const { data: verificationData, error: verificationError } = await supabase
      .from('activity_logs')
      .select('resource_type')
      .eq('resource_type', 'bottle')
      .limit(1)

    if (verificationError) {
      console.error('❌ Error verifying fix:', verificationError.message)
    } else {
      console.log('✅ Activity logs schema fix completed successfully!')
      console.log('\n🎉 The reports functionality should now work properly.')
    }

  } catch (error) {
    console.error('❌ Schema fix failed:', error.message)
    console.log('\n💡 Manual fix required:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Run: ALTER TABLE activity_logs ADD COLUMN resource_type TEXT;')
    console.log('3. Run: UPDATE activity_logs SET resource_type = \'bottle\' WHERE resource_type IS NULL;')
  }
}

// Execute if run directly
fixActivityLogsSchema().catch(console.error)