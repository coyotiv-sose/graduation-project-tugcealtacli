<template>
  <div class="p-8 bg-slate-50 min-h-screen">
    <div class="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 class="text-3xl font-black text-slate-900">Raporlar</h1>
        <p class="text-slate-500 mt-2">Sistem içindeki puan ve görev hareketlerinin özeti</p>
      </div>

      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 class="text-xl font-black text-slate-800 mb-4">Son Puan Hareketleri</h2>

          <div v-if="transactions.length === 0" class="text-slate-400 text-sm">
            Henüz puan hareketi yok.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in transactions"
              :key="item.id"
              class="border border-slate-100 rounded-xl p-4"
            >
              <div class="flex justify-between items-start gap-4">
                <div>
                  <p class="font-bold text-slate-800">
                    {{ item.employee?.name || 'Bilinmeyen çalışan' }}
                  </p>
                  <p class="text-sm text-slate-500">{{ item.description }}</p>
                  <p v-if="item.task" class="text-xs text-slate-400 mt-1">
                    Görev: {{ item.task.title }}
                  </p>
                </div>

                <div class="text-right">
                  <p class="font-black text-emerald-600">+{{ item.points }}</p>
                  <p class="text-xs text-slate-400">{{ formatDate(item.createdAt) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 class="text-xl font-black text-slate-800 mb-4">Son Görev Aktiviteleri</h2>

          <div v-if="activities.length === 0" class="text-slate-400 text-sm">
            Henüz görev aktivitesi yok.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="item in activities"
              :key="item.id"
              class="border border-slate-100 rounded-xl p-4"
            >
              <div class="flex justify-between items-start gap-4">
                <div>
                  <p class="font-bold text-slate-800">
                    {{ item.task?.title || 'Bilinmeyen görev' }}
                  </p>
                  <p class="text-sm text-slate-500">
                    {{ activityLabel(item) }}
                  </p>
                  <p v-if="item.actor" class="text-xs text-slate-400 mt-1">
                    Aktör: {{ item.actor.name }}
                  </p>
                </div>

                <p class="text-xs text-slate-400 whitespace-nowrap">
                  {{ formatDate(item.createdAt) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../services/api'

const transactions = ref([])
const activities = ref([])

const fetchTransactions = async () => {
  try {
    const res = await api.get('/point-transactions')
    transactions.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const fetchActivities = async () => {
  try {
    const res = await api.get('/task-activities')
    activities.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const formatDate = value => {
  if (!value) return '-'
  return new Date(value).toLocaleString('tr-TR')
}

const activityLabel = item => {
  const actionMap = {
    created: 'Görev oluşturuldu',
    assigned: 'Görev atandı',
    help_given: 'Yardım verildi',
    completion_requested: 'Tamamlama talebi gönderildi',
    approved: 'Görev onaylandı',
    rejected: 'Görev reddedildi',
  }

  return actionMap[item.action] || item.action
}

onMounted(async () => {
  await fetchTransactions()
  await fetchActivities()
})
</script>