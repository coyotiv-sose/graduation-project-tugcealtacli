const express = require('express')
const router = express.Router()
const PointTransaction = require('../point-transaction')

function toDto(row) {
  return {
    id: row._id.toString(),
    employee: row.employee
      ? {
          id: row.employee._id.toString(),
          name: row.employee.name,
        }
      : null,
    task: row.task
      ? {
          id: row.task._id.toString(),
          title: row.task.title,
        }
      : null,
    points: row.points,
    type: row.type,
    description: row.description,
    createdAt: row.createdAt,
  }
}

router.get('/', async (req, res) => {
  try {
    const rows = await PointTransaction.find()
      .populate('employee')
      .populate('task')
      .sort({ createdAt: -1 })

    res.send(rows.map(toDto))
  } catch (error) {
    res.status(500).send({ error: 'Point transaction listesi alınamadı.' })
  }
})

router.get('/employee/:employeeId', async (req, res) => {
  try {
    const rows = await PointTransaction.find({ employee: req.params.employeeId })
      .populate('employee')
      .populate('task')
      .sort({ createdAt: -1 })

    res.send(rows.map(toDto))
  } catch (error) {
    res.status(500).send({ error: 'Çalışan puan hareketleri alınamadı.' })
  }
})

module.exports = router