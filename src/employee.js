class Employee {
  //constructor, bir çalışanın adını, ana becerisini ve beceri seviyesini alır.
  constructor(name, mainSkill, skillLevel) {
    this.name = name;
    //bu çalışanın adı
    this.mainSkill = mainSkill;
    this.skillLevel = skillLevel;
    this.points = 0;
    //this demek "şu an elimdeki çalışanın..." demektir. puanını da sıfırdan başlatıyoruz
  }

    set updatePoints(value) {
    throw new Error('Puanlar otonomdur, dışarıdan müdahale edilemez!');
    //dışarıdan gelip çalışanın puanını elle değişme kalkan olursa ona engel ol ve hata fırlat.
  }
}

module.exports = Employee;
//emploee.js dosyasında bir kural kitabı yazdık. ama index.js bu kuralları bilemez. bu yüzden module.exports ile Employee sınıfını dışarıya açtık. index.js dosyasında bu sınıfı kullanarak çalışanlarımızı oluşturacağız.zmasaık departmanlar arası iletişim kopukluğu olmuş olurdu.
//
