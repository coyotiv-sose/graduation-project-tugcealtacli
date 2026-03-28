const request = require('supertest');
const Employee = require('../employee');
const Task = require('../task');

jest.mock('../database-connection', () => ({}));
jest.mock('../employee');
jest.mock('../task');
const app = require('../app');

describe('Index Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET / demo görevi yoksa boş durum mesajı dönmeli', async () => {
    Task.findOne.mockResolvedValue(null);

    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('Henüz demo verisi yok');
    expect(Task.findOne).toHaveBeenCalledWith({ title: 'Bütçe Analizi' });
    expect(Employee.deleteMany).not.toHaveBeenCalled();
  });

  test('GET / mevcut görevi silmeden rapor göstermeli', async () => {
    const gorev = { _id: 't1' };
    Task.findOne.mockResolvedValue(gorev);
    Task.findById.mockResolvedValue({
      report: '# Tuvia Görev Raporu: test',
    });
    Employee.find.mockResolvedValue([{ name: 'Canan', points: 0 }]);

    const response = await request(app).get('/');

    expect(response.statusCode).toBe(200);
    expect(response.text).toContain('TUVIA SİMÜLASYON RAPORU');
    expect(response.text).toContain('Mevcut veritabanı durumu');
    expect(Task.findById).toHaveBeenCalledWith('t1');
    expect(Employee.deleteMany).not.toHaveBeenCalled();
    expect(Employee.find).toHaveBeenCalledTimes(1);
  });

  test('GET / hata olursa 500 dönmeli', async () => {
    Task.findOne.mockRejectedValue(new Error('db failed'));

    const response = await request(app).get('/');

    expect(response.statusCode).toBe(500);
    expect(response.text).toContain('Bir hata oluştu');
  });

  test('POST /demo/seed veritabanını sıfırlayıp simülasyon çalıştırmalı', async () => {
    Employee.deleteMany.mockResolvedValue({});
    Task.deleteMany.mockResolvedValue({});

    const gorev = {
      _id: 't1',
      requiredSkill: 'Excel',
      difficulty: 4,
      assignees: [],
      save: jest.fn().mockResolvedValue({}),
    };

    const canan = {
      _id: 'e1',
      name: 'Canan',
      mainSkill: 'Excel',
      skillLevel: 5,
      tasks: [],
      canHandle: jest.fn().mockReturnValue(true),
      isBlockedForSkill: jest.fn().mockReturnValue(false),
      activeWorkload: jest.fn().mockReturnValue(0),
      save: jest.fn().mockResolvedValue({}),
    };
    const mehmet = {
      _id: 'e2',
      name: 'Mehmet',
      mainSkill: 'Excel',
      skillLevel: 2,
      tasks: [],
      canHandle: jest.fn().mockReturnValue(false),
      isBlockedForSkill: jest.fn().mockReturnValue(false),
      activeWorkload: jest.fn().mockReturnValue(0),
      save: jest.fn().mockResolvedValue({}),
    };

    Employee.create.mockResolvedValue({});
    Task.create.mockResolvedValue(gorev);
    Employee.find.mockResolvedValue([canan, mehmet]);
    Task.findById.mockResolvedValue({
      report: '# Tuvia Görev Raporu: seed',
    });

    const response = await request(app).post('/demo/seed');

    expect(response.statusCode).toBe(201);
    expect(response.text).toContain('TUVIA SİMÜLASYON RAPORU');
    expect(Task.findById).toHaveBeenCalledWith('t1');
    expect(Employee.deleteMany).toHaveBeenCalledTimes(1);
    expect(Task.deleteMany).toHaveBeenCalledTimes(1);
    expect(Employee.find).toHaveBeenCalledTimes(2);
  });

  test('POST /demo/seed sırasında hata olursa 500 dönmeli', async () => {
    Employee.deleteMany.mockResolvedValue({});
    Task.deleteMany.mockResolvedValue({});
    Employee.create.mockResolvedValue({});
    Task.create.mockRejectedValue(new Error('create failed'));

    const response = await request(app).post('/demo/seed');

    expect(response.statusCode).toBe(500);
    expect(response.text).toContain('Bir hata oluştu');
  });
});
