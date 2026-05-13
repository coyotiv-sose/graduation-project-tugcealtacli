const mongoose = require('mongoose');
require('../task');
const Employee = require('../employee');

describe('Employee Model - Unit Tests', () => {
  
  test('canHandle: Yetkinlikler eşleşiyor ve seviye yetiyorsa TRUE dönmeli', () => {
    const canan = new Employee({ name: 'Canan', mainSkill: 'JS', skillLevel: 5 });
    const gorev = { requiredSkill: 'JS', difficulty: 3 };
    const sonuc = canan.canHandle(gorev);
    expect(sonuc).toBe(true);
  });

  test('canHandle: Yetkinlik (mainSkill) uyuşmuyorsa FALSE dönmeli', () => {
    const mehmet = new Employee({ name: 'Mehmet', mainSkill: 'Node.js', skillLevel: 4 });
    const gorev = { requiredSkill: 'JS', difficulty: 3 }; 
    const sonuc = mehmet.canHandle(gorev);
    expect(sonuc).toBe(false);
  });

  test('canHandle: Yetkinlik uysa bile beceri seviyesi yetersizse FALSE dönmeli', () => {
    const stajyer = new Employee({ name: 'Ali', mainSkill: 'Excel', skillLevel: 2 });
    const zorGorev = { requiredSkill: 'Excel', difficulty: 4 };
    const sonuc = stajyer.canHandle(zorGorev);
    expect(sonuc).toBe(false);
  });
  test('completeTask: onay isteği oluşturur, puan vermez', async () => {
    const oid = new mongoose.Types.ObjectId();
    const canan = new Employee({ _id: oid, name: 'Canan', mainSkill: 'JS', skillLevel: 5, points: 0, tasks: [] });
    const gorev = {
      _id: '123',
      title: 'Test',
      isCompleted: false,
      pendingApproval: false,
      save: jest.fn().mockResolvedValue({}),
    };

    await canan.completeTask(gorev);

    expect(canan.points).toBe(0);
    expect(gorev.pendingApproval).toBe(true);
    expect(gorev.completionRequestedBy.toString()).toBe(oid.toString());
    expect(gorev.isCompleted).toBe(false);
    expect(gorev.save).toHaveBeenCalled();
  });

  test('approveTaskCompletion: başka çalışan onaylayınca +50 ve görev kapanır', async () => {
    const submitterId = new mongoose.Types.ObjectId();
    const approverId = new mongoose.Types.ObjectId();
    const taskId = new mongoose.Types.ObjectId();

    const submitter = new Employee({
      _id: submitterId,
      name: 'S',
      mainSkill: 'JS',
      skillLevel: 5,
      points: 0,
      tasks: [taskId],
    });
    submitter.save = jest.fn().mockResolvedValue({});

    const approver = new Employee({
      _id: approverId,
      name: 'A',
      mainSkill: 'JS',
      skillLevel: 5,
      points: 0,
      tasks: [],
    });

    const task = {
      _id: taskId,
      title: 'T',
      pendingApproval: true,
      isCompleted: false,
      completionRequestedBy: submitterId,
      save: jest.fn().mockResolvedValue({}),
    };

    const findByIdSpy = jest.spyOn(Employee, 'findById').mockResolvedValue(submitter);

    try {
      await approver.approveTaskCompletion(task);

      expect(submitter.points).toBe(50);
      expect(task.isCompleted).toBe(true);
      expect(task.pendingApproval).toBe(false);
      expect(submitter.tasks).toHaveLength(0);
      expect(task.save).toHaveBeenCalled();
      expect(submitter.save).toHaveBeenCalled();
    } finally {
      findByIdSpy.mockRestore();
    }
  });

  test('approveTaskCompletion: tamamlayan kendisi onaylayamaz', async () => {
    const sameId = new mongoose.Types.ObjectId();
    const emp = new Employee({ _id: sameId, name: 'X', mainSkill: 'JS', skillLevel: 5 });
    const task = {
      pendingApproval: true,
      isCompleted: false,
      completionRequestedBy: sameId,
      save: jest.fn(),
    };

    await expect(emp.approveTaskCompletion(task)).rejects.toThrow('onaylayamazsınız');
  });
  test('activeWorkload: tamamlanmamış görevleri sayar', () => {
    expect(
      Employee.prototype.activeWorkload.call({
        tasks: [{ isCompleted: false }, { isCompleted: true }],
      })
    ).toBe(1);
  });

  test('activeWorkload: populate edilmemiş görev id sayısı aktif sayılır', () => {
    expect(Employee.prototype.activeWorkload.call({ tasks: ['id1', 'id2'] })).toBe(2);
  });

  test('activeWorkload: görev yoksa 0', () => {
    expect(Employee.prototype.activeWorkload.call({ tasks: [] })).toBe(0);
    expect(Employee.prototype.activeWorkload.call({})).toBe(0);
  });

  test('createTask: yetkinlik reddi limiti doluysa atama yapmaz', async () => {
    const emp = new Employee({
      name: 'Riskli',
      mainSkill: 'JS',
      skillLevel: 5,
      skillRejections: [{ requiredSkill: 'JS', count: 2 }],
    });
    emp.save = jest.fn().mockResolvedValue({});

    await expect(emp.createTask('Yeni', 'JS', 2)).rejects.toThrow('reddi kaydı');
  });

  test('activeWorkload: reddedilmiş görev sayılmaz', () => {
    expect(
      Employee.prototype.activeWorkload.call({
        tasks: [
          { isCompleted: false, rejected: false },
          { isCompleted: false, rejected: true },
        ],
      })
    ).toBe(1);
  });

  test('createTask: geçersiz dueAt hata vermeli', async () => {
    const emp = new Employee({ name: 'X', mainSkill: 'JS', skillLevel: 5 });
    emp.save = jest.fn().mockResolvedValue({});

    await expect(emp.createTask('T', 'JS', 2, 'gecersiz-tarih')).rejects.toThrow('dueAt');
  });

  test('helpPeer: Yardım edene 20, edilene 5 puan eklenmeli', async () => {
    const canan = new Employee({ name: 'Canan', points: 10 });
    const mehmet = new Employee({ name: 'Mehmet', points: 0 });
    canan.save = jest.fn(); 
    mehmet.save = jest.fn();
  
    await canan.helpPeer(mehmet);
  
    expect(canan.points).toBe(30);
    expect(mehmet.points).toBe(5);
  });
});