const colors = require('colors')
const pluralize = require('pluralize')

const printFullReport = task => {
  const count = task.assignees ? task.assignees.length : 0
  const employeeText = pluralize('employee', count, true)
  const reportText = `${task.report}\n${task.title} projesinde ${employeeText} çalışıyor.`
  console.log(reportText.magenta)
}

module.exports = { printFullReport }
