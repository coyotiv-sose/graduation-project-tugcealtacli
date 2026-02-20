const colors = require('colors') // Renkler için bunu eklemelisin (npm install colors)
const Task = require('./task')

class Employee {
  constructor(name, mainSkill, skillLevel) {
    this.name = name
    this.mainSkill = mainSkill
    this.skillLevel = skillLevel
    this.points = 0
    this.tasks = []
    //çalışanın kendi görevlerini oluşturması ve kişisel listesine eklemesi için
    createTask(title, requiredSkill, difficulty) {
      const task = Task.create({title, requiredSkill, difficulty})
      this.tasks.push(task)
      return task

   }
  }

  // Tuvia Vizyonu: Risk Minimizasyonu
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

  /*
  static create({ name, mainSkill, skillLevel }) {
    const employee = new Employee(name, mainSkill, skillLevel)
    Employee.list.push(employee)
    return employee
  }
    */
  static create(employeeObj) {
    console.log('Creating a new employee', employeeObj)
    const employee = new Employee(employeeObj.name, employeeObj.mainSkill, employeeObj.skillLevel);
    Employee.list.push(employee)
    return employee
  }
}
Employee.list = []
module.exports = Employee
