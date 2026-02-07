const pluralize = require('pluralize');//çoğul yapma işlemi için (npm install pluralize yazdık terminale)
require('colors');
console.log("RENK TEST".green);
require('colors');//renk için (npm install colors)
const Employee = require('./employee');
const Task = require('./task');//sınıfları kendi dosyalarından çağırdık

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
const employeeText = pluralize('employee', count, true);
//console.log(`${productLaunchTask.title} projesinde ${employeeText} çalışıyor.`.magenta);--> burada sadece son satır renkli olur!!
//console.log(productLaunchTask.report.magenta);-->pluralize kütüphanesini eklemeden önce, yine raporun tamamı renkliyken.
console.log(`${productLaunchTask.report}\n${productLaunchTask.title} projesinde ${employeeText} çalışıyor.`.magenta);//böyle yapınca tüm rapor renkli oldu.
//console.log(productLaunchTask.report);-->normal rapor yazdırır, renkli değil.
