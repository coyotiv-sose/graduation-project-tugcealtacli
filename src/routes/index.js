const express = require('express')

const router = express.Router()
const Employee = require('../employee')
const Task = require('../task')

router.get('/', function (req, res, next) {
  Employee.list = []

  const canan = Employee.create({ name: 'Canan', mainSkill: 'Excel', skillLevel: 5 })
  const mehmet = Employee.create({ name: 'Mehmet', mainSkill: 'Excel', skillLevel: 2 })

  const zorGorev = new Task('Bütçe Analizi', 'Excel', 4)
  // mehmet denesin ama başarısız olsun cünkü seviyesi yetersiz
  let mehmetSonuc = 'Mehmet denedi: '
  if (mehmet.canHandle(zorGorev)) {
    zorGorev.assignTo(mehmet)
    mehmetSonuc += 'Başarılı!'
  } else {
    mehmetSonuc += 'Başarısız (Yetersiz Seviye)'
  }
  // sonra canana deniyor ve basarılı oluyor cünkü seviyesi yeterli
  if (canan.canHandle(zorGorev)) {
    zorGorev.assignees.push(canan)
    // görev bitsin.
    canan.completeTask(zorGorev)
    zorGorev.isCompleted = true
  }

  // Yardım kısmı
  zorGorev.helper = canan
  canan.helpPeer(mehmet)

  res.send(`
    <h1>TUVIA SİMÜLASYON RAPORU</h1>
    <p><strong>Mehmet Durumu:</strong> ${mehmetSonuc}</p>
    <pre>${zorGorev.report}</pre>
    <hr>
    <h3>Tüm Çalışanlar (JSON)</h3>
    <pre>${JSON.stringify(Employee.list, null, 2)}</pre>
  `)
})

module.exports = router
