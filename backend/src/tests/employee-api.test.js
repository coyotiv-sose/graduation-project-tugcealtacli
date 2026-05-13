const request = require('supertest');
const Employee = require('../employee');

jest.mock('../database-connection', () => ({}));
jest.mock('../employee');
const app = require('../app');

describe('Employee API - Mocking Testleri', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /employees veritabanına bağlanmadan sahte veri dönmeli', async () => {
    
    const sahteCalisanlar = [
      {
        name: 'Tuğçe',
        mainSkill: 'Software',
        skillLevel: 5,
        tasks: [],
        skillRejections: [],
        activeWorkload: () => 0,
      },
    ];

    Employee.find.mockResolvedValue(sahteCalisanlar);

    const response = await request(app).get('/employees');

    expect(response.statusCode).toBe(200);
    expect(response.body[0].name).toBe('Tuğçe');
    expect(response.body[0].activeTaskCount).toBe(0);
    expect(Employee.find).toHaveBeenCalledTimes(1); 
  });
  test('POST /employees isteği ile yeni çalışan oluşturulabilmeli', async () => {
    
    const yeniCalisan = { name: 'Veli', mainSkill: 'Python', skillLevel: 3 };
   
    Employee.create.mockResolvedValue(yeniCalisan);

    const response = await request(app).post('/employees').send(yeniCalisan);

    expect(response.statusCode).toBe(200);
    expect(response.body.name).toBe('Veli');
    expect(Employee.create).toHaveBeenCalledTimes(1);
  });
  test('POST /employees/:name/tasks ile çalışana görev atanabilmeli', async () => {
    const mockEmployee = { 
      name: 'Canan', 
      canHandle: jest.fn().mockReturnValue(true),
      activeWorkload: jest.fn().mockReturnValue(0),
      createTask: jest.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        title: 'Tasarım',
        requiredSkill: 'JS',
        difficulty: 3,
        dueAt: new Date('2026-12-15'),
      }),
    };
    Employee.findOne.mockResolvedValue(mockEmployee);

    const response = await request(app).post('/employees/Canan/tasks').send({ title: 'Tasarım', requiredSkill: 'JS', difficulty: 3 });

    expect(response.statusCode).toBe(200);
    expect(response.body.title).toBe('Tasarım');
    expect(response.body.id).toBe('507f1f77bcf86cd799439011');
    expect(response.body.dueAt).toBe('2026-12-15T00:00:00.000Z');
    expect(mockEmployee.createTask).toHaveBeenCalledWith('Tasarım', 'JS', 3, undefined);
  });

  test('POST /employees/:name/tasks dueAt ile görev oluşturulabilmeli', async () => {
    const due = '2027-01-20T12:00:00.000Z';
    const mockEmployee = {
      name: 'Canan',
      canHandle: jest.fn().mockReturnValue(true),
      activeWorkload: jest.fn().mockReturnValue(0),
      createTask: jest.fn().mockResolvedValue({
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        title: 'Rapor',
        requiredSkill: 'JS',
        difficulty: 2,
        dueAt: new Date(due),
      }),
    };
    Employee.findOne.mockResolvedValue(mockEmployee);

    const response = await request(app)
      .post('/employees/Canan/tasks')
      .send({ title: 'Rapor', requiredSkill: 'JS', difficulty: 2, dueAt: due });

    expect(response.statusCode).toBe(200);
    expect(mockEmployee.createTask).toHaveBeenCalledWith('Rapor', 'JS', 2, due);
  });

  test('POST /employees/:name/tasks yetkinlik reddi limiti doluysa 400 dönmeli', async () => {
    const mockEmployee = {
      name: 'Canan',
      canHandle: jest.fn().mockReturnValue(true),
      activeWorkload: jest.fn().mockReturnValue(0),
      createTask: jest
        .fn()
        .mockRejectedValue(
          new Error(
            'Canan: "JS" yetkinliğinde çok fazla onay reddi kaydı var; Tuvia bu yetkinlikte yeni görev atamıyor.'
          )
        ),
    };
    Employee.findOne.mockResolvedValue(mockEmployee);

    const response = await request(app)
      .post('/employees/Canan/tasks')
      .send({ title: 'X', requiredSkill: 'JS', difficulty: 2 });

    expect(response.statusCode).toBe(400);
  });

  test('POST /employees/:name/tasks createTask dueAt hatası 400 dönmeli', async () => {
    const mockEmployee = {
      name: 'Canan',
      canHandle: jest.fn().mockReturnValue(true),
      activeWorkload: jest.fn().mockReturnValue(0),
      createTask: jest.fn().mockRejectedValue(new Error('dueAt geçersiz tarih formatında.')),
    };
    Employee.findOne.mockResolvedValue(mockEmployee);

    const response = await request(app)
      .post('/employees/Canan/tasks')
      .send({ title: 'X', requiredSkill: 'JS', difficulty: 2, dueAt: 'bozuk' });

    expect(response.statusCode).toBe(400);
  });

  test('GET /employees/leaderboard puana göre sıralı liste dönmeli', async () => {
    Employee.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { name: 'Canan', mainSkill: 'JS', skillLevel: 5, points: 100, activeWorkload: () => 2 },
        { name: 'Mehmet', mainSkill: 'Excel', skillLevel: 3, points: 20, activeWorkload: () => 0 },
      ]),
    });

    const response = await request(app).get('/employees/leaderboard');

    expect(response.statusCode).toBe(200);
    expect(response.body[0]).toEqual({
      rank: 1,
      name: 'Canan',
      mainSkill: 'JS',
      skillLevel: 5,
      points: 100,
      activeTaskCount: 2,
    });
    expect(response.body[1].rank).toBe(2);
  });

  test('POST /employees/:helper/help/:peer yardım puanlarını güncellemeli', async () => {
    const peer = { name: 'Mehmet', points: 0, save: jest.fn().mockResolvedValue({}) };
    const helper = {
      name: 'Canan',
      points: 10,
      helpPeer: jest.fn().mockImplementation(async function help(h) {
        this.points = 30;
        h.points = 5;
      }),
    };

    Employee.findOne.mockImplementation(({ name }) => {
      if (name === 'Canan') return helper;
      if (name === 'Mehmet') return peer;
      return null;
    });

    const response = await request(app).post('/employees/Canan/help/Mehmet');

    expect(response.statusCode).toBe(200);
    expect(response.body.helper.points).toBe(30);
    expect(response.body.peer.points).toBe(5);
    expect(helper.helpPeer).toHaveBeenCalledWith(peer, {});
  });
  test('POST /employees/:name/tasks çalışan yoksa 404 dönmeli', async () => {
    Employee.findOne.mockResolvedValue(null);

    const response = await request(app).post('/employees/Bilinmeyen/tasks').send({
      title: 'Görev',
      requiredSkill: 'JS',
      difficulty: 2
    });

    expect(response.statusCode).toBe(404);
    expect(Employee.findOne).toHaveBeenCalledTimes(1);
  });
  test('POST /employees/:name/tasks aktif görev limiti doluysa 400 dönmeli', async () => {
    const mockEmployee = {
      name: 'Canan',
      canHandle: jest.fn().mockReturnValue(true),
      activeWorkload: jest.fn().mockReturnValue(5),
      createTask: jest.fn(),
    };
    Employee.findOne.mockResolvedValue(mockEmployee);

    const response = await request(app).post('/employees/Canan/tasks').send({
      title: 'Yeni',
      requiredSkill: 'JS',
      difficulty: 2,
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toContain('aktif görev limiti');
    expect(mockEmployee.createTask).not.toHaveBeenCalled();
  });

  test('POST /employees/:name/tasks çalışan uygun değilse 400 dönmeli', async () => {
    const mockEmployee = {
      name: 'Canan',
      canHandle: jest.fn().mockReturnValue(false),
      activeWorkload: jest.fn().mockReturnValue(0),
      createTask: jest.fn(),
    };
    Employee.findOne.mockResolvedValue(mockEmployee);

    const response = await request(app).post('/employees/Canan/tasks').send({
      title: 'Zor Görev',
      requiredSkill: 'JS',
      difficulty: 5
    });

    expect(response.statusCode).toBe(400);
    expect(mockEmployee.createTask).not.toHaveBeenCalled();
  });

});