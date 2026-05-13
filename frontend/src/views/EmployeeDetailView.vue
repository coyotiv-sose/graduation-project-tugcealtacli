
<template>
  <div class="p-8 bg-slate-50 min-h-screen">
    <div class="max-w-5xl mx-auto space-y-6" v-if="employee">
      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h1 class="text-3xl font-black text-slate-900">{{ employee.name }}</h1>
        <p class="text-slate-500 mt-2">
          Ana yetkinlik: {{ employee.mainSkill }} · Seviye {{ employee.skillLevel }}
        </p>

        <div class="mt-4 flex gap-4 flex-wrap">
          <div class="bg-blue-50 text-blue-700 px-4 py-2 rounded-xl font-bold">
            {{ employee.points }} puan
          </div>
          <div class="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold">
            {{ employee.activeTaskCount }} aktif görev
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-xl font-black text-slate-800 mb-4">Yetkinlikler</h2>

        <div class="flex gap-3 flex-wrap">
          <div
            v-for="skill in employee.skills"
            :key="skill.name"
            class="bg-slate-100 px-4 py-2 rounded-xl text-slate-700 font-semibold"
          >
            {{ skill.name }} · Lvl {{ skill.level }}
          </div>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-xl font-black text-slate-800 mb-4">Aktif / Geçmiş Görevler</h2>

        <div v-if="employee.tasks.length === 0" class="text-slate-400">
          Görev bulunmuyor.
        </div>

        <div v-else class="space-y-3">
          <router-link
            v-for="task in employee.tasks"
            :key="task.id || task.title"
            :to="task.id ? `/tasks/${task.id}` : '#'"
            class="block border border-slate-100 rounded-xl p-4 hover:bg-slate-50"
          >
            <p class="font-bold text-slate-800">{{ task.title }}</p>
            <p class="text-sm text-slate-500">{{ task.status || 'durum yok' }}</p>
          </router-link>
        </div>
      </div>

      <div class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h2 class="text-xl font-black text-slate-800 mb-4">Son Puan Hareketleri</h2>

        <div v-if="employee.recentTransactions.length === 0" class="text-slate-400">
          Puan hareketi yok.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="tx in employee.recentTransactions"
            :key="tx.id"
            class="border border-slate-100 rounded-xl p-4"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-bold text-slate-800">{{ tx.description }}</p>
                <p v-if="tx.task" class="text-sm text-slate-500">Görev: {{ tx.task.title }}</p>
              </div>
              <div class="text-right">
                <p class="font-black text-emerald-600">+{{ tx.points }}</p>
                <p class="text-xs text-slate-400">{{ formatDate(tx.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="text-center text-slate-400 py-20">
      Çalışan bilgisi yükleniyor...
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../services/api'

const route = useRoute()
const employee = ref(null)

const fetchEmployee = async () => {
  try {
    const res = await api.get(`/employees/${route.params.id}`)
    employee.value = res.data
  } catch (error) {
    console.error(error)
  }
}

const formatDate = value => {
  if (!value) return '-'
  return new Date(value).toLocaleString('tr-TR')
}

onMounted(fetchEmployee)
</script>