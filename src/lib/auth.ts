import { supabase } from '@/integrations/supabase/client'
import { tracking } from './tracking'

export interface AuthState {
  user: any | null
  session: any | null
  loading: boolean
}

export const authService = {
  async signUp(email: string, password: string, fullName?: string) {
    const redirectUrl = `${window.location.origin}/`
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName
        }
      }
    })

    if (!error && data.user) {
      tracking.trackSignup('email')
      if (data.user.id) {
        tracking.identify(data.user.id, {
          email: data.user.email,
          full_name: fullName
        })
      }
    }

    return { data, error }
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (!error && data.user) {
      tracking.trackSignin('email')
      tracking.identify(data.user.id, {
        email: data.user.email
      })
    }

    return { data, error }
  },

  async signOut() {
    tracking.reset()
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  async getCurrentUser() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  }
}