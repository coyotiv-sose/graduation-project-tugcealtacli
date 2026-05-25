const mongoose = require('mongoose')
const { Schema } = mongoose

const pointTransactionSchema = new Schema(
  {
    employee: {
      type: Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      default: null,
    },
    type: {
      type: String,
      // İŞTE HATAYI ÇÖZEN EKLEME BURADA:
      enum: ['task_completion', 'help_bonus', 'manual', 'task_approved'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('PointTransaction', pointTransactionSchema)