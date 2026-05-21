const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const Employee = require('../employee')

function employeeToAuthDto(employee) {
  return {
    id: employee._id.toString(),
    name: employee.name,
    email: employee.email,
    role: employee.role,
    mainSkill: employee.mainSkill,
    skillLevel: employee.skillLevel,
    points: employee.points || 0,
  }
}

// Şifreli Kayıt Olma (Register) Rotası
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, mainSkill, skillLevel, adminSecret } = req.body

    if (!name || !email || !password || !mainSkill || skillLevel === undefined) {
      return res.status(400).send({ error: 'İsim, e-posta, şifre, uzmanlık ve seviye zorunludur.' })
    }

    // Artık isme göre değil, e-postaya göre kontrol ediyoruz
    const existingUser = await Employee.findOne({ email: String(email).trim().toLowerCase() })
    if (existingUser) {
      return res.status(400).send({ error: 'Bu e-posta adresiyle kayıtlı bir kullanıcı zaten var.' })
    }

    let role = 'employee'
    if (adminSecret && adminSecret === process.env.ADMIN_SECRET) {
      role = 'manager'
    }

    const newEmployee = await Employee.create({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: password, 
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
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).send({ error: 'E-posta ve şifre gereklidir.' })
    }

    // E-postayı küçük harfe çevirerek arıyoruz ki büyük/küçük harf hatası olmasın
    const employee = await Employee.findOne({ email: String(email).trim().toLowerCase() })
    if (!employee) {
      return res.status(404).send({ error: 'Bu e-posta adresine ait kullanıcı bulunamadı.' })
    }

    const isMatch = await employee.comparePassword(password)
    if (!isMatch) {
      return res.status(401).send({ error: 'Hatalı şifre girdiniz.' })
    }

    const token = jwt.sign(
      { id: employee._id, role: employee.role },
      process.env.JWT_SECRET || 'tuvia_yedek_gizli_anahtar',
      { expiresIn: '1d' }
    )

    res.send({
      message: 'Giriş başarılı.',
      token,
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
    const legacyId = req.headers['x-employee-id']
    
    let employeeId = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tuvia_yedek_gizli_anahtar')
      employeeId = decoded.id
    } 
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