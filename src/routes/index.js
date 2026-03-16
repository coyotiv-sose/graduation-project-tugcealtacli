const express = require('express')

const router = express.Router()
const Employee = require('../employee')
const Task = require('../task')

router.get('/', async function (req, res) {
  try {
    // her çalıştırmada veritabanını temizle
    await Employee.deleteMany({})
    await Task.deleteMany({})
    // çalışanları oluştur
    await Employee.create({ name: 'Canan', mainSkill: 'Excel', skillLevel: 5 })
    await Employee.create({ name: 'Mehmet', mainSkill: 'Excel', skillLevel: 2 })
    // görev oluştur
    const zorGorev = await Task.create({ title: 'Bütçe Analizi', requiredSkill: 'Excel', difficulty: 4 })
    // mehmet denesin ama başarısız olsun cünkü seviyesi yetersiz
    /* let mehmetSonuc = 'Mehmet denedi: '
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
      if (!canan.tasks.includes(zorGorev._id)) {
        canan.tasks.push(zorGorev._id)
        await canan.save()
      }
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


    */
    // sistem kendisi seçsin yetkinliğe göre(deneme yapıyorum)
    // tüm çalışanları al
    const employees = await Employee.find({})
    // görevi kimler yapabilir filtrele
    const suitableEmployees = employees.filter(emp => emp.canHandle(zorGorev))
    let assignmentMessage = ''
    if (suitableEmployees.length === 0) {
      assignmentMessage = 'Bu görevi yapabilecek çalışan bulunamadı.'
    } else {
      // ilk uygun çalışanı ata
      const bestEmployee = suitableEmployees.sort((a, b) => b.skillLevel - a.skillLevel)[0]
      // görevi ata
      zorGorev.assignees.push(bestEmployee._id)
      if (!bestEmployee.tasks.includes(zorGorev._id)) {
        bestEmployee.tasks.push(zorGorev._id)
      }
      await bestEmployee.save()
      await zorGorev.save()
      assignmentMessage = `Bu görev otomatik olarak ${bestEmployee.name} kişisine atandı.`
    }
    // helper seçelim
    const helperCandidates = employees.filter(
      emp => emp.mainSkill == zorGorev.requiredSkill && !zorGorev.assignees.includes(emp._id)
    )
    if (helperCandidates.length > 0) {
      const helper = helperCandidates[0]
      zorGorev.helper = helper._id
      await zorGorev.save()
    }
    // gerçek isimleri getiriyoruz. ne ile? populate ile.
    const populatedGorev = await Task.findById(zorGorev, _id)
    const allEmployees = await Employee.find({})

    res.send(`
      <h1>TUVIA SİMÜLASYON RAPORU</h1>
      <p>${assignmentMessage}</p>
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
