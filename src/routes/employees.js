const express = require('express');

const router = express.Router();
const Employee = require('../employee'); // Sınıfı çağırdık

/* GET employees listing. */
router.get('/', function (req, res, next) {
  // Hocanın istediği yöntem: Listeyi direkt gönderiyoruz
  res.send(Employee.list);
});

/* POST create new employee. */
router.post('/', function (req, res, next) {
  try {
    const employee = Employee.create({
      name: req.body.name,
      mainSkill: req.body.mainSkill,
      skillLevel: req.body.skillLevel,
    });
    res.send(employee);
  } catch (error) {
    // Eğer bir terslik olursa sunucu çökmesin diye
    console.error('Kayıt hatası:', error);
    res.status(400).send('Kayıt oluşturulurken hata oluştu.');
  }
});

module.exports = router;
