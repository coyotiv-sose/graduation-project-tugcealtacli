class Employee {
  //constructor, bir çalışanın adını, ana becerisini ve beceri seviyesini alır.
  constructor(name, mainSkill, skillLevel) {
    this.name = name;
    //bu çalışanın adı
    this.mainSkill = mainSkill;
    this.skillLevel = skillLevel;
    this.points = 0;
    this.tasks = [];
    //this demek "şu an elimdeki çalışanın..." demektir. puanını da sıfırdan başlatıyoruz
  }
  //tuvia vizyonu : risk minimizasyonu
  canHandle(task) {
    if(task.requiredSkill !== this.mainSkill) {
      return false;
    }
    if(this.skillLevel < task.difficulty) {
     console.log(`${this.name} bu görevi üstlenemez, çünkü beceri seviyesi yeterli değil.`.yellow);
       return false;
    }
    return true;
  }
  completeTask(task) {
    this.points += 50;
    console.log(`${this.name} görevi tamamladı ve 50 puan kazandı.`.green);
  }
  helpPeer(peer){
    this.points += 20;//yardım eden
    peer.points += 5;//yardım alan
    console.log(`${this.name} bir meslektaşına yardım etti ve 20 puan kazandı. Yardım alan meslektaş ${peer.name} ise 5 puan kazandı.`.cyan);
  }
    set updatePoints(value) {
      throw new Error('Puanlar otonomdur, dışarıdan müdahale edilemez!');
    }
  }
  static create ({name, mainSkill, skillLevel}){
    const employee = new Employee(name, mainSkill, skillLevel);
    Employee.list.push(employee);
    return employee;
  }

  Employee.list = [];

module.exports = Employee;
//employee.js dosyasında bir kural kitabı yazdık
