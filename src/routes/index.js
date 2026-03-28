const express = require('express')

const router = express.Router()
const Employee = require('../employee')
const Task = require('../task')

const DEMO_TASK_TITLE = 'Bütçe Analizi'

function pickBestAssignee(suitableEmployees) {
  return [...suitableEmployees].sort((a, b) => {
    const dSkill = b.skillLevel - a.skillLevel
    if (dSkill !== 0) return dSkill
    return a.activeWorkload() - b.activeWorkload()
  })[0]
}

function simulationHtml({ assignmentMessage, populatedGorev, allEmployees }) {
  return `
      <h1>TUVIA SİMÜLASYON RAPORU</h1>
      <p>${assignmentMessage}</p>
      <pre>${populatedGorev.report}</pre>
      <hr>
      <h3>Tüm Çalışanlar (JSON)</h3>
      <pre>${JSON.stringify(allEmployees, null, 2)}</pre>
    `
}

function emptyStateHtml() {
  return `
      <h1>TUVIA</h1>
      <p>Henüz demo verisi yok. Örnek çalışanlar ve görevi yüklemek için:</p>
      <pre>POST /demo/seed</pre>
      <p>(Örnek: <code>curl -X POST http://localhost:3000/demo/seed</code>)</p>
    `
}

router.get('/', async function (req, res) {
  try {
    const zorGorev = await Task.findOne({ title: DEMO_TASK_TITLE })
    if (!zorGorev) {
      return res.status(200).send(emptyStateHtml())
    }
    const populatedGorev = await Task.findById(zorGorev._id)
    const allEmployees = await Employee.find({})
    const assignmentMessage = 'Mevcut veritabanı durumu (GET isteği veriyi silmez).'

    res.send(
      simulationHtml({
        assignmentMessage,
        populatedGorev,
        allEmployees,
      })
    )
  } catch (err) {
    res.status(500).send(`Bir hata oluştu: ${err.message}`)
  }
})

/**
 * Prototip / sunum endpoint’i: DB’yi temizleyip sabit demo verisini yükler.
 * Üretim ürünü akışı değildir; slayt veya jüri önünde “demo simülasyonu” olarak anlatılmalıdır.
 */
router.post('/demo/seed', async function (req, res) {
  try {
    await Employee.deleteMany({})
    await Task.deleteMany({})
    await Employee.create({ name: 'Canan', mainSkill: 'Excel', skillLevel: 5 })
    await Employee.create({ name: 'Mehmet', mainSkill: 'Excel', skillLevel: 2 })
    const zorGorev = await Task.create({
      title: DEMO_TASK_TITLE,
      requiredSkill: 'Excel',
      difficulty: 4,
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    })

    const employees = await Employee.find({})
    const suitableEmployees = employees.filter(
      emp => emp.canHandle(zorGorev) && !emp.isBlockedForSkill(zorGorev.requiredSkill)
    )
    let assignmentMessage = ''
    if (suitableEmployees.length === 0) {
      assignmentMessage = 'Bu görevi yapabilecek çalışan bulunamadı.'
    } else {
      const bestEmployee = pickBestAssignee(suitableEmployees)
      zorGorev.assignees.push(bestEmployee._id)
      if (!bestEmployee.tasks.includes(zorGorev._id)) {
        bestEmployee.tasks.push(zorGorev._id)
      }
      await bestEmployee.save()
      await zorGorev.save()
      assignmentMessage = `Bu görev otomatik olarak ${bestEmployee.name} kişisine atandı.`
    }

    const helperCandidates = employees.filter(
      emp =>
        emp.mainSkill.toLowerCase() === zorGorev.requiredSkill.toLowerCase() &&
        !zorGorev.assignees.some(a => a.toString() === emp._id.toString())
    )
    if (helperCandidates.length > 0) {
      const helper = helperCandidates[0]
      zorGorev.helper = helper._id
      await zorGorev.save()
    }

    const populatedGorev = await Task.findById(zorGorev._id)
    const allEmployees = await Employee.find({})

    res.status(201).send(
      simulationHtml({
        assignmentMessage,
        populatedGorev,
        allEmployees,
      })
    )
  } catch (err) {
    res.status(500).send(`Bir hata oluştu: ${err.message}`)
  }
})

module.exports = router
