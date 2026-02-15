const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// Senin yazdığın sınıfları buraya dahil ediyoruz
const Employee = require('./employee');
const Task = require('./task');
const TaskReporter = require('./task-reporter');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const tuviaRouter = require('./routes/tuvia');//tuvia.js dosyasını da dahil ediyoruz

const app = express();

// View engine ayarları
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
//hocada yazan bir şey daha var:
//app.use(function (err, req, res, next) {
//  console.error(err.stack);
//  res.status(500).send('Something broke!');
//});
//bu da hata yakalama middleware'i, uygulamada herhangi bir hata oluştuğunda bu fonksiyon devreye girecek ve hatayı konsola yazdıracak, ardından kullanıcıya 500 durum kodu ile bir mesaj gönderecek.
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
