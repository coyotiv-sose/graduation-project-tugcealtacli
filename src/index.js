/*const TaskReporter = require('./task-reporter'); // TaskReporter sınıfını kendi dosyasından çağırıyoruz burda.

console.log("RENK TEST".green);//denemee
require('colors');//renk için (npm install colors)
const Employee = require('./employee');
const Task = require('./task');//sınıfları kendi dosyalarından çağırdık
*/

const { default: axios } = require("axios")

//axios ile kullanıcıları getiririz.
axios.get('http://localhost:3000/users').then(response => {
console.log(response.data);
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
