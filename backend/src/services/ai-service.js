const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = async function generateTaskDescription(taskTitle) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', 
      messages: [
        { 
          role: 'system', 
          content: 'Sen profesyonel bir yazılım proje yöneticisisin. Sana verilen kısa görev başlıklarını, yazılımcıların anlayacağı detaylı ve profesyonel görev açıklamalarına dönüştürürsün.' 
        },
        { 
          role: 'user', 
          content: `Şu görev başlığını detaylandırır mısın: "${taskTitle}"` 
        }
      ],
      temperature: 0.7, 
      max_tokens: 500, 
    });

    // Frontend'e tüm backend verisini göndermeyip sadece metni filtreleyerek dönüyoruz (Güvenlik Kuralı)
    return response.choices[0].message.content || '';
  } catch (error) {
    console.error('Yapay zeka hatası:', error.message);
    return 'Yapay zeka şu an meşgul, lütfen açıklamayı manuel girin.';
  }
};