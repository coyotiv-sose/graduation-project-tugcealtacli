const mongoose = require('mongoose')
const bcrypt = require('bcryptjs') // YENİ EKLENDİ: Şifreleme için
const {
  HELPER_SUPPORT_POINTS,
  PEER_HELP_RECEIVED_POINTS,
  TASK_COMPLETION_APPROVAL_POINTS,
} = require('./constants')
const colors = require('colors')
const autopopulate = require('mongoose-autopopulate')
const PointTransaction = require('./point-transaction')
const TaskActivity = require('./task-activity')

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, unique: true }, // unique: true eklendi
    password: { type: String, required: true }, // YENİ EKLENDİ
    role: { type: String, enum: ['employee', 'manager'], default: 'employee' }, // YENİ EKLENDİ
    mainSkill: { type: String, required: true, trim: true },
    skillLevel: { type: Number, required: true, min: 1, max: 5 },

    skills: [
      {
        name: { type: String, required: true, trim: true },
        level: { type: Number, required: true, min: 1, max: 5 },
      },
    ],

    points: { type: Number, default: 0 },
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task', autopopulate: { maxDepth: 1 } }],
    skillRejections: [
      {
        requiredSkill: { type: String, required: true },
        count: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
)
{ timestamps: true }


employeeSchema.plugin(autopopulate)

//  Şifreyi veritabanına kaydetmeden önce otomatik olarak şifreler
employeeSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
})

// Girilen şifrenin doğruluğunu kontrol eder
employeeSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}


employeeSchema.methods.canHandle = function (taskRequirements) {
  if (!taskRequirements || !taskRequirements.requiredSkill) return false

  const requiredSkill = String(taskRequirements.requiredSkill).toLowerCase()
  const difficulty = Number(taskRequirements.difficulty)

  const matchedSkill =
    Array.isArray(this.skills) &&
    this.skills.find(skill => skill.name.toLowerCase() === requiredSkill)

  if (matchedSkill) {
    if (matchedSkill.level < difficulty) {
      console.log(`${this.name} bu görevi üstlenemez, beceri seviyesi yeterli değil.`.yellow)
      return false
    }
    return true
  }

  if (this.mainSkill.toLowerCase() !== requiredSkill) {
    console.log(`❌ ${this.name} bu görevi alamaz. (Yetkinlik Uyuşmazlığı)`.red)
    return false
  }

  if (this.skillLevel < difficulty) {
    console.log(`${this.name} bu görevi üstlenemez, beceri seviyesi yeterli değil.`.yellow)
    return false
  }

  return true
}

employeeSchema.methods.activeWorkload = function () {
  if (!this.tasks || !this.tasks.length) return 0

  return this.tasks.filter(t => {
    if (t && typeof t === 'object' && 'isCompleted' in t) {
      if (t.isCompleted) return false
      if (t.rejected) return false
      return true
    }
    return true
  }).length
}

employeeSchema.methods.failureCountForSkill = function (requiredSkill) {
  if (!this.skillRejections || !this.skillRejections.length) return 0
  const key = requiredSkill.toLowerCase()
  const row = this.skillRejections.find(s => s.requiredSkill.toLowerCase() === key)
  return row ? row.count : 0
}

employeeSchema.methods.isBlockedForSkill = function (requiredSkill) {
  const max = Number(process.env.MAX_SKILL_FAILURES_BEFORE_BLOCK) || 2
  return this.failureCountForSkill(requiredSkill) >= max
}

employeeSchema.methods.recordSkillRejection = function (requiredSkill) {
  const key = requiredSkill.toLowerCase()
  const existing = this.skillRejections.find(s => s.requiredSkill.toLowerCase() === key)
  if (existing) {
    existing.count += 1
  } else {
    this.skillRejections.push({ requiredSkill, count: 1 })
  }
}

employeeSchema.methods.createTask = async function (title, requiredSkill, difficulty, dueAt = null) {
  if (this.isBlockedForSkill(requiredSkill)) {
    throw new Error(
      `${this.name}: "${requiredSkill}" yetkinliğinde çok fazla onay reddi kaydı var; Tuvia bu yetkinlikte yeni görev atamıyor.`
    )
  }

  const Task = mongoose.model('Task')
  const payload = {
    title,
    requiredSkill,
    difficulty,
    createdBy: this._id,
    status: 'open',
  }

  if (dueAt !== undefined && dueAt !== null && dueAt !== '') {
    const d = dueAt instanceof Date ? dueAt : new Date(dueAt)
    if (Number.isNaN(d.getTime())) {
      throw new Error('dueAt geçersiz tarih formatında.')
    }
    payload.dueAt = d
  }

  const task = await Task.create(payload)
  task.assignees.push(this._id)
  await task.save()

  this.tasks.push(task._id)
  await this.save()

  await TaskActivity.create({
    task: task._id,
    actor: this._id,
    action: 'created',
    meta: {
      title: task.title,
      requiredSkill: task.requiredSkill,
      difficulty: task.difficulty,
    },
  })

  await TaskActivity.create({
    task: task._id,
    actor: this._id,
    action: 'assigned',
    meta: {
      assigneeName: this.name,
    },
  })

  return task
}

employeeSchema.methods.completeTask = async function (task) {
  if (task.rejected) {
    throw new Error('Bu görev reddedilmiş.')
  }
  if (task.isCompleted) {
    throw new Error('Görev zaten onaylanmış.')
  }
  if (task.pendingApproval) {
    throw new Error('Görev zaten onay bekliyor.')
  }

  task.pendingApproval = true
  task.status = 'pending_approval'
  task.completionRequestedBy = this._id
  await task.save()

  await TaskActivity.create({
    task: task._id,
    actor: this._id,
    action: 'completion_requested',
    meta: {
      employeeName: this.name,
    },
  })

  console.log(`📋 ${this.name} "${task.title}" görevi için onay istedi.`.cyan)
}

employeeSchema.methods.approveTaskCompletion = async function (task) {
  const EmployeeModel = mongoose.model('Employee')

  if (task.rejected) {
    throw new Error('Bu görev reddedilmiş.')
  }
  if (!task.pendingApproval) {
    throw new Error('Bu görev onay beklemiyor.')
  }
  if (task.isCompleted) {
    throw new Error('Görev zaten onaylanmış.')
  }

  const submitterId = task.completionRequestedBy
  if (!submitterId) {
    throw new Error('Tamamlayan kaydı bulunamadı.')
  }

  if (submitterId.toString() === this._id.toString()) {
    throw new Error('Kendi tamamlama isteğinizi onaylayamazsınız.')
  }

  const submitter = await EmployeeModel.findById(submitterId)
  if (!submitter) {
    throw new Error('Tamamlayan çalışan bulunamadı.')
  }

  submitter.points += TASK_COMPLETION_APPROVAL_POINTS
  task.isCompleted = true
  task.pendingApproval = false
  task.status = 'completed'
  task.approvedBy = this._id
  task.approvedAt = new Date()

  submitter.tasks = submitter.tasks.filter(t => t.toString() !== task._id.toString())

  await task.save()
  await submitter.save()

  await PointTransaction.create({
    employee: submitter._id,
    task: task._id,
    type: 'task_approved',
    points: TASK_COMPLETION_APPROVAL_POINTS,
    description: `"${task.title}" görevi onaylandı.`,
  })

  await TaskActivity.create({
    task: task._id,
    actor: this._id,
    action: 'approved',
    meta: {
      approverName: this.name,
      submitterName: submitter.name,
    },
  })

  console.log(
    `✅ ${submitter.name} görev onaylandı (+${TASK_COMPLETION_APPROVAL_POINTS}). Onaylayan: ${this.name}`.green
  )
}

employeeSchema.methods.rejectTaskCompletion = async function (task, reason = '') {
  const EmployeeModel = mongoose.model('Employee')

  if (task.rejected) {
    throw new Error('Görev zaten reddedilmiş.')
  }
  if (!task.pendingApproval) {
    throw new Error('Bu görev onay beklemiyor.')
  }
  if (task.isCompleted) {
    throw new Error('Görev zaten onaylanmış.')
  }

  const submitterId = task.completionRequestedBy
  if (!submitterId) {
    throw new Error('Tamamlayan kaydı bulunamadı.')
  }

  if (submitterId.toString() === this._id.toString()) {
    throw new Error('Kendi tamamlama isteğinizi reddedemezsiniz.')
  }

  const submitter = await EmployeeModel.findById(submitterId)
  if (!submitter) {
    throw new Error('Tamamlayan çalışan bulunamadı.')
  }

  submitter.recordSkillRejection(task.requiredSkill)

  task.pendingApproval = false
  task.rejected = true
  task.status = 'rejected'
  task.rejectedBy = this._id
  task.rejectedAt = new Date()
  task.rejectionReason = reason || ''
  task.completionRequestedBy = null

  submitter.tasks = submitter.tasks.filter(t => t.toString() !== task._id.toString())

  await task.save()
  await submitter.save()

  await TaskActivity.create({
    task: task._id,
    actor: this._id,
    action: 'rejected',
    meta: {
      approverName: this.name,
      submitterName: submitter.name,
      reason: reason || '',
    },
  })

  console.log(`⛔ ${submitter.name} görev reddedildi. Reddeden: ${this.name}`.yellow)
}

employeeSchema.methods.helpPeer = async function (peer, opts = {}) {
  const { taskId } = opts

  this.points += HELPER_SUPPORT_POINTS
  peer.points += PEER_HELP_RECEIVED_POINTS

  let linkedTask = null

  if (taskId) {
    const TaskModel = mongoose.model('Task')
    const task = await TaskModel.findById(taskId)

    if (!task) {
      throw new Error('Yardım bağlanacak görev bulunamadı.')
    }

    const peerOnTask = task.assignees.some(a => a.toString() === peer._id.toString())
    if (!peerOnTask) {
      throw new Error('Yardım alan çalışan bu görevin assignees listesinde değil.')
    }

    task.helper = this._id
    task.helpEvents.push({
      helper: this._id,
      peer: peer._id,
      helperPoints: HELPER_SUPPORT_POINTS,
      peerPoints: PEER_HELP_RECEIVED_POINTS,
    })

    await task.save()
    linkedTask = task
  }

  await this.save()
  await peer.save()

  await PointTransaction.create({
    employee: this._id,
    task: linkedTask ? linkedTask._id : null,
    type: 'help_given',
    points: HELPER_SUPPORT_POINTS,
    description: `${this.name}, ${peer.name} kişisine yardım etti.`,
  })

  await PointTransaction.create({
    employee: peer._id,
    task: linkedTask ? linkedTask._id : null,
    type: 'help_received',
    points: PEER_HELP_RECEIVED_POINTS,
    description: `${peer.name}, ${this.name} tarafından destek aldı.`,
  })

  if (linkedTask) {
    await TaskActivity.create({
      task: linkedTask._id,
      actor: this._id,
      action: 'help_given',
      meta: {
        helperName: this.name,
        peerName: peer.name,
      },
    })
  }

  console.log(
    `🤝 ${this.name}, ${peer.name} kişisine yardım etti. (+${HELPER_SUPPORT_POINTS} Puan)`.cyan
  )
}

module.exports = mongoose.model('Employee', employeeSchema)