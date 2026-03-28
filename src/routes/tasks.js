const express = require('express')

const router = express.Router()
const Task = require('../task')
const Employee = require('../employee')

function taskStatus(task) {
  if (task.rejected) return 'rejected'
  if (task.isCompleted) return 'completed'
  if (task.pendingApproval) return 'pending_approval'
  return 'open'
}

function taskToDto(task) {
  return {
    id: task._id.toString(),
    title: task.title,
    requiredSkill: task.requiredSkill,
    difficulty: task.difficulty,
    status: taskStatus(task),
    isCompleted: task.isCompleted,
    pendingApproval: !!task.pendingApproval,
    rejected: !!task.rejected,
    rejectionReason: task.rejectionReason || '',
    dueAt: task.dueAt ? task.dueAt.toISOString() : null,
    overdue: !!task.isOverdue,
  }
}

router.get('/overdue', async (req, res) => {
  try {
    const now = new Date()
    const tasks = await Task.find({
      isCompleted: false,
      rejected: { $ne: true },
      dueAt: { $ne: null, $lt: now },
    })
    res.send(tasks.map(taskToDto))
  } catch (error) {
    res.status(500).send({ error: 'Geciken görevler alınamadı.' })
  }
})

router.patch('/:taskId/reject', async (req, res) => {
  try {
    const { approverName, reason } = req.body
    if (!approverName) {
      return res.status(400).send({ error: 'approverName gerekli.' })
    }
    const task = await Task.findById(req.params.taskId)
    if (!task) {
      return res.status(404).send({ error: 'Görev bulunamadı.' })
    }
    const approver = await Employee.findOne({ name: approverName })
    if (!approver) {
      return res.status(404).send({ error: 'Onaylayıcı bulunamadı.' })
    }
    const submitterId = task.completionRequestedBy
    await approver.rejectTaskCompletion(task, typeof reason === 'string' ? reason : '')
    const submitterAfter = submitterId ? await Employee.findById(submitterId) : null
    res.send({
      id: task._id.toString(),
      title: task.title,
      status: taskStatus(task),
      rejected: task.rejected,
      pendingApproval: task.pendingApproval,
      rejectedBy: approver.name,
      skillRejections: submitterAfter ? submitterAfter.skillRejections : [],
    })
  } catch (error) {
    res.status(400).send({ error: 'Red işlemi yapılamadı.', detail: error.message })
  }
})

router.patch('/:taskId/approve', async (req, res) => {
  try {
    const { approverName } = req.body
    if (!approverName) {
      return res.status(400).send({ error: 'approverName gerekli.' })
    }
    const task = await Task.findById(req.params.taskId)
    if (!task) {
      return res.status(404).send({ error: 'Görev bulunamadı.' })
    }
    const approver = await Employee.findOne({ name: approverName })
    if (!approver) {
      return res.status(404).send({ error: 'Onaylayıcı bulunamadı.' })
    }
    await approver.approveTaskCompletion(task)
    const submitter = await Employee.findById(task.completionRequestedBy)
    res.send({
      id: task._id.toString(),
      title: task.title,
      status: taskStatus(task),
      isCompleted: task.isCompleted,
      pendingApproval: task.pendingApproval,
      submitterPoints: submitter ? submitter.points : null,
      approvedBy: approver.name,
    })
  } catch (error) {
    res.status(400).send({ error: 'Onay verilemedi.', detail: error.message })
  }
})

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find()
    res.send(tasks.map(taskToDto))
  } catch (error) {
    res.status(500).send({ error: 'Görevleri listeleme hatası.' })
  }
})

router.patch('/:taskId/complete', async (req, res) => {
  try {
    const { employeeName } = req.body
    if (!employeeName) {
      return res.status(400).send({ error: 'employeeName gerekli.' })
    }
    const task = await Task.findById(req.params.taskId)
    if (!task) {
      return res.status(404).send({ error: 'Görev bulunamadı.' })
    }
    const employee = await Employee.findOne({ name: employeeName })
    if (!employee) {
      return res.status(404).send({ error: 'Çalışan bulunamadı.' })
    }
    const taskIdStr = task._id.toString()
    const hasTask = employee.tasks.some(t => {
      const id = t && t._id ? t._id : t
      return id.toString() === taskIdStr
    })
    if (!hasTask) {
      return res.status(400).send({ error: 'Bu görev bu çalışana atanmamış.' })
    }
    await employee.completeTask(task)
    res.send({
      id: task._id.toString(),
      title: task.title,
      status: 'pending_approval',
      isCompleted: task.isCompleted,
      pendingApproval: task.pendingApproval,
      employeePoints: employee.points,
      message: 'Tamamlama isteği alındı; onay sonrası puan verilir.',
    })
  } catch (error) {
    res.status(400).send({ error: 'Görev tamamlanamadı.', detail: error.message })
  }
})

module.exports = router
