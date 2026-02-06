class Task {
  //hocanın projesindeki picnic sınıfına denk= task sınıfı
  constructor(title, requiredSkill) {
    //başlığı ve gereken yeteneği (o iş için gereken yetkinlikten söz ediyoruz)parametre olarak alır
    this.title = title; // Görevin adı
    this.requiredSkill = requiredSkill; // Görev için gereken yeteneği dosyaya işler
    this.assignees = []; // Göreve atanan çalışanlar listesi(boş liste)(hocanın projesinde pikniğe katılanları this.attendees içinde tutması gibi)
    this.helper = null; // Yardım eden gizli kahraman(henüz kimse yok(boş))
    this.isCompleted = false; // İş bitti mi?-false=hayır bitmedi, true=evet bitti
  }

  get report() {
    //raporlama (getter) yapıyoruz,get metodu bir fonksiyon gibi değil, bir özellik gibi kullanılır. Bu rapor, görevin durumunu ve atanan ekip üyelerini gösterir.
    return `
# Tuvia Görev Raporu: ${this.title}
## Durum: ${this.isCompleted ? '[x] Tamamlandı' : '[ ] Devam Ediyor'}
Atanan Ekip: ${this.assignees.map(a => a.name).join(', ')}
//.map(a => a.name)= bize sadece ismi ver, detaylar kalsın. .join(', ')= isimleri virgülle ayır
${this.helper ? `Destek Veren: ${this.helper.name} (+20 Puan)` : 'Yardım bekleniyor...'}
//bu görevin bir yardımıcısı var mı diye sorar eğer varsa ismini ve 20 puan ekler, yoksa yardım bekleniyor yazar
`;
  }
}

module.exports = Task; // Bu sınıfı diğer dosyaların kullanımına açıyoruz
//çıkış kapısı denebilir. task kalıbını paketler.
