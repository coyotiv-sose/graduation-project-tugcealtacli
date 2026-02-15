var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send([{ name: 'Canan' },{ name: 'Mehmet' },{ name: 'Ahmet' }]);
  return;
  res.render('users', {
    user: {
      name: 'Canan',
    },
  users: [
    { name: 'Canan' },{ name: 'Mehmet' },{ name: 'Ahmet' }
  ]
  });
});

module.exports = router;
