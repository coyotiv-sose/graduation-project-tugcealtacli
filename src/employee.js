const mongoose = require('mongoose')
const colors = require('colors') // Renkler için bunu eklemelisin (npm install colors)
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
    tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
  },
  { timestamps: true }
)

employeeSchema.methods.canHandle = function (taskRequirements) {
  if (taskRequirements.requiredSkill !== this.mainSkill) {
    console.log(`❌ ${this.name} bu görevi alamaz. (Yetkinlik Uyuşmazlığı)`.red)
    return false
  }
  if (this.skillLevel < taskRequirements.difficulty) {
    console.log(`${this.name} bu görevi üstlenemez, beceri seviyesi yeterli değil.`.yellow)
    return false
  }
  return true
}
employeeSchema.methods.createTask = async function (title, requiredSkill, difficulty) {
  const Task = mongoose.model('Task')
  const task = await Task.create({ title, requiredSkill, difficulty })
  this.tasks.push(task)
  await this.save()
  return task
}
employeeSchema.methods.completeTask = async function (task) {
  this.points += 50
  task.isCompleted = true
  await task.save()
  await this.save()
  console.log(`✅ ${this.name} "${task.title}" görevini tamamladı: +50 Puan!`.green)
}
employeeSchema.methods.helpPeer = async function (peer) {
  this.points += 20
  peer.points += 5
  await this.save()
  await peer.save()
  console.log(`🤝 ${this.name}, ${peer.name} kişisine yardım etti. (+20 Puan)`.cyan)
}
employeeSchema.path('points').set(function (v) {
  if (this._isValidating) return v
  throw new Error('Puanlar otonomdur, dışarıdan müdahale edilemez!')
})

module.exports = mongoose.model('Employee', employeeSchema)
