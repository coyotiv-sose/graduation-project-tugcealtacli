const mongoose = require('mongoose')

mongoose
  .connect('mongodb://127.0.0.1:27017/tuvia')
  .then(() => console.log('Tuvia veritabanına bağlandı.'))
  .catch(err => console.error('Bağlantı hatası:', err))
