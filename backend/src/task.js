const mongoose = require('mongoose')
const autopopulate = require('mongoose-autopopulate')
const { HELPER_SUPPORT_POINTS } = require('./constants')

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 2 },
    requiredSkill: { type: String, required: true, trim: true },
    difficulty: { type: Number, required: true, min: 1, max: 5 },

    status: {
      type: String,
      enum: ['open', 'pending_approval', 'completed', 'rejected', 'blocked'],
      default: 'open',
    },

    isCompleted: { type: Boolean, default: false },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee', autopopulate: { maxDepth: 1 } }],
    helper: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null, autopopulate: { maxDepth: 1 } },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
      autopopulate: { maxDepth: 1 },
    },
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
  if (this.status === 'completed' || this.isCompleted) {
    durumSatir = 'Tamamlandı'
  } else if (this.status === 'rejected' || this.rejected) {
    durumSatir = 'Reddedildi'
  } else if (this.status === 'pending_approval' || this.pendingApproval) {
    durumSatir = 'Onay bekliyor'
  } else if (this.status === 'blocked') {
    durumSatir = 'Bloke'
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