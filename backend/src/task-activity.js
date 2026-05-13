const mongoose = require('mongoose')
const { Schema } = mongoose

const taskActivitySchema = new Schema(
  {
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
    },
    actor: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      default: null,
    },
    action: {
      type: String,
      enum: ['created', 'assigned', 'help_given', 'completion_requested', 'approved', 'rejected'],
      required: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('TaskActivity', taskActivitySchema)