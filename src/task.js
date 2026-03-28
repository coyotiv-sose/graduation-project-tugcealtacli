/* class Task {
  // hocanın projesindeki picnic sınıfına denk= task sınıfı
  constructor(title, requiredSkill, difficulty) {
    // başlığı ve gereken yeteneği (o iş için gereken yetkinlikten söz ediyoruz)parametre olarak alır
    this.title = title // Görevin adı
    this.requiredSkill = requiredSkill // Görev için gereken yeteneği dosyaya işler
    this.assignees = [] // Göreve atanan çalışanlar listesi(boş liste)(hocanın projesinde pikniğe katılanları this.attendees içinde tutması gibi)
    this.helper = null // Yardım eden gizli kahraman(henüz kimse yok(boş))
    this.isCompleted = false // İş bitti mi?-false=hayır bitmedi, true=evet bitti
    this.difficulty = difficulty // Görev zorluğu
  }
  // tüm görevleri tutacak bir liste oluşturduk
  static list = []
  static create({ title, requiredSkill, difficulty }) {
    const task = new Task(title, requiredSkill, difficulty)
    Task.list.push(task)
    return task
  }
  get report() {
    // raporlama
    return `
# Tuvia Görev Raporu: ${this.title}
Zorluk    : ${this.difficulty}/5
Durum     : ${this.isCompleted ? ' Tamamlandı' : 'Devam Ediyor'}
Ekip      : ${this.assignees.map(a => a.name).join(', ')}
${this.helper ? `Destek    : ${this.helper.name} (+20 Puan)` : 'Destek    : -'}
--------------------------
`
  }
}
module.exports = Task
*/
const mongoose = require('mongoose')
const autopopulate = require('mongoose-autopopulate')
const { HELPER_SUPPORT_POINTS } = require('./constants')

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    requiredSkill: { type: String, required: true },
    difficulty: { type: Number, required: true },
    isCompleted: { type: Boolean, default: false },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', autopopulate: { maxDepth: 1 } }],
    helper: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null, autopopulate: { maxDepth: 1 } },
    createdBy: { type: mongoose.Schema.Types.ObjectId,ref: 'Employee', default: null ,  autopopulate: {maxDepth: 1}},
    dueAt: { type: Date, default: null },
    pendingApproval: { type: Boolean, default: false },
    completionRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      autopopulate: { maxDepth: 1 },
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      autopopulate: { maxDepth: 1 },
    },
    approvedAt: { type: Date, default: null },
    rejected: { type: Boolean, default: false },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      autopopulate: { maxDepth: 1 },
    },
    rejectedAt: { type: Date, default: null },
    rejectionReason: { type: String, default: '' },
    helpEvents: [
      {
        helper: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        peer: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
        helperPoints: { type: Number, required: true },
        peerPoints: { type: Number, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)
taskSchema.plugin(autopopulate)
taskSchema.virtual('isOverdue').get(function () {
  if (this.isCompleted || this.rejected || !this.dueAt) return false
  return this.dueAt < new Date()
})
taskSchema.virtual('report').get(function () {
  const assigneeNames =
    this.assignees && this.assignees[0] && this.assignees[0].name
      ? this.assignees.map(a => a.name).join(', ')
      : 'Henüz atanan yok'
  const destekSatir =
    this.helper && this.helper.name
      ? `${this.helper.name} (+${HELPER_SUPPORT_POINTS} Puan)`
      : 'Yok'
  let dueLine = 'Termin    : Belirtilmedi'
  if (this.dueAt) {
    dueLine = `Termin    : ${this.dueAt.toISOString()}`
    if (this.isOverdue) {
      dueLine += ' (GECİKMİŞ)'
    }
  }
  let durumSatir = 'Devam Ediyor'
  if (this.isCompleted) {
    durumSatir = ' Tamamlandı'
  } else if (this.rejected) {
    durumSatir = ' Reddedildi'
  } else if (this.pendingApproval) {
    durumSatir = ' Onay bekliyor'
  }
  return `
# Tuvia Görev Raporu: "${this.title}"
Zorluk    : ${this.difficulty}/5
Durum     : ${durumSatir}
${dueLine}
Ekip      : ${assigneeNames}
Destek    : ${destekSatir}
--------------------------
`
})
module.exports = mongoose.model('Task', taskSchema)
// const Task = mongoose.model('Task', taskSchema)
