<template>
  <div class="container-fluid py-4">
    <header class="mb-4 pb-3 border-bottom px-2">
      <h1 class="fw-bolder text-dark mb-1 d-flex align-items-center gap-2">
        <span>📌</span> Kanban Tablosu
      </h1>
      <p class="text-muted fst-italic mb-0">Tüm görevlerin anlık durum takibi.</p>
    </header>

    <!-- Yükleniyor Durumu -->
    <div v-if="taskStore.isLoading" class="text-center py-5 text-muted fw-bold">
      <div class="spinner-border text-primary mb-2" role="status"></div>
      <p>Görevler getiriliyor...</p>
    </div>

    <div v-else class="row g-4">
      
      <!-- Yapılacaklar (Açık) Sütunu -->
      <div class="col-12 col-md-4">
        <div class="card border-0 bg-light shadow-sm h-100">
          <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2">
            <h5 class="fw-bold text-dark mb-0 d-flex justify-content-between align-items-center">
              Yapılacaklar
              <span class="badge bg-secondary rounded-pill">{{ openTasks.length }}</span>
            </h5>
          </div>
          <div class="card-body d-flex flex-column gap-3">
            <div v-for="task in openTasks" :key="task.id" class="card border-0 shadow-sm border-start border-primary border-4">
              <div class="card-body p-3">
                <h6 class="fw-bold mb-2">{{ task.title }}</h6>
                <div class="d-flex justify-content-between align-items-center small">
                  <span class="badge bg-primary bg-opacity-10 text-primary border border-primary">🛠 {{ task.requiredSkill }}</span>
                  <span v-if="task.overdue" class="text-danger fw-bold">Gecikti</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Onay Bekleyenler Sütunu -->
      <div class="col-12 col-md-4">
        <div class="card border-0 bg-light shadow-sm h-100">
          <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2">
            <h5 class="fw-bold text-dark mb-0 d-flex justify-content-between align-items-center">
              Onay Bekleyenler
              <span class="badge bg-secondary rounded-pill">{{ pendingTasks.length }}</span>
            </h5>
          </div>
          <div class="card-body d-flex flex-column gap-3">
            <div v-for="task in pendingTasks" :key="task.id" class="card border-0 shadow-sm border-start border-warning border-4">
              <div class="card-body p-3">
                <h6 class="fw-bold mb-2">{{ task.title }}</h6>
                <div class="d-flex justify-content-between align-items-center small">
                  <span class="text-muted fw-bold">⏳ İncelemede</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tamamlananlar Sütunu -->
      <div class="col-12 col-md-4">
        <div class="card border-0 bg-light shadow-sm h-100">
          <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2">
            <h5 class="fw-bold text-dark mb-0 d-flex justify-content-between align-items-center">
              Bitenler
              <span class="badge bg-secondary rounded-pill">{{ completedTasks.length }}</span>
            </h5>
          </div>
          <div class="card-body d-flex flex-column gap-3">
            <div v-for="task in completedTasks" :key="task.id" class="card border-0 shadow-sm border-start border-success border-4 opacity-75">
              <div class="card-body p-3">
                <h6 class="fw-bold text-decoration-line-through mb-2">{{ task.title }}</h6>
                <div class="d-flex justify-content-between align-items-center small">
                  <span class="text-success fw-bold">✅ Onaylandı</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useTaskStore } from '../stores/tasks' // PİNİA AÇIK BÜFESİNİ ÇAĞIRDIK

const taskStore = useTaskStore()

// Verileri doğrudan Pinia içindeki Getter'lardan alıyoruz!
const openTasks = computed(() => taskStore.openTasks)
const pendingTasks = computed(() => taskStore.pendingTasks)
const completedTasks = computed(() => taskStore.completedTasks)

onMounted(() => {
  // Sayfa açıldığında Pinia'ya "Git yeni veri var mı kontrol et ve büfeyi tazele" diyoruz
  taskStore.fetchTasks()
})
</script>