/* const TaskReporter = require('./task-reporter'); // TaskReporter sınıfını kendi dosyasından çağırıyoruz burda.
architecture
console.log("RENK TEST".green);//denemee
require('colors');//renk için (npm install colors)
*/
const axios = require('axios'); // axios kütüphanesini ekledik (npm install axios)
const Employee = require('./employee');
// const Task = require('./task');//sınıfları kendi dosyalarından çağırdık
// fetch employees with axios
// axios.get('http://localhost:4000/employees').then(response => {
//  console.log(response.data)
// })
// const { default: axios } = require("axios")
// axios ile çalışanları getiririz.
async function main() {
  try {
    const canan = await axios.post('http://localhost:3000/employees', {
      name: 'Canan',
    });
    // .then(response => {
    console.log(canan.data);

    const mehmet = await axios.post('http://localhost:3000/employees', {
      name: 'Mehmet',
    });
    console.log(canan.data);
    console.log(mehmet.data);
    const allEmployees = await axios.get('http://localhost:3000/employees');

    console.log('List of all employees:', allEmployees.data);
    await axios.post('http://localhost:3000/employees/Canan/tasks', {
      title: 'Arayüz',
      requiredSkill: 'JS',
      difficulty: 'Orta',
    });
    await axios.post('http://localhost:3000/employees/Mehmet/tasks', {
      title: 'Backend',
      requiredSkill: 'Node.js',
      difficulty: 'Zor',
    });
    const newTask = await axios.get('http://localhost:3000/tasks', {
      title: 'Bütçe Analizi',
      requiredSkill: 'Excel',
      difficulty: 'Zor',
    });
    console.log('Yeni oluşturulan görev:', newTask.data);
    const allTasks = await axios.get('http://localhost:3000/tasks');
    console.log('Tüm görevlerin listesi:', allTasks.data);
  } catch (error) {
    console.error('Error occurred:', error.message);
  }
}
// hata yakalama
main();
/*
// Çalışanları oluştururuz (mesela Canan ve Mehmet olsun)
const canan = new Employee('Canan', 'Excel', 98);
const mehmet = new Employee('Mehmet', 'Excel', 40);

// Görevi tanımladık
const productLaunchTask = new Task('Q3 Bütçe Analizi', 'Excel');

// İş akışını simüle ettik
productLaunchTask.assignees.push(mehmet);//mehmeti ekibe dahil ettik
productLaunchTask.helper = canan; // Canan yardıma gelir
productLaunchTask.isCompleted = true; // İş biter

// Final raporunu yazdırıyoruz.patron bunu görecek
//console.log(productLaunchTask.report); // raporu siyah normal yazdırır
const count = productLaunchTask.assignees.length;
//const employeeText = pluralize('employee', count, true);
//console.log(`${productLaunchTask.title} projesinde ${employeeText} çalışıyor.`.magenta);--> burada sadece son satır renkli olur!!
//console.log(productLaunchTask.report.magenta);-->pluralize kütüphanesini eklemeden önce, yine raporun tamamı renkliyken.
//console.log(`${productLaunchTask.report}\n${productLaunchTask.title} projesinde ${employeeText} çalışıyor.`.magenta);//böyle yapınca tüm rapor renkli oldu.
//console.log(productLaunchTask.report);-->normal rapor yazdırır, renkli değil.
TaskReporter.printFullReport(productLaunchTask);//task-reporter.js dosyasındaki printFullReport fonksiyonunu çağırıp raporu renkli bir şekilde yazrırıyoruz
*/
