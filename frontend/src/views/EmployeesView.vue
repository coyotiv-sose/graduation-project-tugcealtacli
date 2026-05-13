<template>
  <div class="container py-4">
    <header class="mb-5 pb-3 border-bottom">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <h1 class="fw-bolder text-dark mb-1 d-flex align-items-center gap-2">
            <span>👥</span> Çalışan Dizini
          </h1>
          <p class="text-muted fst-italic mb-0">Sistemdeki tüm çalışanların listesi ve yetkinlikleri.</p>
        </div>
        <div class="badge bg-primary fs-6 py-2 px-3 shadow-sm">
          Toplam: {{ employees.length }} Kişi
        </div>
      </div>
    </header>

    <div class="row g-4">
      <div v-for="emp in employees" :key="emp.id" class="col-12 col-md-6 col-lg-4">
        <div class="card border-0 shadow-sm h-100 transition-all">
          <div class="card-body p-4 text-center">
            
            <div class="d-inline-flex align-items-center justify-content-center bg-light text-primary rounded-circle mb-3 shadow-sm" style="width: 70px; height: 70px; font-size: 24px;">
              {{ emp.role === 'manager' ? '👑' : '👨‍💻' }}
            </div>
            
            <h4 class="fw-bold text-dark mb-1">{{ emp.name }}</h4>
            <p class="small text-muted text-uppercase fw-bold tracking-widest mb-3">
              {{ emp.role === 'manager' ? 'Yönetici' : 'Çalışan' }}
            </p>

            <div class="d-flex justify-content-center gap-2 mb-3">
              <span class="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2">
                {{ emp.mainSkill || 'Belirtilmedi' }}
              </span>
              <span class="badge bg-light text-dark border px-3 py-2">
                Lvl {{ emp.skillLevel || 1 }}
              </span>
            </div>

          </div>
          <div class="card-footer bg-transparent border-top text-center py-3">
            <span class="fw-bolder text-warning fs-5">{{ emp.points || 0 }} <span class="fs-6 text-muted">TP</span></span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const employees = ref([])

const fetchEmployees = async () => {
  try {
    const res = await api.get('/employees')
    employees.value = res.data
  } catch (error) {
    console.error('Çalışan listesi alınamadı:', error)
  }
}

onMounted(() => {
  fetchEmployees()
})
</script>

<style scoped>
.transition-all {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.transition-all:hover {
  transform: translateY(-5px);
  box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
}
.tracking-widest {
  letter-spacing: 0.1em;
}
</style>