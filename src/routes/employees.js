const express = require('express')

const router = express.Router()
const Employee = require('../employee') // Sınıfı çağırdık

const Task = require('../task')

/* GET tüm çalışanları listele. */
router.get('/', function (req, res, next) {
  res.send(Employee.list)
})

/* POST yeni çalışan oluştur */
router.post('/', function (req, res, next) {
  try {
    const employee = Employee.create({
      name: req.body.name,
      mainSkill: req.body.mainSkill,
      skillLevel: req.body.skillLevel,
    })
    res.send(employee)
  } catch (error) {
    console.error('Kayıt hatası:', error)
    res.status(400).send('Kayıt oluşturulurken hata oluştu.')
  }
})
router.post('/:name/tasks', function (req, res, next) {
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

module.exports = router
