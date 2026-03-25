import { create } from 'zustand'

interface User { id: number; email: string; display_name: string; role: string; avatar_url?: string }
interface AuthState {
  token: string | null
  user: User | null
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('chat_admin_token'),
  user: (() => { try { return JSON.parse(localStorage.getItem('chat_admin_user') || 'null') } catch { return null } })(),
  setAuth: (token, user) => {
    localStorage.setItem('chat_admin_token', token)
    localStorage.setItem('chat_admin_user', JSON.stringify(user))
    set({ token, user })
  },
  clearAuth: () => {
    localStorage.removeItem('chat_admin_token')
    localStorage.removeItem('chat_admin_user')
    set({ token: null, user: null })
  },
}))
