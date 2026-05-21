<template>
  <div class="container py-4">
    
    <header class="d-flex justify-content-between align-items-center mb-5 pb-3 border-bottom">
      <div>
        <h1 class="fw-bolder text-dark mb-1">Görev Merkezi</h1>
        <p class="text-muted fst-italic mb-0">"Yetenek ve yardımlaşma odaklı otonom yönetim."</p>
      </div>

      <div class="d-flex align-items-center gap-3">
        <div v-if="auth.user" class="text-end d-none d-md-block">
          <p class="small text-muted fw-bold text-uppercase mb-0" style="font-size: 0.7rem;">Aktif Kullanıcı</p>
          <p class="fw-bolder text-dark mb-0">{{ auth.user.name }}</p>
        </div>

        <div class="card border-0 shadow-sm text-center px-4 py-2">
          <p class="small fw-bold text-muted text-uppercase mb-0" style="font-size: 0.7rem;">Geciken</p>
          <p class="fs-4 fw-bolder text-danger mb-0">{{ overdueCount }}</p>
        </div>

        <button 
          v-if="auth.user?.role === 'manager'" 
          @click="fetchAIReport" 
          class="btn btn-dark shadow-sm fw-bold d-flex align-items-center gap-2 h-100"
        >
          <span>📊</span>
          <span class="d-none d-md-inline">AI Raporu</span>
        </button>
      </div>
    </header>

    <section v-if="auth.user?.role === 'manager'" class="card border-0 shadow-sm mb-5">
      <div class="card-body p-4">
        <div class="d-flex justify-content-between align-items-center mb-4 border-start border-primary border-4 ps-2">
          <h5 class="card-title fw-bold text-dark mb-0">Yeni Görev Ataması</h5>
        </div>
        
        <form @submit.prevent="addTask" class="row g-3 align-items-center">
          <div class="col-md-2">
            <select v-model="selectedEmployeeName" class="form-select bg-light" required>
              <option disabled value="">Çalışan Seç</option>
              <option v-for="emp in employees" :key="emp.id" :value="emp.name">
                {{ emp.name }}
              </option>
            </select>
          </div>

          <div class="col-md-3">
            <div class="input-group shadow-sm">
              <input v-model="newTask.title" type="text" class="form-control bg-light border-end-0" placeholder="Görev başlığı" required />
              <button 
                @click="generateDescriptionWithAI" 
                type="button" 
                class="btn btn-warning fw-bold border" 
                :disabled="!newTask.title || isGeneratingAI"
              >
                <span v-if="isGeneratingAI" class="spinner-border spinner-border-sm text-dark" role="status" aria-hidden="true"></span>
                <span v-else>✨ AI</span>
              </button>
            </div>
          </div>

          <div class="col-md-2">
            <input v-model="newTask.requiredSkill" type="text" class="form-control bg-light" placeholder="Yetenek (Örn: React)" required />
          </div>

          <div class="col-md-1">
            <input v-model="newTask.difficulty" type="number" min="1" max="5" class="form-control bg-light" placeholder="Zor" required />
          </div>

          <div class="col-md-2">
            <input v-model="newTask.dueAt" type="datetime-local" class="form-control bg-light" required />
          </div>

          <div class="col-md-2">
            <button type="submit" class="btn btn-primary fw-bold w-100 shadow-sm">
              Görevi Ata
            </button>
          </div>
        </form>
      </div>
    </section>

    <div class="d-flex flex-column gap-3">
      <div 
        v-for="task in tasks" 
        :key="task.id || task._id" 
        :class="['card shadow-sm transition-all', task.overdue ? 'border-danger bg-danger bg-opacity-10' : 'border-light']"
      >
        <div class="card-body p-4">
          <div class="row align-items-center">
            
            <div class="col-md-7 mb-3 mb-md-0">
              <div class="d-flex align-items-center gap-2 mb-2">
                <h4 class="fw-bold text-dark mb-0">{{ task.title }}</h4>
                <span :class="statusBadgeClass(task.status)">{{ formatStatus(task.status) }}</span>
                <span v-if="task.overdue" class="badge bg-danger border border-danger">GECİKMİŞ</span>
              </div>

              <div class="d-flex flex-wrap gap-2 small text-muted mb-2">
                <span class="badge bg-white text-dark border">🛠 {{ task.requiredSkill }}</span>
                <span class="badge bg-white text-dark border">⭐ Zorluk: {{ task.difficulty }}/5</span>
                <span v-if="task.dueAt" class="badge bg-white text-dark border">📅 Teslim: {{ new Date(task.dueAt).toLocaleString() }}</span>
              </div>

              <div v-if="task.assignees && task.assignees.length" class="small mt-2">
                <span class="fw-bold text-dark">Sorumlu:</span> 
                {{ task.assignees.map(a => a.name).join(', ') }}
              </div>

              <div v-if="task.helper" class="small mt-1 text-primary fw-bold">
                🤝 Destek: {{ task.helper.name }}
              </div>
            </div>

            <div class="col-md-5 text-md-end">
              
              <div v-if="task.status === 'open' && isOwner(task)">
                <div class="d-flex justify-content-md-end gap-2 mb-2">
                  <button @click="completeTask(task.id || task._id)" class="btn btn-success fw-bold btn-sm shadow-sm">
                    ✅ Tamamla
                  </button>
                  <button v-if="!task.overdue" @click="openHelpModal(task)" class="btn btn-outline-primary fw-bold btn-sm shadow-sm">
                    🤝 Yardım İste
                  </button>
                </div>
                
                <div v-if="task.overdue" class="p-2 bg-white border border-warning rounded text-center shadow-sm mt-2">
                  <p class="small fw-bold text-dark mb-2">⚠️ Süre aşıldı! AI yardım öneriyor.</p>
                  <button @click="openHelpModal(task)" class="btn btn-warning btn-sm fw-bold shadow-sm w-100">
                    ✨ Uygun Kişileri Bul
                  </button>
                </div>
              </div>

              <div v-if="task.status === 'pending_approval' && auth.user?.role === 'manager'" class="d-flex justify-content-md-end gap-2">
                <button @click="approveTask(task.id || task._id)" class="btn btn-success fw-bold btn-sm shadow-sm">
                  Onayla
                </button>
                <button @click="rejectTask(task.id || task._id)" class="btn btn-danger fw-bold btn-sm shadow-sm">
                  Reddet
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
      
      <div v-if="tasks.length === 0" class="text-center py-5 text-muted">
        <h5 class="fw-bold">Şu an sistemde hiç görev yok.</h5>
        <p>Rahatlayabilirsiniz veya yeni görevler atayabilirsiniz.</p>
      </div>
    </div>

    <div v-if="helpModalOpen" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-lg modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          
          <div class="modal-header border-bottom-0 pb-0">
            <div>
              <h4 class="modal-title fw-bolder text-dark">Yardım Önerileri</h4>
              <p class="text-muted small mb-0">Görev: <span class="fw-bold">{{ selectedTaskForHelp?.title }}</span></p>
            </div>
            <button type="button" class="btn-close" @click="closeHelpModal"></button>
          </div>
          
          <div class="modal-body py-4">
            <div v-if="helpLoading" class="text-center py-5 text-muted fw-bold">
              <div class="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
              Yapay Zeka uygun adayları analiz ediyor...
            </div>

            <div v-else-if="helpCandidates.length === 0" class="text-center py-5 text-muted fw-bold">
              Şu an bu görev için yetkinliği uygun olan boşta bir çalışan bulunamadı.
            </div>

            <div v-else class="d-flex flex-column gap-3">
              <div 
                v-for="helper in helpCandidates" 
                :key="helper.id" 
                class="card border-light shadow-sm"
              >
                <div class="card-body d-flex justify-content-between align-items-center">
                  <div>
                    <h5 class="fw-bold text-dark mb-1">{{ helper.name }}</h5>
                    <p class="small text-muted mb-1">
                      {{ helper.mainSkill }} | Seviye {{ helper.skillLevel }} | Aktif Görevi: {{ helper.activeTaskCount }}
                    </p>
                    <p class="small text-primary fw-bold mb-2">
                      Uygunluk Skoru: {{ helper.totalScore ?? helper.score ?? '-' }}
                    </p>
                    <ul class="mb-0 small text-muted">
                      <li v-for="(item, index) in helper.reason" :key="index">{{ item }}</li>
                    </ul>
                  </div>
                  <button @click="acceptHelp(helper.id)" class="btn btn-primary fw-bold btn-sm px-3 shadow-sm">
                    Yardım Çağrısı Gönder
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div class="modal-footer border-top-0 pt-0">
            <button type="button" class="btn btn-light fw-bold" @click="closeHelpModal">Kapat</button>
          </div>
          
        </div>
      </div>
    </div>

    <div v-if="reportModalOpen" class="modal d-block" tabindex="-1" style="background-color: rgba(0,0,0,0.5);">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg">
          <div class="modal-header border-bottom-0 pb-0">
            <h5 class="modal-title fw-bolder text-dark">📊 Sistem Durum Raporu</h5>
            <button type="button" class="btn-close" @click="reportModalOpen = false"></button>
          </div>
          <div class="modal-body py-4">
            <div v-if="isGeneratingReport" class="text-center py-4">
              <div class="spinner-border text-primary mb-3" role="status"></div>
              <p class="text-muted fw-bold">Yapay zeka veritabanını analiz ediyor...</p>
            </div>
            <div v-else>
              <div class="p-3 bg-light rounded border border-secondary text-dark fst-italic lh-lg">
                "{{ aiReportText }}"
              </div>
            </div>
          </div>
          <div class="modal-footer border-top-0 pt-0">
            <button type="button" class="btn btn-primary fw-bold w-100" @click="reportModalOpen = false">Anlaşıldı</button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'
import { useAuthStore } from '../stores/auth'
import { useTaskStore } from '../stores/tasks'

const auth = useAuthStore()
const taskStore = useTaskStore()

// State Değişkenleri
const employees = ref([])
const newTask = ref({ title: '', requiredSkill: '', difficulty: '', dueAt: '' })
const selectedEmployeeName = ref('')
const isGeneratingAI = ref(false)

// Yardım Modalı Değişkenleri
const helpModalOpen = ref(false)
const selectedTaskForHelp = ref(null)
const helpCandidates = ref([])
const helpLoading = ref(false)

// AI Rapor Modalı Değişkenleri
const reportModalOpen = ref(false)
const isGeneratingReport = ref(false)
const aiReportText = ref('')

const tasks = computed(() => taskStore.tasks)
const overdueCount = computed(() => taskStore.overdueCount)

// GÜÇLENDİRİLDİ: Artık isimden değil, benzersiz ID'den kontrol ediyor
const isOwner = (task) => {
  if (!auth.user) return false;
  const userId = auth.user.id;
  const isAssignee = task.assignees?.some(a => a.id === userId);
  const isHelper = task.helper?.id === userId;
  return isAssignee || isHelper;
}

const fetchEmployees = async () => {
  try {
    const response = await api.get('/employees')
    // Yönetici kendisine görev atayamasın diye sadece çalışanları listele
    employees.value = response.data.filter(emp => emp.role !== 'manager')
  } catch (e) {
    console.error(e)
  }
}

const formatStatus = (status) => {
  const map = {
    'open': 'Devam Ediyor',
    'pending_approval': 'Onay Bekliyor',
    'completed': 'Tamamlandı',
    'rejected': 'Reddedildi'
  }
  return map[status] || status
}

const statusBadgeClass = status => {
  const base = 'badge border text-uppercase '
  if (status === 'completed') return base + 'bg-success text-white border-success'
  if (status === 'pending_approval') return base + 'bg-warning text-dark border-warning'
  if (status === 'rejected') return base + 'bg-danger text-white border-danger'
  return base + 'bg-light text-secondary border-secondary'
}

const generateDescriptionWithAI = async () => {
  if (!newTask.value.title) return;
  isGeneratingAI.value = true;
  try {
    const response = await api.post('/tasks/generate-description', { title: newTask.value.title });
    newTask.value.title = response.data.description;
  } catch (error) {
    console.error('AI açıklaması oluşturulamadı.');
  } finally {
    isGeneratingAI.value = false;
  }
}

// YENİ: Yöneticinin Genel Rapor Alması İçin
const fetchAIReport = async () => {
  reportModalOpen.value = true
  isGeneratingReport.value = true
  aiReportText.value = ''
  try {
    const response = await api.get('/tasks/ai-report/general')
    aiReportText.value = response.data.report
  } catch (error) {
    aiReportText.value = 'Rapor oluşturulurken bir bağlantı hatası meydana geldi.'
  } finally {
    isGeneratingReport.value = false
  }
}

const addTask = async () => {
  try {
    await api.post(`/employees/${selectedEmployeeName.value}/tasks`, newTask.value)
    newTask.value = { title: '', requiredSkill: '', difficulty: '', dueAt: '' }
    selectedEmployeeName.value = ''
    await taskStore.fetchTasks()
    await fetchEmployees()
  } catch (error) {
    console.error('Görev atama hatası:', error)
  }
}

const completeTask = async id => {
  try {
    await api.patch(`/tasks/${id}/complete`, {})
    await taskStore.fetchTasks()
    await auth.restoreSession()
  } catch (error) {
    console.error('Tamamlama başarısız:', error)
  }
}

const approveTask = async id => {
  if (!auth.user) return
  try {
    await api.patch(`/tasks/${id}/approve`, { approverName: auth.user.name })
    await taskStore.fetchTasks()
    await auth.restoreSession()
  } catch (error) {
    console.error('Onaylama başarısız:', error)
  }
}

const rejectTask = async id => {
  if (!auth.user) return
  const reason = prompt('Reddetme nedenini kısaca yazın (Çalışana bildirilecek):')
  if (!reason) return;
  try {
    await api.patch(`/tasks/${id}/reject`, { approverName: auth.user.name, reason })
    await taskStore.fetchTasks()
    await auth.restoreSession()
  } catch (error) {
    console.error('Reddetme başarısız:', error)
  }
}

const openHelpModal = async task => {
  selectedTaskForHelp.value = task
  helpModalOpen.value = true
  helpLoading.value = true
  try {
    const res = await api.post(`/tasks/${task.id || task._id}/request-help`)
    helpCandidates.value = res.data.recommendedHelpers || []
  } catch (error) {
    console.error('Yardım önerileri alınamadı.')
    closeHelpModal()
  } finally {
    helpLoading.value = false
  }
}

const acceptHelp = async helperId => {
  try {
    await api.post(`/tasks/${selectedTaskForHelp.value.id || selectedTaskForHelp.value._id}/accept-help`, { helperId })
    closeHelpModal()
    await taskStore.fetchTasks()
    await auth.restoreSession()
  } catch (error) {
    console.error('Yardım ataması yapılamadı.')
  }
}

const closeHelpModal = () => {
  helpModalOpen.value = false
  selectedTaskForHelp.value = null
  helpCandidates.value = []
}

onMounted(async () => {
  await auth.restoreSession()
  await taskStore.fetchTasks()
  await fetchEmployees()
})
</script>

<style scoped>
.transition-all {
  transition: all 0.2s ease-in-out;
}
.transition-all:hover {
  transform: translateY(-2px);
  box-shadow: 0 .5rem 1rem rgba(0,0,0,.15)!important;
}
</style>