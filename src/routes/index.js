var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
 // res.render('index', { title: 'Tuvia' });
 res.send([{ id: 1, name: 'Tuvia' }])
});

module.exports = router;
