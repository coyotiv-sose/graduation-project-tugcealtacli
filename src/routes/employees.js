const express = require('express')

const router = express.Router()
const Employee = require('../employee') // Sınıfı çağırdık
const Task = require('../task')

const MAX_ACTIVE_TASKS_PER_EMPLOYEE = Number(process.env.MAX_ACTIVE_TASKS_PER_EMPLOYEE) || 5

router.get('/leaderboard', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ points: -1, name: 1 })
    res.send(
      employees.map((emp, index) => ({
        rank: index + 1,
        name: emp.name,
        mainSkill: emp.mainSkill,
        skillLevel: emp.skillLevel,
        points: emp.points,
        activeTaskCount: emp.activeWorkload(),
      }))
    )
  } catch (error) {
    res.status(500).send({ error: 'Liderlik tablosu alınamadı.' })
  }
})

// get ile calışanları listele
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
    res.send(
      employees.map(emp => ({
        name: emp.name,
        mainSkill: emp.mainSkill,
        skillLevel: emp.skillLevel,
        points: emp.points,
        activeTaskCount: emp.activeWorkload(),
        skillRejections: emp.skillRejections || [],
        tasks: emp.tasks.map(t => t.title),
      }))
    )
  } catch (error) {
    res.status(500).send({ error: 'Çalışanları listeleme hatası.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const employee = await Employee.create(req.body)
    res.send({ name: employee.name, mainSkill: employee.mainSkill, skillLevel: employee.skillLevel })
  } catch (error) {
    res.status(400).send({ error: 'Çalışan oluşturma hatası.' })
  }
})
// eslint-disable-next-line consistent-return
router.post('/:name/tasks', async (req, res) => {
  try {
    const employee = await Employee.findOne({ name: req.params.name })
    if (!employee) {
      return res.status(404).send('Çalışan bulunamadı.')
    }
    const { title, requiredSkill, difficulty, dueAt } = req.body
    const taskRequirements = { requiredSkill, difficulty }
    if (!employee.canHandle(taskRequirements)) {
      return res.status(400).send({ error: `${employee.name} bu görev için uygun yetkinliğe sahip değil.` })
    }
    if (employee.activeWorkload() >= MAX_ACTIVE_TASKS_PER_EMPLOYEE) {
      return res.status(400).send({
        error: `${employee.name} için aktif görev limiti doldu (${MAX_ACTIVE_TASKS_PER_EMPLOYEE}).`,
      })
    }
    const task = await employee.createTask(title, requiredSkill, difficulty, dueAt)
    res.send({
      id: task._id.toString(),
      title: task.title,
      requiredSkill: task.requiredSkill,
      difficulty: task.difficulty,
      dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    })
  } catch (error) {
    res.status(400).send({ 'Görev oluşturma hatası.': error.message })
  }
})

router.post('/:helperName/help/:peerName', async (req, res) => {
  try {
    const helper = await Employee.findOne({ name: req.params.helperName })
    const peer = await Employee.findOne({ name: req.params.peerName })
    if (!helper) {
      return res.status(404).send({ error: 'Yardım eden çalışan bulunamadı.' })
    }
    if (!peer) {
      return res.status(404).send({ error: 'Yardım alan çalışan bulunamadı.' })
    }
    const { taskId } = req.body || {}
    await helper.helpPeer(peer, taskId ? { taskId } : {})
    const payload = {
      helper: { name: helper.name, points: helper.points },
      peer: { name: peer.name, points: peer.points },
    }
    if (taskId) {
      const task = await Task.findById(taskId)
      if (task) {
        payload.taskHelp = {
          taskId: task._id.toString(),
          helpEventCount: task.helpEvents.length,
        }
      }
    }
    res.send(payload)
  } catch (error) {
    res.status(400).send({ error: 'Yardım kaydı oluşturulamadı.', detail: error.message })
  }
})

module.exports = router
