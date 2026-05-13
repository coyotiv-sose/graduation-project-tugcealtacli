<template>
  <div class="container py-4">
    <header class="mb-4 pb-3 border-bottom">
      <h1 class="fw-bolder text-dark mb-1 d-flex align-items-center gap-2">
        <span>🏆</span> Liderlik Tablosu
      </h1>
      <p class="text-muted fst-italic mb-0">En çok puan toplayıp ekibe en çok destek veren kahramanlarımız.</p>
    </header>

    <div class="card border-0 shadow-sm overflow-hidden">
      <div class="card-body p-0">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light text-muted small text-uppercase">
            <tr>
              <th class="ps-4 py-3">Sıra</th>
              <th class="py-3">Çalışan</th>
              <th class="py-3">Uzmanlık & Seviye</th>
              <th class="py-3 text-end pe-4">Toplam Puan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(emp, index) in sortedEmployees" :key="emp.id" :class="{'table-warning': index === 0}">
              <td class="ps-4 fw-bolder text-muted fs-5">#{{ index + 1 }}</td>
              <td class="fw-bold text-dark">
                {{ emp.name }}
                <span v-if="index === 0" class="badge bg-warning text-dark ms-2">Lider</span>
              </td>
              <td>
                <span class="badge bg-info text-dark shadow-sm">{{ emp.mainSkill }}</span>
                <span class="text-muted small ms-2 fw-bold">Seviye {{ emp.skillLevel }}</span>
              </td>
              <td class="text-end pe-4 fw-bolder text-warning fs-5">
                {{ emp.points || 0 }} <span class="fs-6 text-muted">TP</span>
              </td>
            </tr>
            <tr v-if="sortedEmployees.length === 0">
              <td colspan="4" class="text-center py-4 text-muted fw-bold">Henüz çalışan bulunmuyor.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '../services/api'

const employees = ref([])

const sortedEmployees = computed(() => {
  // Çalışanları puanlarına göre (büyükten küçüğe) sıralar
  return [...employees.value].sort((a, b) => (b.points || 0) - (a.points || 0))
})

const fetchEmployees = async () => {
  try {
    const res = await api.get('/employees')
    // Yöneticileri liderlik tablosundan gizlemek istersen filter ekleyebilirsin
    employees.value = res.data.filter(emp => emp.role !== 'manager')
  } catch (error) {
    console.error('Çalışanlar alınamadı:', error)
  }
}

onMounted(() => {
  fetchEmployees()
})
</script>