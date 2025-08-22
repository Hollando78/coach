import axios from 'axios'
import { useGameStore } from '../state/gameStore'

const API_BASE = import.meta.env.VITE_API_BASE || '/doodle-td-api'

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
})

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = useGameStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        const { data } = await apiClient.post('/auth/refresh')
        useGameStore.getState().setAccessToken(data.accessToken)
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        // Refresh failed, logout
        useGameStore.getState().setUser(null)
        useGameStore.getState().setAccessToken(null)
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// API methods
export const auth = {
  register: async (email: string, password: string, displayName: string) => {
    const { data } = await apiClient.post('/auth/register', {
      email,
      password,
      displayName,
    })
    return data
  },
  
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', {
      email,
      password,
    })
    return data
  },
  
  logout: async () => {
    await apiClient.post('/auth/logout')
  },
  
  me: async () => {
    const { data } = await apiClient.get('/auth/me')
    return data
  },
}

export const score = {
  submit: async (scoreData: any) => {
    const { data } = await apiClient.post('/score', scoreData)
    return data
  },
}

export const save = {
  get: async () => {
    const { data } = await apiClient.get('/save')
    return data
  },
  
  post: async (saveData: any) => {
    const { data } = await apiClient.post('/save', { blob: saveData })
    return data
  },
}

export const leaderboard = {
  get: async (mode?: string, limit: number = 50) => {
    const params = new URLSearchParams()
    if (mode) params.append('mode', mode)
    params.append('limit', limit.toString())
    
    const { data } = await apiClient.get(`/leaderboard?${params}`)
    return data
  },
}