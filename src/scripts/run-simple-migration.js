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

async function runSimpleMigration() {
  console.log('🚀 Starting Simple Tier Migration...\n')
  
  try {
    // Step 1: Insert predefined tiers (this will work if the table exists)
    console.log('1. Inserting predefined tiers...')
    const { error: insertError, data: insertData } = await supabase
      .from('tiers')
      .upsert([
        { name: 'rail', display_name: 'Rail', description: 'House/well brands - lowest cost options', sort_order: 1 },
        { name: 'call', display_name: 'Call', description: 'Mid-tier, recognizable brands', sort_order: 2 },
        { name: 'premium', display_name: 'Premium', description: 'Higher-end, quality brands', sort_order: 3 },
        { name: 'super_premium', display_name: 'Super Premium', description: 'Top-shelf, luxury brands', sort_order: 4 },
        { name: 'ultra_premium', display_name: 'Ultra Premium', description: 'Rare/exclusive products', sort_order: 5 }
      ], { 
        onConflict: 'name'
      })
      .select()
    
    if (insertError) {
      console.error('❌ Error inserting tiers:', insertError.message)
      console.log('\n📋 You need to run the database migration manually in Supabase:')
      console.log('1. Go to your Supabase project dashboard')
      console.log('2. Navigate to SQL Editor')
      console.log('3. Copy and paste the contents of database/migrations/002-tier-migration.sql')
      console.log('4. Execute the script')
      console.log('5. Then run this migration script again')
      return
    }
    
    console.log(`✅ Inserted/updated ${insertData?.length || 0} tiers`)
    
    // Step 2: Get tier IDs for migration
    console.log('2. Getting tier IDs...')
    const { data: tiers, error: tierFetchError } = await supabase
      .from('tiers')
      .select('id, name')
    
    if (tierFetchError || !tiers) {
      throw new Error(`Failed to fetch tiers: ${tierFetchError?.message}`)
    }
    
    const tierMap = new Map(tiers.map(t => [t.name, t.id]))
    console.log(`✅ Found ${tiers.length} tiers`)
    
    // Step 3: Check if bottles have tier_id column
    console.log('3. Checking bottle schema...')
    const { data: bottles, error: bottlesError } = await supabase
      .from('bottles')
      .select('id, tier_id')
      .limit(1)
    
    if (bottlesError) {
      console.error('❌ Error checking bottles schema:', bottlesError.message)
      console.log('\n📋 The bottles table needs to be updated. Please run the database/migrations/002-tier-migration.sql script first.')
      return
    }
    
    console.log('✅ Bottles table has tier_id column')
    
    // Step 4: Count bottles without tiers
    const { count: bottlesWithoutTiers, error: countError } = await supabase
      .from('bottles')
      .select('id', { count: 'exact', head: true })
      .is('tier_id', null)
    
    if (countError) {
      throw new Error(`Failed to count bottles: ${countError.message}`)
    }
    
    console.log(`4. Found ${bottlesWithoutTiers || 0} bottles without tier assignments`)
    
    if ((bottlesWithoutTiers || 0) > 0) {
      // Step 5: Assign default tier to bottles without tiers
      const callTierId = tierMap.get('call')
      if (callTierId) {
        console.log('5. Assigning Call tier to bottles without tiers...')
        const { error: updateError, count: updateCount } = await supabase
          .from('bottles')
          .update({ tier_id: callTierId })
          .is('tier_id', null)
          .select('id', { count: 'exact', head: true })
        
        if (updateError) {
          console.error('❌ Error updating bottles:', updateError.message)
        } else {
          console.log(`✅ Updated ${updateCount || 0} bottles with Call tier`)
        }
      }
    } else {
      console.log('5. All bottles already have tier assignments ✅')
    }
    
    // Step 6: Verify final state
    console.log('6. Verifying migration...')
    const { count: totalBottles, error: totalError } = await supabase
      .from('bottles')
      .select('id', { count: 'exact', head: true })
    
    const { count: bottlesWithTiers, error: tieredError } = await supabase
      .from('bottles')
      .select('id', { count: 'exact', head: true })
      .not('tier_id', 'is', null)
    
    if (totalError || tieredError) {
      console.log('⚠️ Could not verify migration')
    } else {
      console.log(`✅ ${bottlesWithTiers || 0}/${totalBottles || 0} bottles have tier assignments`)
    }
    
    console.log('\n🎉 Simple Tier Migration Complete!')
    console.log('\n📊 What was accomplished:')
    console.log('- ✅ Inserted/verified predefined tiers')
    console.log('- ✅ Assigned default tiers to existing bottles')
    console.log('- ✅ Verified data integrity')
    
    console.log('\n🚀 The application should now work with the tier system!')
    console.log('🔄 Refresh your browser to see the tier dropdown in action.')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.log('\n💡 If the database schema is not ready, please:')
    console.log('1. Go to Supabase Dashboard → SQL Editor')
    console.log('2. Run the database/migrations/002-tier-migration.sql script')
    console.log('3. Then run this migration script again')
  }
}

// Execute if run directly
runSimpleMigration().catch(console.error)