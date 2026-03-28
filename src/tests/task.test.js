const Task = require('../task');

describe('Task Model - Unit Tests', () => {
  test('report: title ve durum bilgisini göstermeli', () => {
    const task = new Task({
      title: 'UI Revizyonu',
      requiredSkill: 'JS',
      difficulty: 4,
      isCompleted: true,
      assignees: [],
      helper: null,
    });

    expect(task.report).toContain('UI Revizyonu');
    expect(task.report).toContain('Tamamlandı');
    expect(task.report).toContain('Termin');
  });

  test('report: atanan/helper yoksa varsayilan metinleri gostermeli', () => {
    const task = new Task({
      title: 'Arastirma',
      requiredSkill: 'Python',
      difficulty: 2,
      assignees: [],
      helper: null,
    });

    expect(task.report).toContain('Henüz atanan yok');
    expect(task.report).toContain('Yok');
    expect(task.report).toContain('Devam Ediyor');
    expect(task.report).toContain('Belirtilmedi');
  });

  test('isOverdue: termin geçmiş ve tamamlanmamışsa true', () => {
    const task = new Task({
      title: 'Geciken',
      requiredSkill: 'JS',
      difficulty: 1,
      isCompleted: false,
      dueAt: new Date('2000-01-01'),
      assignees: [],
      helper: null,
    });
    expect(task.isOverdue).toBe(true);
    expect(task.report).toContain('GECİKMİŞ');
  });

  test('isOverdue: tamamlandıysa veya termin yoksa false', () => {
    const done = new Task({
      title: 'Bitti',
      requiredSkill: 'JS',
      difficulty: 1,
      isCompleted: true,
      dueAt: new Date('2000-01-01'),
      assignees: [],
      helper: null,
    });
    expect(done.isOverdue).toBe(false);

    const noDue = new Task({
      title: 'Açık',
      requiredSkill: 'JS',
      difficulty: 1,
      isCompleted: false,
      assignees: [],
      helper: null,
    });
    expect(noDue.isOverdue).toBe(false);
  });

  test('report: reddedildi durumunu göstermeli', () => {
    const task = new Task({
      title: 'İptal',
      requiredSkill: 'JS',
      difficulty: 2,
      isCompleted: false,
      pendingApproval: false,
      rejected: true,
      assignees: [],
      helper: null,
    });
    expect(task.report).toContain('Reddedildi');
  });

  test('report: onay bekliyor durumunu göstermeli', () => {
    const task = new Task({
      title: 'İnceleme',
      requiredSkill: 'JS',
      difficulty: 2,
      isCompleted: false,
      pendingApproval: true,
      assignees: [],
      helper: null,
    });
    expect(task.report).toContain('Onay bekliyor');
  });
});
