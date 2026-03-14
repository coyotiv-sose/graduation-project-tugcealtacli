const axios = require('axios') // axios kütüphanesini ekledik (npm install axios)
const Employee = require('./employee') // Employee sınıfını kendi dosyasından çağırdık

async function main() {
  try {
    console.log('🤖 TUVIA OTONOM ASİSTAN: Çalışanlar sisteme ekleniyor...')
    const canan = await axios.post('http://localhost:3000/employees', { name: 'Canan', mainSkill: 'JS', skillLevel: 5 })
    console.log('✅ Çalışan eklendi:', canan.data.name)
    const mehmet = await axios.post('http://localhost:3000/employees', {
      name: 'Mehmet',
      mainSkill: 'Node.js',
      skillLevel: 4,
    })
    console.log('✅ Çalışan eklendi:', mehmet.data.name)
    // await axios.post('http://localhost:3000/employees', { name: 'Canan', mainSkill: 'JS', skillLevel: 5 })
    // console.log(canan.data);
    // await axios.post('http://localhost:3000/employees', { name: 'Mehmet', mainSkill: 'Node.js', skillLevel: 4 })
    // console.log(mehmet.data);
    // const allEmployees = await axios.get('http://localhost:3000/employees');
    console.log('🤖 TUVIA OTONOM ASİSTAN: Görevler yetkinlik bazlı atanıyor...')
    const task1 = await axios.post('http://localhost:3000/employees/Canan/tasks', {
      title: 'Arayüz Tasarımı',
      requiredSkill: 'JS',
      difficulty: 3,
    })
    console.log('✅ Görev atandı:', task1.data.title, '->', 'Canan')
    console.log('🤖 TUVIA OTONOM ASİSTAN: Yetkinlik dışı görev ataması test ediliyor...')
    await axios.post('http://localhost:3000/employees/Mehmet/tasks', {
      title: 'Arayüz Tasarımı',
      requiredSkill: 'JS', // mehmet node.js uzmanı!!hata vermesi lazım
      difficulty: 3,
    })
  } catch (error) {
    console.log('Tuvia kural ihlalini engelledi:', error.response ? error.response.data.error : error.message)
  }
  try {
    const allEmployees = await axios.get('http://localhost:3000/employees')
    console.log('\n📊 GÜNCEL SİSTEM RAPORU:')
    console.log(JSON.stringify(allEmployees.data, null, 2))
  } catch (error) {
    console.error('Rapor alınamadı:', error.message)
  }
}
main()
/*
// Çalışanları oluştururuz (mesela Canan ve Mehmet olsun)
const canan = new Employee('Canan', 'Excel', 98)
const mehmet = new Employee('Mehmet', 'Excel', 40)

// Görevi tanımladık
const productLaunchTask = new Task('Q3 Bütçe Analizi', 'Excel')

// İş akışını simüle ettik
productLaunchTask.assignees.push(mehmet)//mehmeti ekibe dahil ettik
productLaunchTask.helper = canan // Canan yardıma gelir
productLaunchTask.isCompleted = true // İş biter

// Final raporunu yazdırıyoruz.patron bunu görecek
//console.log(productLaunchTask.report) // raporu siyah normal yazdırır
const count = productLaunchTask.assignees.lengt;
//const employeeText = pluralize('employee', count, true);
//console.log(`${productLaunchTask.title} projesinde ${employeeText} çalışıyor.`.magenta);--> burada sadece son satır renkli olur!!
//console.log(productLaunchTask.report.magenta);-->pluralize kütüphanesini eklemeden önce, yine raporun tamamı renkliyken.
//console.log(`${productLaunchTask.report}\n${productLaunchTask.title} projesinde ${employeeText} çalışıyor.`.magenta)//böyle yapınca tüm rapor renkli oldu.
//console.log(productLaunchTask.report)-->normal rapor yazdırır, renkli değil.
TaskReporter.printFullReport(productLaunchTask)//task-reporter.js dosyasındaki printFullReport fonksiyonunu çağırıp raporu renkli bir şekilde yazrırıyoruz
*/
