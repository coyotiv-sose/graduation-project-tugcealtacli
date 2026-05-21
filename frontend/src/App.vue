<template>
  <div class="bg-light min-vh-100">
    <nav v-if="auth.isLoggedIn" class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
      <div class="container-fluid px-4">
        <router-link class="navbar-brand fw-bolder fs-4 tracking-wider" to="/">
          <span class="text-primary">T</span>UVIA
        </router-link>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#tuviaMenu">
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="tuviaMenu">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0 fw-semibold">
            <li class="nav-item">
              <router-link class="nav-link" active-class="active" to="/">Özet</router-link>
            </li>
            <li class="nav-item" v-if="auth.user?.role === 'manager'">
              <router-link class="nav-link" active-class="active" to="/employees">Çalışanlar</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" active-class="active" to="/tasks">Görevler</router-link>
            </li>
            <li class="nav-item" v-if="auth.user?.role === 'manager'">
              <router-link class="nav-link" active-class="active" to="/approvals">Onaylar</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" active-class="active" to="/kanban">Kanban</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" active-class="active" to="/leaderboard">Liderlik</router-link>
            </li>
          </ul>

          <div class="d-flex align-items-center gap-3">
            <div class="text-end text-white me-3">
              <div class="small text-secondary fw-bold text-uppercase" style="font-size: 0.7rem;">
                {{ auth.user?.role === 'manager' ? 'Yönetici' : 'Çalışan' }}
              </div>
              <div class="fw-bold">
                {{ auth.user?.name }} 
                <span class="badge bg-warning text-dark ms-2">{{ auth.user?.points || 0 }} Puan</span>
              </div>
            </div>
            <button @click="handleLogout" class="btn btn-outline-danger btn-sm fw-bold px-3">
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="container py-4">
      <router-view />
    </main>

    <div class="toast-container position-fixed bottom-0 end-0 p-4" style="z-index: 9999;">
      <div 
        v-for="notif in notifications" 
        :key="notif.id" 
        class="toast show align-items-center border-0 mb-3 shadow-lg"
        :class="getToastColor(notif.type)"
        role="alert"
      >
        <div class="d-flex">
          <div class="toast-body d-flex align-items-start gap-3 text-white">
            <span class="fs-4 lh-1">{{ getToastIcon(notif.type) }}</span>
            <div>
              <strong class="d-block fs-6 mb-1">{{ notif.title }}</strong>
              <span style="font-size: 0.9rem;">{{ notif.message }}</span>
            </div>
          </div>
          <button @click="removeNotification(notif.id)" type="button" class="btn-close btn-close-white me-3 m-auto shadow-none"></button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import api from './services/api'
import { io } from 'socket.io-client'

const auth = useAuthStore()
const router = useRouter()

const notifications = ref([])
let socket = null

const getToastColor = (type) => {
  if (type === 'success') return 'bg-success'
  if (type === 'error') return 'bg-danger'
  if (type === 'info') return 'bg-primary'
  if (type === 'warning') return 'bg-warning text-dark'
  return 'bg-dark'
}

const getToastIcon = (type) => {
  if (type === 'success') return '✅'
  if (type === 'error') return '❌'
  if (type === 'info') return '🔔'
  if (type === 'warning') return '⚠️'
  return '💬'
}

const removeNotification = (id) => {
  notifications.value = notifications.value.filter(n => n.id !== id)
}

const initSocket = (user) => {
  if (socket) socket.disconnect()
  
  // Api baseURL üzerinden dinamik olarak sunucuya bağlanır
  const backendUrl = api.defaults.baseURL || 'http://localhost:3000'
  socket = io(backendUrl, { withCredentials: true })

  socket.on('connect', () => {
    // Backend'e kullanıcının ID'sini ve ROLÜNÜ gönderiyoruz ki doğru bildirimleri alsın
    socket.emit('join_user_room', { userId: user.id, role: user.role })
  })

  socket.on('notification', (data) => {
    const notif = { ...data, id: Date.now() }
    notifications.value.push(notif)
    
    // Bildirimi 6 saniye sonra ekrandan otomatik sil
    setTimeout(() => {
      removeNotification(notif.id)
    }, 6000)
  })
}

const handleLogout = async () => {
  if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
    if (socket) socket.disconnect()
    await auth.logout()
    router.push('/login')
  }
}

watch(() => auth.user, (newUser) => {
  if (newUser && newUser.id) {
    initSocket(newUser)
  }
}, { immediate: true })

onMounted(async () => {
  await auth.restoreSession()
})
</script>

<style>
.navbar-dark .navbar-nav .nav-link.active {
  color: #fff !important;
  border-bottom: 2px solid #0d6efd;
}
</style>