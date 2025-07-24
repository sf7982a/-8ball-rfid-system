import { useEffect } from 'react'
import { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useQueryClient } from '@tanstack/react-query'

export function useRealtimeSubscription(
  table: string,
  callback?: (_payload: any) => void
) {
  const { organization } = useAuth()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!organization) return

    let channel: RealtimeChannel

    const setupSubscription = async () => {
      channel = supabase
        .channel(`${table}-${organization.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: `organization_id=eq.${organization.id}`,
          },
          (payload) => {
            if (callback) {
              callback(payload)
            }
            // Invalidate relevant queries
            queryClient.invalidateQueries({ queryKey: [table] })
          }
        )
        .subscribe()
    }

    setupSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [organization, table, callback, queryClient])
}