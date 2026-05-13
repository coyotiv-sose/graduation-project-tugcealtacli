const express = require('express')
const router = express.Router()
const TaskActivity = require('../task-activity')

function toDto(row) {
  return {
    id: row._id.toString(),
    task: row.task
      ? {
          id: row.task._id.toString(),
          title: row.task.title,
        }
      : null,
    actor: row.actor
      ? {
          id: row.actor._id.toString(),
          name: row.actor.name,
        }
      : null,
    action: row.action,
    meta: row.meta || {},
    createdAt: row.createdAt,
  }
}

router.get('/', async (req, res) => {
  try {
    const rows = await TaskActivity.find()
      .populate('task')
      .populate('actor')
      .sort({ createdAt: -1 })

    res.send(rows.map(toDto))
  } catch (error) {
    res.status(500).send({ error: 'Task aktiviteleri alınamadı.' })
  }
})

router.get('/task/:taskId', async (req, res) => {
  try {
    const rows = await TaskActivity.find({ task: req.params.taskId })
      .populate('task')
      .populate('actor')
      .sort({ createdAt: -1 })

    res.send(rows.map(toDto))
  } catch (error) {
    res.status(500).send({ error: 'Task aktivite geçmişi alınamadı.' })
  }
})

module.exports = router