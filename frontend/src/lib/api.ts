import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export const APP_BASE: string = (import.meta.env.VITE_ROUTER_BASE as string) ?? ''

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chat_admin_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('chat_admin_token')
      localStorage.removeItem('chat_admin_user')
      window.location.href = `${APP_BASE}/login`
    }
    return Promise.reject(error)
  }
)
