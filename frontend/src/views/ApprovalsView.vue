<template>
  <div class="container py-4">
    <!-- Üst Başlık -->
    <header class="mb-5 pb-3 border-bottom">
      <h1 class="fw-bolder text-dark mb-2 d-flex align-items-center gap-2">
        <span class="text-warning">⏳</span> Bekleyen Onaylar
      </h1>
      <p class="text-muted fst-italic mb-0">
        Çalışanların tamamladığı görevleri buradan inceleyip onaylayabilir veya eksiklik varsa reddedebilirsiniz.
      </p>
    </header>

    <!-- Yükleniyor Durumu -->
    <div v-if="loading" class="text-center py-5 text-muted fw-bold">
      <div class="spinner-border text-primary mb-2" role="status"></div>
      <p>Görevler yükleniyor...</p>
    </div>

    <!-- Boş Durum (Bekleyen onay yoksa) -->
    <div v-else-if="pendingTasks.length === 0" class="card border-0 shadow-sm text-center py-5">
      <div class="card-body">
        <div class="display-4 mb-3">🎉</div>
        <h3 class="fw-bold text-dark">Harika! Bekleyen onay yok.</h3>
        <p class="text-muted mb-0">Tüm çalışanların görevleri incelenmiş durumda.</p>
      </div>
    </div>

    <!-- Onay Bekleyen Görevler Listesi -->
    <div v-else class="d-flex flex-column gap-4">
      <div 
        v-for="task in pendingTasks" 
        :key="task.id" 
        class="card border-warning shadow-sm transition-all"
      >
        <div class="card-body p-4">
          <div class="row align-items-center">
            
            <!-- Görev Detayları -->
            <div class="col-md-8 mb-4 mb-md-0">
              <h4 class="fw-bold text-dark mb-3">{{ task.title }}</h4>
              
              <div class="d-flex flex-wrap gap-2 mb-3">
                <span class="badge bg-light text-dark border p-2">🛠 {{ task.requiredSkill }}</span>
                <span class="badge bg-light text-dark border p-2">⭐ Zorluk: {{ task.difficulty }}/5</span>
              </div>

              <div class="small text-muted mb-1">
                <span class="fw-bold text-dark">Tamamlayan Çalışan:</span> 
                {{ task.assignees && task.assignees.length > 0 ? task.assignees.map(a => a.name).join(', ') : 'Bilinmiyor' }}
              </div>
              
              <div v-if="task.helper" class="small text-primary fw-bold mt-2">
                🤝 Destek Veren: {{ task.helper.name }}
              </div>
            </div>

            <!-- Aksiyon Butonları -->
            <div class="col-md-4 text-md-end d-flex flex-column flex-md-row justify-content-md-end gap-2">
              <button 
                @click="approveTask(task.id)"
                class="btn btn-success fw-bold px-4 py-2 shadow-sm"
              >
                ✅ Onayla
              </button>
              <button 
                @click="rejectTask(task.id)"
                class="btn btn-outline-danger fw-bold px-4 py-2 shadow-sm"
              >
                ❌ Reddet
              </button>
            </div>
            
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const pendingTasks = ref([])
const loading = ref(true)

const fetchPendingTasks = async () => {
  loading.value = true
  try {
    const res = await api.get('/tasks')
    // Sadece onay bekleyen (pending_approval) görevleri filtrele
    pendingTasks.value = res.data.filter(task => task.status === 'pending_approval' || task.pendingApproval === true)
  } catch (error) {
    console.error('Görevler çekilemedi', error)
  } finally {
    loading.value = false
  }
}

const approveTask = async (taskId) => {
  try {
    await api.patch(`/tasks/${taskId}/approve`, { approverName: auth.user.name })
    alert('Görev başarıyla onaylandı! Çalışana puanı eklendi.')
    await fetchPendingTasks() // Listeyi yenile
  } catch (error) {
    alert(error.response?.data?.error || 'Onaylama işlemi başarısız oldu.')
  }
}

const rejectTask = async (taskId) => {
  const reason = prompt('Reddetme sebebini yazınız (Çalışan bunu görecektir):')
  if (reason === null) return // İptale basarsa işlemi durdur

  try {
    await api.patch(`/tasks/${taskId}/reject`, { 
      approverName: auth.user.name,
      reason: reason
    })
    alert('Görev reddedildi ve çalışana geri gönderildi.')
    await fetchPendingTasks() // Listeyi yenile
  } catch (error) {
    alert(error.response?.data?.error || 'Reddetme işlemi başarısız oldu.')
  }
}

onMounted(() => {
  fetchPendingTasks()
})
</script>

<style scoped>
/* Kartlara gelince Bootstrap'e uygun hafif yukarı kalkma efekti */
.transition-all {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}
.transition-all:hover {
  transform: translateY(-3px);
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}
</style>