const mongoose = require('mongoose')
const {
  HELPER_SUPPORT_POINTS,
  PEER_HELP_RECEIVED_POINTS,
  TASK_COMPLETION_APPROVAL_POINTS,
} = require('./constants')
const colors = require('colors') // Renkler için bunu eklemelisin (npm install colors yaptık)
const autopopulate = require('mongoose-autopopulate') // Otomatik populate için (npm install mongoose-autopopulate yaptık)
/* const Task = require('./task')

class Employee {
  constructor(name, mainSkill, skillLevel) {
    this.name = name
    this.mainSkill = mainSkill
    this.skillLevel = skillLevel
    this.points = 0
    this.tasks = []
  }

  // çalışanın kendi görevlerini oluşturması ve kişisel listesine eklemesi için
  createTask(title, requiredSkill, difficulty) {
    const task = Task.create({ title, requiredSkill, difficulty })
    this.tasks.push(task)
    return task
  }

  canHandle(task) {
    if (task.requiredSkill !== this.mainSkill) {
      console.log(`❌ ${this.name} bu görevi alamaz. (Yetkinlik Uyuşmazlığı)`.red)
      return false
    }
    if (this.skillLevel < task.difficulty) {
      console.log(`${this.name} bu görevi üstlenemez, çünkü beceri seviyesi yeterli değil.`.yellow)
      return false
    }
    return true
  }

  completeTask(task) {
    this.points += 50 // Görevi tamamlayan
    console.log(`✅ ${this.name} "${task.title}" görevini tamamladı: +50 Puan!`.green)
  }

  helpPeer(peer) {
    this.points += 20 // Yardım eden
    peer.points += 5 // Yardım alan
    console.log(`🤝 ${this.name}, ${peer.name} kişisine yardım etti. (+20 Puan)`.cyan)
  }

  set updatePoints(value) {
    throw new Error('Puanlar otonomdur, dışarıdan müdahale edilemez!')
  }

  static create(employeeObj) {
    console.log('Creating a new employee', employeeObj)
    const employee = new Employee(employeeObj.name, employeeObj.mainSkill, employeeObj.skillLevel)
    Employee.list.push(employee)
    return employee
  }
}

Employee.list = []
module.exports = Employee
*/
const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    mainSkill: { type: String, required: true },
    skillLevel: { type: Number, required: true },
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
employeeSchema.plugin(autopopulate)
// eslint-disable-next-line func-names
employeeSchema.methods.canHandle = function (taskRequirements) {
  if (taskRequirements.requiredSkill.toLowerCase() !== this.mainSkill.toLowerCase()) {
    console.log(`❌ ${this.name} bu görevi alamaz. (Yetkinlik Uyuşmazlığı)`.red)
    return false
  }
  if (this.skillLevel < taskRequirements.difficulty) {
    console.log(`${this.name} bu görevi üstlenemez, beceri seviyesi yeterli değil.`.yellow)
    return false
  }
  return true
}
// eslint-disable-next-line func-names
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
  task.completionRequestedBy = this._id
  await task.save()
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
  // eslint-disable-next-line no-param-reassign
  task.isCompleted = true
  // eslint-disable-next-line no-param-reassign
  task.pendingApproval = false
  // eslint-disable-next-line no-param-reassign
  task.approvedBy = this._id
  // eslint-disable-next-line no-param-reassign
  task.approvedAt = new Date()
  submitter.tasks = submitter.tasks.filter(t => t.toString() !== task._id.toString())
  await task.save()
  await submitter.save()
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
  // eslint-disable-next-line no-param-reassign
  task.pendingApproval = false
  // eslint-disable-next-line no-param-reassign
  task.rejected = true
  // eslint-disable-next-line no-param-reassign
  task.rejectedBy = this._id
  // eslint-disable-next-line no-param-reassign
  task.rejectedAt = new Date()
  // eslint-disable-next-line no-param-reassign
  task.rejectionReason = reason || ''
  // eslint-disable-next-line no-param-reassign
  task.completionRequestedBy = null
  submitter.tasks = submitter.tasks.filter(t => t.toString() !== task._id.toString())
  await task.save()
  await submitter.save()
  console.log(`⛔ ${submitter.name} görev reddedildi. Reddeden: ${this.name}`.yellow)
}
employeeSchema.methods.helpPeer = async function (peer, opts = {}) {
  const { taskId } = opts
  this.points += HELPER_SUPPORT_POINTS
  // eslint-disable-next-line no-param-reassign
  peer.points += PEER_HELP_RECEIVED_POINTS

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
  }

  await this.save()
  await peer.save()
  console.log(
    `🤝 ${this.name}, ${peer.name} kişisine yardım etti. (+${HELPER_SUPPORT_POINTS} Puan)`.cyan
  )
}
/* employeeSchema.path('points').set(function (v) {
  // eslint-disable-next-line no-underscore-dangle
  if (this._isValidating) return v
  throw new Error('Puanlar otonomdur, dışarıdan müdahale edilemez!')
})
  */

module.exports = mongoose.model('Employee', employeeSchema)
