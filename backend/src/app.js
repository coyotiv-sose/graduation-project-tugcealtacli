require('dotenv').config()
require('./database-connection')

const express = require('express')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')

const indexRouter = require('./routes/index')
const employeesRouter = require('./routes/employees')
const tasksRouter = require('./routes/tasks')
const authRouter = require('./routes/auth')
const pointTransactionsRouter = require('./routes/point-transactions')
const taskActivitiesRouter = require('./routes/task-activities')

const app = express()

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

// CORS Ayarı: Her origin'e (frontend linkine) izin veriyoruz
app.use(cors({
  origin: true, 
  credentials: true
}))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

app.use('/', indexRouter)
app.use('/auth', authRouter)
app.use('/employees', employeesRouter)
app.use('/tasks', tasksRouter)
app.use('/point-transactions', pointTransactionsRouter)
app.use('/task-activities', taskActivitiesRouter)

app.createSocketServer = function (server) {
  const io = require('socket.io')(server, {
    cors: {
      origin: true, // Socket için de kapıları açtık
      credentials: true
    }
  })

  console.log('Socket.io server Tuvia için başarıyla oluşturuldu! ✅')

  io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı (Socket ID):', socket.id)

    socket.on('join_user_room', (userId) => {
      socket.join(userId)
      console.log(`Kullanıcı ${userId} kendi bildirim odasına katıldı.`)
    })

    socket.on('disconnect', () => {
      console.log('Kullanıcı sistemden ayrıldı.')
    })
  })

  app.set('io', io)
}

module.exports = app