const express = require('express')

const router = express.Router()
const Employee = require('../employee') // Sınıfı çağırdık

// const Task = require('../task')

/* GET tüm çalışanları listele. */
router.get('/', (req, res) => {
  res.send(
    Employee.list.map(emp => ({
      name: emp.name,
      mainSkill: emp.mainSkill,
      skillLevel: emp.skillLevel,
      points: emp.points,
      tasks: emp.tasks.map(t => t.title), // görevlerin sadece başlıklarını döndürür
    }))
  )
})

/* POST yeni çalışan oluştur */
router.post('/', (req, res) => {
  const employee = Employee.create(req.body)
  res.send({ name: employee.name, mainSkill: employee.mainSkill, skillLevel: employee.skillLevel })
})
router.post('/:name/tasks', (req, res) => {
  try {
    const employee = Employee.list.find(e => e.name === req.params.name)
    if (!employee) {
      return res.status(404).send('Çalışan bulunamadı.')
    }
    const { title, requiredSkill, difficulty } = req.body
    const task = employee.createTask(title, requiredSkill, difficulty)
    res.send({ title: task.title, requiredSkill: task.requiredSkill, difficulty: task.difficulty })
  } catch (error) {
    res.status(400).send({ 'Görev oluşturma hatası.': error.message })
  }
})
/*
router.post('/:name/tasks', (req, res) => {
  try {
    const employee = Employee.list.find(emp => emp.name === req.params.name)
    if (!employee) {
      return res.status(404).send('Çalışan bulunamadı.')
    }
    const { title, requiredSkill, difficulty } = req.body
    const newTask = new Task(title, requiredSkill, difficulty)
    employee.tasks.push(newTask)
    res.status(201).send(newTask)
  } catch (error) {
    console.error('Görev oluşturma hatası:', error)
    res.status(400).send('Görev oluşturulurken hata oluştu.')
  }
})
router.post('/:userId/tasks', function (req, res, next) {
  try {
    const employee = Employee.list.find(emp => emp.name === req.params.userId)
    const task = Task.create({
      title: req.body.title,
      requiredSkill: req.body.requiredSkill,
      difficulty: req.body.difficulty,
    })
    res.send({ title: task.title, requiredSkill: task.requiredSkill, difficulty: task.difficulty })
  } catch (error) {
    console.error('Görev oluşturma hatası:', error)
    res.status(400).send('Görev oluşturulurken hata oluştu.')
  }
})
  */
module.exports = router
