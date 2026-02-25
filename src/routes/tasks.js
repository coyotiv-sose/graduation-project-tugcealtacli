const express = require('express')

const router = express.Router()
const Task = require('../task')
// buraya dön aşağıya
// const Employee = newTask.employee({ title: 'Bütçe Analizi', requiredSkill: 'Excel', difficulty: '5' });

router.get('/', (req, res) => {
  res.send(
    Task.list.map(task => ({
      title: task.title,
      requiredSkill: task.requiredSkill,
      difficulty: task.difficulty,
    }))
  )
})

module.exports = router
