class Task {
  // hocanın projesindeki picnic sınıfına denk= task sınıfı
  constructor(title, requiredSkill, difficulty) {
    // başlığı ve gereken yeteneği (o iş için gereken yetkinlikten söz ediyoruz)parametre olarak alır
    this.title = title // Görevin adı
    this.requiredSkill = requiredSkill // Görev için gereken yeteneği dosyaya işler
    this.assignees = [] // Göreve atanan çalışanlar listesi(boş liste)(hocanın projesinde pikniğe katılanları this.attendees içinde tutması gibi)
    this.helper = null // Yardım eden gizli kahraman(henüz kimse yok(boş))
    this.isCompleted = false // İş bitti mi?-false=hayır bitmedi, true=evet bitti
    this.difficulty = difficulty // Görev zorluğu
  }

  // tüm görevleri tutacak bir liste oluşturduk
  static list = []

  static create({ title, requiredSkill, difficulty }) {
    const task = new Task(title, requiredSkill, difficulty)
    Task.list.push(task)
    return task
  }

  get report() {
    // raporlama
    return `
# Tuvia Görev Raporu: ${this.title}
Zorluk    : ${this.difficulty}/5
Durum     : ${this.isCompleted ? ' Tamamlandı' : 'Devam Ediyor'}
Ekip      : ${this.assignees.map(a => a.name).join(', ')}
${this.helper ? `Destek    : ${this.helper.name} (+20 Puan)` : 'Destek    : -'}
--------------------------
`
  }
}

module.exports = Task // Bu sınıfı diğer dosyaların kullanımına açıyoruz
// çıkış kapısı denebilir. task kalıbını paketler.
