const jwt = require('jsonwebtoken')

// 1. Bekçi: Sisteme giriş yapılmış mı kontrol eder
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: 'Bu işlem için giriş yapmalısınız (Token eksik).' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tuvia_yedek_gizli_anahtar')
    req.user = decoded 
    next() 
  } catch (error) {
    return res.status(401).send({ error: 'Geçersiz veya süresi dolmuş oturum.' })
  }
}

// 2. Bekçi: Sadece "Yönetici" (manager) olanların geçmesine izin verir
function requireManager(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: 'Bu işlem için yönetici girişi yapmalısınız.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tuvia_yedek_gizli_anahtar')
    
    if (decoded.role !== 'manager') {
      return res.status(403).send({ error: 'Yetki reddedildi: Bu işlemi sadece yöneticiler yapabilir.' })
    }

    req.user = decoded
    next()
  } catch (error) {
    return res.status(401).send({ error: 'Geçersiz veya süresi dolmuş oturum.' })
  }
}

// İŞTE HATAYA SEBEP OLAN KRİTİK KISIM BURASI (Dışa aktarma)
module.exports = {
  requireAuth,
  requireManager
}