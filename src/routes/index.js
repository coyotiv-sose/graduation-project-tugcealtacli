const express = require('express')

const router = express.Router()
const Employee = require('../employee')

const Task = require('../task')

router.get('/', async function (req, res, next) {
  try {
    await Employee.deleteMany({})
    await Task.deleteMany({})
    // her seferinde temiz bir başlangıç yapalım diye çalışanları ve görevleri sıfırladık

    const canan = await Employee.create({ name: 'Canan', mainSkill: 'Excel', skillLevel: 5 })
    const mehmet = await Employee.create({ name: 'Mehmet', mainSkill: 'Excel', skillLevel: 2 })
    const zorGorev = await Task.create({ title: 'Bütçe Analizi', requiredSkill: 'Excel', difficulty: 4 })
    // mehmet denesin ama başarısız olsun cünkü seviyesi yetersiz
    let mehmetSonuc = 'Mehmet denedi: '
    if (mehmet.canHandle(zorGorev)) {
      zorGorev.assignees.push(mehmet)
      await zorGorev.save()
      mehmetSonuc += 'Başarılı!'
    } else {
      mehmetSonuc += 'Başarısız (Yetersiz Seviye)'
    }
    if (canan.canHandle(zorGorev)) {
      zorGorev.assignees.push(canan)
      await zorGorev.save()
      //  await canan.completeTask(zorGorev)
    }

    // Yardım kısmı
    zorGorev.helper = canan
    // await canan.helpPeer(mehmet)
    await zorGorev.save()
    // rapor için idleri gerçek isimlerle eşleştiriyoruz populate ile
    // eslint-disable-next-line no-underscore-dangle
    const populatedGorev = await Task.findById(zorGorev._id)

    // allEmployees is not defined, you may need to fetch it
    const allEmployees = await Employee.find({})

    res.send(`
      <h1>TUVIA SİMÜLASYON RAPORU</h1>
      <p><strong>Mehmet Durumu:</strong> ${mehmetSonuc}</p>
      <pre>${populatedGorev.report}</pre>
      <hr>
      <h3>Tüm Çalışanlar (JSON)</h3>
      <pre>${JSON.stringify(allEmployees, null, 2)}</pre>
    `)
  } catch (err) {
    res.status(500).send(`Bir hata oluştu: ${err.message}`)
  }
})

module.exports = router
