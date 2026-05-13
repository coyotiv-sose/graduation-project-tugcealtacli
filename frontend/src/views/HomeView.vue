<template>
  <div class="container py-4">
    
    <!-- Karşılama Kartı -->
    <div class="row mb-4">
      <div class="col-12">
        <div class="card bg-primary text-white border-0 shadow-sm overflow-hidden">
          <div class="card-body p-4 p-md-5 position-relative">
            <!-- Arka Plan Süslemesi -->
            <div class="position-absolute top-0 end-0 h-100 w-50 bg-white opacity-10" style="clip-path: polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%);"></div>
            
            <div class="position-relative z-1">
              <h2 class="fw-bolder mb-2">Merhaba, {{ auth.user?.name }} 👋</h2>
              <p class="lead mb-4 opacity-75">Tuvia sistemine hoş geldin. Bugün yeteneklerini sergilemek ve ekibe destek olmak için harika bir gün!</p>
              
              <div class="d-flex flex-wrap gap-2">
                <router-link to="/tasks" class="btn btn-light fw-bold px-4 shadow-sm">
                  Görev Merkezi'ne Git
                </router-link>
                <router-link v-if="auth.user?.role === 'manager'" to="/approvals" class="btn btn-outline-light fw-bold px-4">
                  Bekleyen Onaylar
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- İstatistik ve Bilgi Kartları -->
    <div class="row g-4 mb-4">
      
      <!-- Puan Kartı -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100 border-bottom border-warning border-4 transition-all">
          <div class="card-body d-flex flex-column justify-content-center text-center p-4">
            <div class="display-5 mb-2">🏆</div>
            <h5 class="fw-bold text-muted mb-1">Mevcut Puanın</h5>
            <h2 class="fw-bolder text-warning mb-0">{{ auth.user?.points || 0 }} <span class="fs-6 text-muted">TP</span></h2>
          </div>
        </div>
      </div>

      <!-- Rol Kartı -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100 border-bottom border-success border-4 transition-all">
          <div class="card-body d-flex flex-column justify-content-center text-center p-4">
            <div class="display-5 mb-2">🎓</div>
            <h5 class="fw-bold text-muted mb-1">Sistemdeki Rolün</h5>
            <h3 class="fw-bolder text-success text-uppercase tracking-widest mb-0">
              {{ auth.user?.role === 'manager' ? 'Yönetici' : 'Çalışan' }}
            </h3>
          </div>
        </div>
      </div>

      <!-- Uzmanlık Kartı -->
      <div class="col-md-4">
        <div class="card border-0 shadow-sm h-100 border-bottom border-info border-4 transition-all">
          <div class="card-body d-flex flex-column justify-content-center text-center p-4">
            <div class="display-5 mb-2">💡</div>
            <h5 class="fw-bold text-muted mb-1">Ana Uzmanlığın</h5>
            <h3 class="fw-bolder text-info mb-0">{{ auth.user?.mainSkill || 'Belirtilmedi' }}</h3>
          </div>
        </div>
      </div>

    </div>

  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
</script>

<style scoped>
.transition-all {
  transition: transform 0.2s ease-in-out;
}
.transition-all:hover {
  transform: translateY(-5px);
}
.tracking-widest {
  letter-spacing: 0.1em;
}
</style>