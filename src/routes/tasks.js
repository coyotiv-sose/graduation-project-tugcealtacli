const express = require('express')

const router = express.Router()
const Task = require('../task')
// buraya dön aşağıya
// const Employee = newTask.employee({ title: 'Bütçe Analizi', requiredSkill: 'Excel', difficulty: '5' });

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
    res.send(
      tasks.map(task => ({
        title: task.title,
        requiredSkill: task.requiredSkill,
        difficulty: task.difficulty,
      }))
    )
  } catch (error) {
    res.status(500).send({ error: 'Görevleri listeleme hatası.' })
  }
})

module.exports = router
