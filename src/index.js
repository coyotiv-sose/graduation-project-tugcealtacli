class Task {
  constructor(name, requiredSkill, points = 50) {
    this.name = name;
    this.requiredSkill = requiredSkill; // Slayt Sayfa 4: Yetkinlik Bazlı Eşleşme
    this.points = points;               // Slayt Sayfa 8: Gamification (Ahmet: +50 Puan)
    this.status = "TODO";               // TODO -> IN_REVIEW -> DONE
    this.assignee = null;
    this.logs = [];                     // Slayt Sayfa 7: Dijital Ayak İzi
  }
}

class Employee {
  constructor(name, role, skills) {
    this.name = name;
    this.role = role;
    this.skills = skills; // ['Excel', 'React', 'Marketing'] gibi
    this.points = 0;      // Ana Puan Tablosu
  }

  // Slayt Sayfa 4: "Risk Minimizasyonu" ve "Yetkinlik Eşleşmesi"
  takeTask(task) {
    if (!this.skills.includes(task.requiredSkill)) {
      console.log(`❌ HATA: ${this.name}, '${task.name}' görevini alamaz. Eksik Yetkinlik: ${task.requiredSkill}`);
      return;
    }

    if (task.assignee && task.assignee !== this) {
        console.log(`⚠️ UYARI: Bu görev zaten ${task.assignee.name} üzerinde.`);
        return;
    }

    task.assignee = this;
    task.status = "IN_PROGRESS";
    console.log(`✅ ATAMA: ${this.name}, '${task.name}' görevini üstlendi. (Yetkinlik Eşleşti: ${task.requiredSkill})`);
  }

  // Slayt Sayfa 8: "Çapraz Kontrol Mekanizması" (Peer Review)
  // Çalışan işi bitirdiğinde puan hemen yatmaz, onaya düşer.
  completeTask(task) {
    if (task.assignee !== this) {
        console.log(`❌ HATA: ${this.name} bu görevin sahibi değil, tamamlayamaz.`);
        return;
    }

    task.status = "IN_REVIEW";
    console.log(`⏳ ONAY BEKLİYOR: ${this.name}, '${task.name}' görevini bitirdi. Yönetici onayı bekleniyor.`);
  }

  // Slayt Sayfa 8: "Yardımseverliğin Matematiği" (Support Points)
  helpColleague(task, helper) {
    if (task.status !== "IN_PROGRESS") {
        console.log(`ℹ️ Bu görev için şu an yardıma ihtiyaç yok.`);
        return;
    }

    // Yardım Puanı Hesabı: Ana puanın %40'ı (Slayttaki +20 puan örneği)
    const supportPoints = Math.floor(task.points * 0.4);
    helper.points += supportPoints;

    task.logs.push(`${helper.name} yardım etti (+${supportPoints} Destek Puanı)`);
    console.log(`🤝 İŞBİRLİĞİ: ${helper.name}, '${task.name}' görevine yardım etti ve +${supportPoints} Destek Puanı kazandı!`);
  }
}

class Manager extends Employee {
  // Slayt Sayfa 8: "Onay Mekanizması"
  approveTask(task) {
    if (task.status !== "IN_REVIEW") {
        console.log(`❌ Bu görev onay aşamasında değil.`)
        return;
    }

    task.status = "DONE";

    // Puanı asıl yapana veriyoruz
    const owner = task.assignee;
    owner.points += task.points;

    console.log(`\n🏆 GÖREV TAMAMLANDI (Onaylayan: ${this.name})`);
    console.log(`   --> ${owner.name}: +${task.points} Puan kazandı.`);
    console.log(`   --> Durum: ${task.status}`);
  }
}

// --- SENARYO (Slayt Sayfa 5 ve 8'deki Hikaye) ---

// 1. Karakterleri Oluştur
const tugce = new Manager("Tuğçe", "Head of Product", ["Management", "Product"]);
const mehmet = new Employee("Mehmet", "Marketing", ["Marketing", "Social Media"]); // Excel yeteneği YOK
const canan = new Employee("Canan", "Data Analyst", ["Excel", "Data"]);

// 2. Görev Oluştur (Bütçe Analizi)
const butceGorevi = new Task("Q3 Bütçe Analizi", "Excel", 50);

console.log("--- SENARYO BAŞLIYOR ---\n");

// 3. Mehmet görevi almaya çalışıyor (HATA VERMELİ - Yetkinlik Eşleşmesi)
mehmet.takeTask(butceGorevi);

// 4. Canan görevi alıyor (BAŞARILI)
canan.takeTask(butceGorevi);

// 5. Mehmet, Canan'a yardım ediyor (İŞBİRLİĞİ PUANI)
canan.helpColleague(butceGorevi, mehmet);

// 6. Canan işi bitiriyor (ONAY BEKLİYOR - Puan henüz yatmadı)
canan.completeTask(butceGorevi);

// 7. Tuğçe (Yönetici) işi onaylıyor (PUANLAR DAĞITILIYOR)
tugce.approveTask(butceGorevi);

// --- LİDERLİK TABLOSU ---
console.log("\n📊 GÜNCEL PUAN DURUMU");
console.log(`${canan.name}: ${canan.points} Puan`);
console.log(`${mehmet.name}: ${mehmet.points} Puan (Destek Puanı)`);
