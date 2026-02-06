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
console.log(productLaunchTask.report);
