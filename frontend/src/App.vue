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
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useSocketStore } from './stores/socket'

const auth = useAuthStore()
const socketStore = useSocketStore()
const router = useRouter()

const handleLogout = async () => {
  if (confirm('Çıkış yapmak istediğinize emin misiniz?')) {
    // BE301 Step 3: Çıkış yaparken socket bağlantısını ve dinleyicileri temizler
    socketStore.disconnect() 
    
    await auth.logout()
    router.push('/login')
  }
}

watch(() => auth.user, (newUser) => {
  if (newUser && newUser.id) {
    socketStore.joinMyRoom(newUser.id)
  }
}, { immediate: true })

onMounted(async () => {
  await auth.restoreSession()
  socketStore.init() 
})
</script>

<style>
.navbar-dark .navbar-nav .nav-link.active {
  color: #fff !important;
  border-bottom: 2px solid #0d6efd;
}
</style>