const express = require('express')
const router = express.Router()
const Employee = require('../employee')
const Task = require('../task')

const MAX_ACTIVE_TASKS_PER_EMPLOYEE = Number(process.env.MAX_ACTIVE_TASKS_PER_EMPLOYEE) || 5

function employeeToDto(emp) {
  return {
    id: emp._id.toString(),
    name: emp.name,
    mainSkill: emp.mainSkill,
    skillLevel: emp.skillLevel,
    skills: Array.isArray(emp.skills)
      ? emp.skills.map(skill => ({
          name: skill.name,
          level: skill.level
        }))
      : [],
    points: emp.points || 0,
    activeTaskCount: emp.activeWorkload(),
    skillRejections: emp.skillRejections || [],
    tasks: emp.tasks ? emp.tasks.map(t => (t.title ? t.title : t.toString())) : [],
  }
}

router.get('/leaderboard', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ points: -1, name: 1 })

    res.send(
      employees.map((emp, index) => ({
        rank: index + 1,
        id: emp._id.toString(),
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

router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find()
    res.send(employees.map(employeeToDto))
  } catch (error) {
    res.status(500).send({ error: 'Çalışanları listeleme hatası.' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).send({ error: 'Çalışan bulunamadı.' })
    }

    res.send(employeeToDto(employee))
  } catch (error) {
    res.status(400).send({ error: 'Çalışan bilgisi alınamadı.' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, mainSkill, skillLevel, skills } = req.body

    if (!name || !mainSkill || skillLevel === undefined) {
      return res.status(400).send({ error: 'name, mainSkill ve skillLevel zorunludur.' })
    }

    let normalizedSkills = []

    if (Array.isArray(skills) && skills.length > 0) {
      normalizedSkills = skills.map(skill => ({
        name: String(skill.name).trim(),
        level: Number(skill.level),
      }))
    } else {
      normalizedSkills = [
        {
          name: String(mainSkill).trim(),
          level: Number(skillLevel),
        },
      ]
    }

    const employee = await Employee.create({
      name: String(name).trim(),
      mainSkill: String(mainSkill).trim(),
      skillLevel: Number(skillLevel),
      skills: normalizedSkills,
    })

    res.status(201).send(employeeToDto(employee))
  } catch (error) {
    console.error('Çalışan eklenirken backend hatası:', error.message)
    res.status(400).send({
      error: 'Çalışan oluşturma hatası.',
      detail: error.message,
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
    if (!employee) {
      return res.status(404).send({ error: 'Çalışan bulunamadı.' })
    }

    await Employee.findByIdAndDelete(req.params.id)
    res.send({ message: 'Çalışan başarıyla silindi.' })
  } catch (error) {
    res.status(400).send({ error: 'Çalışan silinemedi.' })
  }
})

router.post('/:name/tasks', async (req, res) => {
  try {
    const employee = await Employee.findOne({ name: req.params.name })

    if (!employee) {
      return res.status(404).send({
        error: 'Çalışan bulunamadı. İsmi doğru yazdığınızdan emin olun.',
      })
    }

    const { title, requiredSkill, difficulty, dueAt } = req.body

    if (!title || !requiredSkill || difficulty === undefined) {
      return res.status(400).send({ error: 'title, requiredSkill ve difficulty zorunludur.' })
    }

    const taskRequirements = {
      requiredSkill: String(requiredSkill).trim(),
      difficulty: Number(difficulty),
    }

    if (!employee.canHandle(taskRequirements)) {
      return res.status(400).send({
        error: `${employee.name} bu görev için uygun yetkinliğe sahip değil.`,
      })
    }

    if (employee.activeWorkload() >= MAX_ACTIVE_TASKS_PER_EMPLOYEE) {
      return res.status(400).send({
        error: `${employee.name} için aktif görev limiti doldu (${MAX_ACTIVE_TASKS_PER_EMPLOYEE}).`,
      })
    }

    const task = await employee.createTask(
      String(title).trim(),
      String(requiredSkill).trim(),
      Number(difficulty),
      dueAt
    )

    // YENİ: Görev atandığında çalışana anlık bildirim fırlat (Socket.io)
    const io = req.app.get('io')
    if (io) {
      io.to(employee._id.toString()).emit('notification', {
        type: 'info',
        title: 'Yeni Görev Atandı 🎯',
        message: `Yönetici size yeni bir görev atadı: "${task.title}"`,
      })
    }

    res.status(201).send({
      id: task._id.toString(),
      title: task.title,
      requiredSkill: task.requiredSkill,
      difficulty: task.difficulty,
      dueAt: task.dueAt ? task.dueAt.toISOString() : null,
      status: task.status || 'open',
    })
  } catch (error) {
    res.status(400).send({ error: error.message || 'Görev oluşturma hatası.' })
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

    if (helper._id.toString() === peer._id.toString()) {
      return res.status(400).send({ error: 'Bir çalışan kendisine yardım edemez.' })
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
    res.status(400).send({
      error: 'Yardım kaydı oluşturulamadı.',
      detail: error.message,
    })
  }
})

module.exports = router