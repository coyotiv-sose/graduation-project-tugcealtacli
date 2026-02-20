const express = require('express');

const router = express.Router();
const Task = require('../task');
// buraya dön aşağıya
// const Employee = newTask.employee({ title: 'Bütçe Analizi', requiredSkill: 'Excel', difficulty: 'Zor' });

router.get('/', (req, res, next) => {
  res.send(Task.list);
});
// yeni bir görev oluşturmak için POST isteği ve body'den title, requiredSkill ve difficulty bilgilerini alırız. Yeni bir Task nesnesi oluştururuz ve Task.list'e ekleriz. ve son olarak 201= yeni kaynak oluşturuldu demektir
/* router.post('/', (req, res, next) => {
  const { title, requiredSkill, difficulty } = req.body;
  const newTask = new Task(title, requiredSkill, difficulty);
  Task.list.push(newTask);
  res.status(201).send(newTask);
});
*/
router.post('/:');
module.exports = router;
