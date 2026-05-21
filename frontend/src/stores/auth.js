import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  const restoreSession = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      user.value = null
      return
    }

    try {
      loading.value = true
      const res = await api.get('/auth/me')
      user.value = res.data
    } catch (error) {
      user.value = null
      localStorage.removeItem('token')
    } finally {
      loading.value = false
    }
  }

  const login = async (email, password) => {
    loading.value = true
    try {
      const res = await api.post('/auth/login', { email, password })
      user.value = res.data.user
      localStorage.setItem('token', res.data.token)
      return res.data.user
    } finally {
      loading.value = false
    }
  }

  const register = async (userData) => {
    loading.value = true
    try {
      const res = await api.post('/auth/register', userData)
      return res.data
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // sessiz geç
    }

    user.value = null
    localStorage.removeItem('token')
  }

  return {
    user,
    loading,
    isLoggedIn,
    restoreSession,
    login,
    register,
    logout,
  }
})