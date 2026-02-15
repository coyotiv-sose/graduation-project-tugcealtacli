var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
 // res.render('index', { title: 'Tuvia' });
 res.send([{ id: 1, name: 'Tuvia' }])
 //Res.render ve res.send arasındaki fark nedir? = res.render, bir şablon dosyasını (genellikle Pug, EJS gibi) kullanarak HTML oluşturur ve bunu istemciye gönderir. res.send ise doğrudan bir metin, JSON veya diğer veri türlerini istemciye gönderir. Yani res.render, dinamik HTML oluşturmak için kullanılırken, res.send daha genel amaçlıdır ve herhangi bir veri türünü göndermek için kullanılabilir.
});

module.exports = router;
//router nedir? = express altında http isteklerini dinlemenize ve yanıt vermenize olanak tanıyan özel bir modüldür
