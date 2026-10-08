// Attaches the caller's Bearer token to every serverFn RPC.
// Prefer the backend JWT when present; otherwise the Supabase session.
import { createMiddleware } from '@tanstack/react-start'
import { getBackendAccessToken } from '@/lib/auth/session'
import { supabase } from './client'

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: 'function' }).client(
  async ({ next }) => {
    const backendToken = getBackendAccessToken()
    if (backendToken) {
      return next({
        headers: { Authorization: `Bearer ${backendToken}` },
      })
    }

    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    return next({
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
  },
)
