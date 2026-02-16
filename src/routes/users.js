var express = require('express');
const User = require('../user')
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
// creste new user
router.post('/',function (req, res, next){
  const user = new User
  res.send(user)
})

module.exports = router;
