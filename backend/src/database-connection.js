const mongoose = require('mongoose')

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  .then(() => console.log('Tuvia veritabanına bağlandı.'))
  .catch(err => console.error('Bağlantı hatası:', err))
