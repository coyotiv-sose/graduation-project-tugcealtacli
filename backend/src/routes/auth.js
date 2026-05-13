const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Employee = require('../employee')

function employeeToAuthDto(employee) {
  return {
    id: employee._id.toString(),
    name: employee.name,
    role: employee.role, // Yönetici mi çalışan mı olduğunu anlamak için
    mainSkill: employee.mainSkill,
    skillLevel: employee.skillLevel,
    points: employee.points || 0,
  }
}

// Şifreli Kayıt Olma (Register) Rotası
router.post('/register', async (req, res) => {
  try {
    const { name, password, mainSkill, skillLevel, adminSecret } = req.body

    if (!name || !password || !mainSkill || skillLevel === undefined) {
      return res.status(400).send({ error: 'İsim, şifre, uzmanlık ve seviye zorunludur.' })
    }

    const existingUser = await Employee.findOne({ name })
    if (existingUser) {
      return res.status(400).send({ error: 'Bu isimde bir kullanıcı zaten var.' })
    }

    // Eğer gizli yönetici şifresi doğru girilirse rolü 'manager' yap
    let role = 'employee'
    if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
      role = 'manager'
    }

    const newEmployee = await Employee.create({
      name: String(name).trim(),
      password: password, // employee.js'deki pre-save kancası bunu otomatik şifreleyecek
      role: role,
      mainSkill: String(mainSkill).trim(),
      skillLevel: Number(skillLevel),
      skills: [{ name: String(mainSkill).trim(), level: Number(skillLevel) }]
    })

    res.status(201).send({ 
      message: 'Kayıt başarılı, giriş yapabilirsiniz.', 
      user: employeeToAuthDto(newEmployee) 
    })
  } catch (error) {
    res.status(400).send({ error: 'Kayıt yapılamadı.', detail: error.message })
  }
})

// Gerçek Şifre ve Token (JWT) ile Giriş (Login) Rotası
router.post('/login', async (req, res) => {
  try {
    const { name, password } = req.body

    if (!name || !password) {
      return res.status(400).send({ error: 'İsim ve şifre gereklidir.' })
    }

    const employee = await Employee.findOne({ name })
    if (!employee) {
      return res.status(404).send({ error: 'Kullanıcı bulunamadı.' })
    }

    // Girilen şifre ile veritabanındaki şifrelenmiş şifreyi karşılaştır
    const isMatch = await employee.comparePassword(password)
    if (!isMatch) {
      return res.status(401).send({ error: 'Hatalı şifre girdiniz.' })
    }

    // Giriş başarılıysa JWT Token oluştur (1 gün geçerli)
    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET || 'tuvia_yedek_gizli_anahtar',
      { expiresIn: '1d' }
    )

    res.send({
      message: 'Giriş başarılı.',
      token, // Token'ı frontend'e gönderiyoruz
      user: employeeToAuthDto(employee),
    })
  } catch (error) {
    res.status(400).send({ error: 'Giriş yapılamadı.', detail: error.message })
  }
})

router.post('/logout', async (req, res) => {
  res.send({ message: 'Çıkış başarılı.' })
})

// Token Doğrulaması ile Mevcut Kullanıcıyı Getir
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization']
    const legacyId = req.headers['x-employee-id'] // Frontend'i güncelleyene kadar geçici destek
    
    let employeeId = null;

    // Önce yeni güvenli yöntemi (Token) kontrol et
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tuvia_yedek_gizli_anahtar')
      employeeId = decoded.id
    } 
    // Token yoksa eski güvensiz yönteme bak (Geçiş aşaması için)
    else if (legacyId) {
      employeeId = legacyId
    }

    if (!employeeId) {
      return res.status(401).send({ error: 'Aktif kullanıcı bulunamadı veya yetkisiz erişim.' })
    }

    const employee = await Employee.findById(employeeId)
    if (!employee) {
      return res.status(404).send({ error: 'Aktif kullanıcı bulunamadı.' })
    }

    res.send(employeeToAuthDto(employee))
  } catch (error) {
    res.status(401).send({ error: 'Geçersiz token veya oturum süresi dolmuş.', detail: error.message })
  }
})

module.exports = router