'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrate = useAuthStore(s => s.hydrate)

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
          },
        },
      })
  )

  // Rehidratar la sesión desde sessionStorage al arrancar la app.
  // Sin esto, el store queda en null tras cada recarga de página aunque
  // el access-token y las cookies sigan presentes.
  useEffect(() => {
    hydrate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
