import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import api from '../services/api' // Backend ile iletişim için

export const useTaskStore = defineStore('tasks', () => {

  const tasks = ref([])
  const isLoading = ref(false)
 
  const openTasks = computed(() => tasks.value.filter(t => t.status === 'open'))
  const pendingTasks = computed(() => tasks.value.filter(t => t.status === 'pending_approval'))
  const completedTasks = computed(() => tasks.value.filter(t => t.status === 'completed'))
  const overdueCount = computed(() => tasks.value.filter(t => t.overdue).length)

  const fetchTasks = async () => {
    isLoading.value = true
    try {
      const response = await api.get('/tasks')
      tasks.value = response.data // Backend state'i, Frontend state'e eşitliyoruz
    } catch (error) {
      console.error('Görevler çekilemedi:', error)
    } finally {
      isLoading.value = false
    }
  }

  return { 
    tasks, 
    isLoading, 
    openTasks, 
    pendingTasks, 
    completedTasks, 
    overdueCount, 
    fetchTasks 
  }
})