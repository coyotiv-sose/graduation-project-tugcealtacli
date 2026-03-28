const TaskReporter = require('../task-reporter');

describe('Task Reporter - Unit Tests', () => {
  test('printFullReport: raporu console.log ile yazdirmali', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const fakeTask = {
      title: 'Backend Cleanup',
      assignees: [{ name: 'Canan' }, { name: 'Mehmet' }],
      report: 'Rapor metni',
    };

    TaskReporter.printFullReport(fakeTask);

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const loggedText = consoleSpy.mock.calls[0][0];
    expect(loggedText).toContain('Rapor metni');
    expect(loggedText).toContain('Backend Cleanup projesinde 2 employees çalışıyor.');

    consoleSpy.mockRestore();
  }); 
});
