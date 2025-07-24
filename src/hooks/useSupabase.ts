import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'

export function useSupabaseQuery<T = any>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options?: any
) {
  const { user, profile } = useAuth()
  
  return useQuery({
    queryKey: [...queryKey, profile?.organization_id],
    queryFn,
    enabled: !!user,
    ...options,
  })
}

export function useSupabaseMutation<TData = any, TVariables = any>(
  mutationFn: (_variables: TVariables) => Promise<TData>,
  options?: any
) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries()
    },
    ...options,
  })
}