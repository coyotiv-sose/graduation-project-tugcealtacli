const axios = require('axios') // axios kütüphanesini ekledik (npm install axios)
const baseURL = 'http://localhost:3000'

async function main() {
  try {
    console.log('🤖 TUVIA OTONOM ASİSTAN: Çalışanlar sisteme ekleniyor...')
    const canan = await axios.post(`${baseURL}/employees`, { name: 'Canan', mainSkill: 'JS', skillLevel: 5 })
    console.log('✅ Çalışan eklendi:', canan.data.name)
    const mehmet = await axios.post(`${baseURL}/employees`, {
      name: 'Mehmet',
      mainSkill: 'Node.js',
      skillLevel: 4,
    })
    console.log('✅ Çalışan eklendi:', mehmet.data.name)
    console.log('🤖 TUVIA OTONOM ASİSTAN: Görevler yetkinlik bazlı atanıyor...')
    const task1 = await axios.post(`${baseURL}/employees/Canan/tasks`, {
      title: 'Arayüz Tasarımı',
      requiredSkill: 'JS',
      difficulty: 3,
    })
    console.log('✅ Görev atandı:', task1.data.title, '->', 'Canan', '(id:', task1.data.id, ')')

    console.log('🤖 Tamamlama isteği + onay (Mehmet onaylar, Canan kendini onaylayamaz)...')
    const taskId = task1.data.id
    await axios.patch(`${baseURL}/tasks/${taskId}/complete`, { employeeName: 'Canan' })
    const approved = await axios.patch(`${baseURL}/tasks/${taskId}/approve`, { approverName: 'Mehmet' })
    console.log('✅ Onaylandı. Canan puanı:', approved.data.submitterPoints)

    console.log('🤖 TUVIA OTONOM ASİSTAN: Yetkinlik dışı görev ataması test ediliyor...')
    await axios.post(`${baseURL}/employees/Mehmet/tasks`, {
      title: 'Arayüz Tasarımı',
      requiredSkill: 'JS', // mehmet node.js uzmanı!!hata vermesi lazım
      difficulty: 3,
    })
  } catch (error) {
    console.log('Tuvia kural ihlalini engelledi:', error.response ? error.response.data.error : error.message)
  }
  try {
    const allEmployees = await axios.get(`${baseURL}/employees`)
    console.log('\n📊 GÜNCEL SİSTEM RAPORU:')
    console.log(JSON.stringify(allEmployees.data, null, 2))
  } catch (error) {
    console.error('Rapor alınamadı:', error.message)
  }
}
main()
