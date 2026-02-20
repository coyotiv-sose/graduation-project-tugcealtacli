const colors = require('colors')
const pluralize = require('pluralize')

class TaskReporter {
  static printFullReport(task) {
    const count = task.assignees.length
    const employeeText = pluralize('employee', count, true)
    const reportText = `${task.report}\n${task.title} projesinde ${employeeText} çalışıyor.`
    console.log(reportText.magenta)
  }
}

module.exports = TaskReporter
