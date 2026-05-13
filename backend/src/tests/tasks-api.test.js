const request = require('supertest');
const Task = require('../task');
const Employee = require('../employee');

jest.mock('../database-connection', () => ({}));
jest.mock('../task');
jest.mock('../employee');
const app = require('../app');

describe('Tasks API - Mocking Testleri', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /tasks görev listesini dönmeli', async () => {
    Task.find.mockResolvedValue([
      {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        title: 'Dokumantasyon',
        requiredSkill: 'Yazma',
        difficulty: 2,
        isCompleted: false,
        pendingApproval: false,
        rejected: false,
        dueAt: null,
        isOverdue: false,
      },
      {
        _id: { toString: () => '507f1f77bcf86cd799439012' },
        title: 'Refactor',
        requiredSkill: 'JS',
        difficulty: 4,
        isCompleted: true,
        pendingApproval: false,
        rejected: false,
        dueAt: new Date('2026-06-01'),
        isOverdue: false,
      },
    ]);

    const response = await request(app).get('/tasks');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0].title).toBe('Dokumantasyon');
    expect(response.body[0].dueAt).toBeNull();
    expect(response.body[0].overdue).toBe(false);
    expect(response.body[0].pendingApproval).toBe(false);
    expect(response.body[0].status).toBe('open');
    expect(response.body[1].status).toBe('completed');
    expect(response.body[1].dueAt).toBe('2026-06-01T00:00:00.000Z');
    expect(Task.find).toHaveBeenCalledTimes(1);
  });

  test('GET /tasks/overdue geciken görevleri dönmeli', async () => {
    Task.find.mockResolvedValue([
      {
        _id: { toString: () => '507f1f77bcf86cd799439099' },
        title: 'Eski iş',
        requiredSkill: 'JS',
        difficulty: 2,
        isCompleted: false,
        pendingApproval: false,
        rejected: false,
        dueAt: new Date('2000-01-01'),
        isOverdue: true,
      },
    ]);

    const response = await request(app).get('/tasks/overdue');

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].title).toBe('Eski iş');
    expect(response.body[0].overdue).toBe(true);
    expect(response.body[0].status).toBe('open');
    expect(Task.find).toHaveBeenCalledWith({
      isCompleted: false,
      rejected: { $ne: true },
      dueAt: { $ne: null, $lt: expect.any(Date) },
    });
  });

  test('GET /tasks hata olursa 500 dönmeli', async () => {
    Task.find.mockRejectedValue(new Error('db failed'));

    const response = await request(app).get('/tasks');

    expect(response.statusCode).toBe(500);
    expect(response.body).toEqual({ error: 'Görevleri listeleme hatası.' });
  });

  test('PATCH /tasks/:taskId/complete onay isteği göndermeli', async () => {
    const taskId = '507f1f77bcf86cd799439011';
    const taskDoc = {
      _id: { toString: () => taskId },
      title: 'Örnek',
      pendingApproval: false,
      isCompleted: false,
      save: jest.fn().mockResolvedValue({}),
    };
    const mockEmployee = {
      name: 'Canan',
      tasks: [taskId],
      points: 0,
      completeTask: jest.fn().mockImplementation(async function complete(t) {
        t.pendingApproval = true;
      }),
    };

    Task.findById.mockResolvedValue(taskDoc);
    Employee.findOne.mockResolvedValue(mockEmployee);

    const response = await request(app)
      .patch(`/tasks/${taskId}/complete`)
      .send({ employeeName: 'Canan' });

    expect(response.statusCode).toBe(200);
    expect(response.body.employeePoints).toBe(0);
    expect(response.body.pendingApproval).toBe(true);
    expect(response.body.isCompleted).toBe(false);
    expect(response.body.message).toContain('onay');
    expect(response.body.status).toBe('pending_approval');
    expect(mockEmployee.completeTask).toHaveBeenCalledWith(taskDoc);
  });

  test('PATCH /tasks/:taskId/approve onaylayıcı puanı vermeli', async () => {
    const taskId = '507f1f77bcf86cd799439011';
    const taskDoc = {
      _id: { toString: () => taskId },
      title: 'Örnek',
      isCompleted: true,
      pendingApproval: false,
      completionRequestedBy: 'submitter-id',
    };
    const mockApprover = {
      name: 'Yonetici',
      approveTaskCompletion: jest.fn().mockImplementation(async () => {
        taskDoc.isCompleted = true;
        taskDoc.pendingApproval = false;
      }),
    };
    const mockSubmitter = { points: 50 };

    Task.findById.mockResolvedValue(taskDoc);
    Employee.findOne.mockResolvedValue(mockApprover);
    Employee.findById.mockResolvedValue(mockSubmitter);

    const response = await request(app)
      .patch(`/tasks/${taskId}/approve`)
      .send({ approverName: 'Yonetici' });

    expect(response.statusCode).toBe(200);
    expect(response.body.submitterPoints).toBe(50);
    expect(response.body.approvedBy).toBe('Yonetici');
    expect(response.body.status).toBe('completed');
    expect(mockApprover.approveTaskCompletion).toHaveBeenCalledWith(taskDoc);
  });

  test('PATCH /tasks/:taskId/reject reddetme çağrısı yapılmalı', async () => {
    const taskId = '507f1f77bcf86cd799439011';
    const taskDoc = {
      _id: { toString: () => taskId },
      title: 'Örnek',
      completionRequestedBy: 'submitter-id',
      rejected: false,
      pendingApproval: true,
    };
    const mockApprover = {
      name: 'Yonetici',
      rejectTaskCompletion: jest.fn().mockImplementation(async () => {
        taskDoc.rejected = true;
        taskDoc.pendingApproval = false;
      }),
    };
    const submitterAfter = { skillRejections: [{ requiredSkill: 'JS', count: 1 }] };

    Task.findById.mockResolvedValue(taskDoc);
    Employee.findOne.mockResolvedValue(mockApprover);
    Employee.findById.mockResolvedValue(submitterAfter);

    const response = await request(app)
      .patch(`/tasks/${taskId}/reject`)
      .send({ approverName: 'Yonetici', reason: 'Kalite yetersiz' });

    expect(response.statusCode).toBe(200);
    expect(response.body.rejected).toBe(true);
    expect(response.body.status).toBe('rejected');
    expect(mockApprover.rejectTaskCompletion).toHaveBeenCalledWith(taskDoc, 'Kalite yetersiz');
  });

  test('PATCH /tasks/:taskId/approve approverName yoksa 400 dönmeli', async () => {
    const response = await request(app)
      .patch('/tasks/507f1f77bcf86cd799439011/approve')
      .send({});

    expect(response.statusCode).toBe(400);
    expect(Task.findById).not.toHaveBeenCalled();
  });

  test('PATCH /tasks/:taskId/complete employeeName yoksa 400 dönmeli', async () => {
    const response = await request(app)
      .patch('/tasks/507f1f77bcf86cd799439011/complete')
      .send({});

    expect(response.statusCode).toBe(400);
    expect(Task.findById).not.toHaveBeenCalled();
  });
});
