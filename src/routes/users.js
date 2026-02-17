var express = require('express');
const User = require('../user')
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send([{ name: 'Canan' },{ name: 'Mehmet' },{ name: 'Ahmet' }]);
  return;
  res.render('employees', {
    user: {
      name: 'Canan',
    },
  employees: [
    { name: 'Canan' },{ name: 'Mehmet' },{ name: 'Ahmet' }
  ]
  });
});
// create new employee
router.post('/',function (req, res, next){
  const employee = new Employee(req.body.name);
  res.send(employee)
})
static
module.exports = router;
