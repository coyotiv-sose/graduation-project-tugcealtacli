<template>
  <div class="p-8 bg-slate-50 min-h-screen">
    <div class="max-w-5xl mx-auto space-y-6" v-if="task">
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h1 class="text-3xl font-black text-slate-900">{{ task.title }}</h1>
        <p class="text-slate-500 mt-2">
          {{ task.requiredSkill }} · Zorluk {{ task.difficulty }}/5
        </p>

        <div class="mt-4 flex gap-3 flex-wrap">
          <div class="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">
            Durum: {{ task.status }}
          </div>

          <div v-if="task.overdue" class="bg-red-100 text-red-700 px-4 py-2 rounded-xl font-bold">
            Gecikmiş
          </div>
        </div>

        <div class="mt-4 text-sm text-slate-600">
          <p>
            <span class="font-bold">Atananlar:</span>
            {{ task.assignees?.map(a => a.name).join(', ') || '-' }}
          </p>

          <p class="mt-2">
            <span class="font-bold">Destek:</span>
            {{ task.helper?.name || 'Yok' }}
          </p>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-xl font-black text-slate-800 mb-4">Aktivite Geçmişi</h2>

        <div v-if="task.activities.length === 0" class="text-slate-400">
          Aktivite kaydı yok.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="item in task.activities"
            :key="item.id"
            class="border border-slate-100 rounded-xl p-4"
          >
            <div class="flex justify-between items-start gap-4">
              <div>
                <p class="font-bold text-slate-800">{{ activityLabel(item.action) }}</p>
                <p v-if="item.actor" class="text-sm text-slate-500 mt-1">
                  Aktör: {{ item.actor.name }}
                </p>
                <pre class="text-xs text-slate-400 mt-2 whitespace-pre-wrap">{{ item.meta }}</pre>
              </div>

              <p class="text-xs text-slate-400 whitespace-nowrap">
                {{ formatDate(item.createdAt) }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-slate-400 py-20">
      Görev bilgisi yükleniyor...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const task = ref(null)

const fetchTask = async () => {
  try {
    const res = await api.get(`/tasks/${route.params.id}`)
    task.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const formatDate = value => {
  if (!value) return '-'
  return new Date(value).toLocaleString('tr-TR')
}

const activityLabel = action => {
  const actionMap = {
    created: 'Görev oluşturuldu',
    assigned: 'Görev atandı',
    help_given: 'Yardım verildi',
    completion_requested: 'Tamamlama talebi gönderildi',
    approved: 'Görev onaylandı',
    rejected: 'Görev reddedildi',
  }

  return actionMap[action] || action
}

onMounted(fetchTask)
</script>