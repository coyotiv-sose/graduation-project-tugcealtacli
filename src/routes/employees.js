const express = require('express')

const router = express.Router()
const Employee = require('../employee') // Sınıfı çağırdık

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
router.post('/:name/tasks', async (req, res) => {
  try {
    const employee = await Employee.findOne({ name: req.params.name })
    if (!employee) {
      return res.status(404).send('Çalışan bulunamadı.')
    }
    const { title, requiredSkill, difficulty } = req.body
    const taskRequirements = { requiredSkill, difficulty }
    if (!employee.canHandle(taskRequirements)) {
      return res.status(400).send({ error: `${employee.name} bu görev için uygun yetkinliğe sahip değil.` })
    }
    const task = await employee.createTask(title, requiredSkill, difficulty)
    res.send({ title: task.title, requiredSkill: task.requiredSkill, difficulty: task.difficulty })
  } catch (error) {
    res.status(400).send({ 'Görev oluşturma hatası.': error.message })
  }
})

module.exports = router
