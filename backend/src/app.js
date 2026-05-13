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

// View engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
//middleware setup
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}))

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(express.static(path.join(__dirname, 'public')))

// Routes
app.use('/', indexRouter)
app.use('/auth', authRouter)
app.use('/employees', employeesRouter)
app.use('/tasks', tasksRouter)
app.use('/point-transactions', pointTransactionsRouter)
app.use('/task-activities', taskActivitiesRouter)

app.createSocketServer = function (server) {
  const io = require('socket.io')(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true
    }
  })

  console.log('Socket.io server Tuvia için başarıyla oluşturuldu! ✅')

  io.on('connection', (socket) => {
    console.log('Yeni bir kullanıcı bağlandı (Socket ID):', socket.id)

    // Kullanıcıyı kendi özel odasına al
    socket.on('join_user_room', (userId) => {
      socket.join(userId)
      console.log(`Kullanıcı ${userId} kendi bildirim odasına katıldı.`)
    })

    socket.on('disconnect', () => {
      console.log('Kullanıcı sistemden ayrıldı.')
    })
  })

  // 'io' nesnesini routerlardan erişebilmek için app'e set ediyoruz
  app.set('io', io)
}

module.exports = app