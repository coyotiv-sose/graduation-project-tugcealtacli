const express = require('express')

const router = express.Router()
const Task = require('../task')
const Employee = require('../employee')
const TaskActivity = require('../task-activity')
const PointTransaction = require('../point-transaction')
const { getHelperCandidates } = require('../services/assignment-service')

const { requireAuth, requireManager } = require('../middleware/auth')
const generateTaskDescription = require('../services/ai-service')

function taskStatus(task) {
  if (task.status) return task.status
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
    assignees: Array.isArray(task.assignees)
      ? task.assignees.map(a => ({
          id: a._id ? a._id.toString() : a.toString(),
          name: a.name || null,
        }))
      : [],
    helper: task.helper
      ? {
          id: task.helper._id ? task.helper._id.toString() : task.helper.toString(),
          name: task.helper.name || null,
        }
      : null,
    helpEventCount: Array.isArray(task.helpEvents) ? task.helpEvents.length : 0,
  }
}

router.get('/overdue', requireAuth, async (req, res) => {
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

router.get('/:taskId', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('assignees').populate('helper')

    if (!task) {
      return res.status(404).send({ error: 'Görev bulunamadı.' })
    }

    const activities = await TaskActivity.find({ task: task._id })
      .populate('actor')
      .sort({ createdAt: -1 })
      .limit(20)

    res.send({
      ...taskToDto(task),
      activities: activities.map(row => ({
        id: row._id.toString(),
        action: row.action,
        meta: row.meta || {},
        createdAt: row.createdAt,
        actor: row.actor
          ? {
              id: row.actor._id.toString(),
              name: row.actor.name,
            }
          : null,
      })),
    })
  } catch (error) {
    res.status(400).send({ error: 'Görev detayı alınamadı.' })
  }
})

router.patch('/:taskId/reject', requireManager, async (req, res) => {
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

    await TaskActivity.create({
      task: task._id,
      actor: approver._id,
      action: 'rejected',
      meta: {
        reason: typeof reason === 'string' ? reason : '',
      },
    })

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
    res.status(400).send({
      error: 'Red işlemi yapılamadı.',
      detail: error.message,
    })
  }
})

router.patch('/:taskId/approve', requireManager, async (req, res) => {
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

    const submitterId = task.completionRequestedBy

    await approver.approveTaskCompletion(task)

    const submitter = submitterId ? await Employee.findById(submitterId) : null

    if (submitter) {
      await PointTransaction.create({
        employee: submitter._id,
        task: task._id,
        type: 'task_completion',
        points: task.difficulty * 10,
        description: `"${task.title}" görevi onaylandı`,
      })
    }

    await TaskActivity.create({
      task: task._id,
      actor: approver._id,
      action: 'approved',
      meta: {
        approverName: approver.name,
      },
    })

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
    res.status(400).send({
      error: 'Onay verilemedi.',
      detail: error.message,
    })
  }
})

router.get('/', requireAuth, async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignees').populate('helper')
    res.send(tasks.map(taskToDto))
  } catch (error) {
    res.status(500).send({ error: 'Görevleri listeleme hatası.' })
  }
})

router.patch('/:taskId/complete', requireAuth, async (req, res) => {
  try {
    const { employeeName } = req.body || {}

    const task = await Task.findById(req.params.taskId).populate('assignees')
    if (!task) {
      return res.status(404).send({ error: 'Görev bulunamadı.' })
    }

    let employee = null

    if (employeeName) {
      employee = await Employee.findOne({ name: employeeName })
      if (!employee) {
        return res.status(404).send({ error: 'Çalışan bulunamadı.' })
      }
    } else {
      if (!task.assignees || task.assignees.length === 0) {
        return res.status(400).send({ error: 'Bu görevin atanmış çalışanı yok.' })
      }

      employee = await Employee.findById(task.assignees[0]._id)
      if (!employee) {
        return res.status(404).send({ error: 'Görev sahibi çalışan bulunamadı.' })
      }
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

    await TaskActivity.create({
      task: task._id,
      actor: employee._id,
      action: 'completion_requested',
      meta: {
        employeeName: employee.name,
      },
    })

    res.send({
      id: task._id.toString(),
      title: task.title,
      status: taskStatus(task),
      isCompleted: task.isCompleted,
      pendingApproval: task.pendingApproval,
      employee: {
        id: employee._id.toString(),
        name: employee.name,
        points: employee.points,
      },
      message: 'Tamamlama isteği alındı; onay sonrası puan verilir.',
    })
  } catch (error) {
    res.status(400).send({
      error: 'Görev tamamlanamadı.',
      detail: error.message,
    })
  }
})

router.post('/', requireManager, async (req, res) => {
  try {
    const { title, requiredSkill, difficulty } = req.body

    if (!title || !requiredSkill || difficulty === undefined) {
      return res.status(400).send({ error: 'title, requiredSkill ve difficulty zorunludur.' })
    }

    const task = await Task.create({
      title: String(title).trim(),
      requiredSkill: String(requiredSkill).trim(),
      difficulty: Number(difficulty),
      status: 'open',
    })

    await TaskActivity.create({
      task: task._id,
      actor: null,
      action: 'created',
      meta: {
        title: task.title,
      },
    })

    const io = req.app.get('io')
    if (io) {
      io.emit('task_created', taskToDto(task))
    }

    res.status(201).send(taskToDto(task))
  } catch (error) {
    res.status(400).send({
      error: 'Görev eklenemedi.',
      detail: error.message,
    })
  }
})

router.post('/generate-description', requireManager, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).send({ error: 'Görev başlığı (title) eksik!' });
    }
    
    const description = await generateTaskDescription(title);
    res.send({ description });
  } catch (error) {
    res.status(500).send({ error: 'Yapay zeka açıklaması oluşturulamadı.' });
  }
});

router.post('/:taskId/request-help', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate('assignees')

    if (!task) {
      return res.status(404).send({ error: 'Görev bulunamadı.' })
    }

    const assigneeIds = task.assignees ? task.assignees.map(a => a._id.toString()) : []
    const employees = await Employee.find({ role: { $ne: 'manager' } })
    const recommendedHelpers = getHelperCandidates(employees, task, assigneeIds).slice(0, 3)

    res.send({
      task: {
        id: task._id.toString(),
        title: task.title,
        requiredSkill: task.requiredSkill,
        difficulty: task.difficulty,
        assignees: task.assignees ? task.assignees.map(a => ({
          id: a._id.toString(),
          name: a.name,
        })) : [],
      },
      recommendedHelpers: recommendedHelpers.map(row => ({
        id: row.employee._id.toString(),
        name: row.employee.name,
        mainSkill: row.employee.mainSkill,
        skillLevel: row.employee.skillLevel,
        activeTaskCount: typeof row.employee.activeWorkload === 'function' ? row.employee.activeWorkload() : 0,
        totalScore: row.score ? row.score.total : 0,
        reason: row.score ? row.score.reason : ['Sistem önerisi'],
      })),
    })
  } catch (error) {
    res.status(400).send({
      error: 'Yardım önerileri alınamadı.',
      detail: error.message,
    })
  }
})

router.post('/:taskId/accept-help', requireAuth, async (req, res) => {
  try {
    const { helperId } = req.body

    if (!helperId) {
      return res.status(400).send({ error: 'helperId gerekli.' })
    }

    const task = await Task.findById(req.params.taskId).populate('assignees')
    if (!task) {
      return res.status(404).send({ error: 'Görev bulunamadı.' })
    }

    const helper = await Employee.findById(helperId)
    if (!helper) {
      return res.status(404).send({ error: 'Yardım edecek çalışan bulunamadı.' })
    }

    let peer = null;
    if (task.assignees && task.assignees.length > 0) {
      peer = await Employee.findById(task.assignees[0]._id)
      if (peer && helper._id.toString() === peer._id.toString()) {
        return res.status(400).send({ error: 'Görev sahibi kendisine yardım edemez.' })
      }
      
      if(typeof helper.helpPeer === 'function') {
         await helper.helpPeer(peer, { taskId: task._id })
      }
    } else {
      task.assignees = [helper._id];
      task.helper = helper._id;
      await task.save();
    }

    await PointTransaction.create({
      employee: helper._id,
      task: task._id,
      type: 'help_bonus',
      points: 5,
      description: `"${task.title}" görevi için yardım/üstlenme bonusu`,
    })

    await TaskActivity.create({
      task: task._id,
      actor: helper._id,
      action: 'help_given',
      meta: {
        peerId: peer ? peer._id.toString() : 'sahipsiz',
        peerName: peer ? peer.name : 'sahipsiz',
      },
    })

    const updatedTask = await Task.findById(task._id).populate('assignees').populate('helper')

    const io = req.app.get('io')
    if (io && peer) {
      io.to(peer._id.toString()).emit('help_received', {
        message: `${helper.name} size "${task.title}" görevinde yardım etmeye başladı! ✨`,
        taskId: task._id.toString()
      })
    }

    res.send({
      message: peer ? `${helper.name}, ${peer.name} kişisine yardım etti.` : `${helper.name} boşta olan görevi üstlendi.`,
      task: taskToDto(updatedTask)
    })
    
  } catch (error) {
    console.error("YARDIM ATAMA HATASI DETAYI:", error);
    res.status(400).send({
      error: 'Yardım işlemi yapılamadı.',
      detail: error.message,
    })
  }
})

module.exports = router