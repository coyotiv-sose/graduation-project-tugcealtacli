const express = require('express');

const router = express.Router();
const Task = require('../task');

router.get('/', (req, res) => {
  res.send(Task.list);
});

module.exports = router;
// buraya geri dön. emin değilim
