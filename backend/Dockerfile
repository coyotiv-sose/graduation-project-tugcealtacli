FROM node:alpine

# Konteynır içinde çalışacağımız bir klasör oluşturuyoruz
WORKDIR /app

# Google ana dizinde bile olsa git backend içindeki paket listesini al
COPY backend/package*.json ./

# Sadece backend bağımlılıklarını kur
RUN npm install

# Geri kalan her şeyi (backend klasöründeki kodları) içeri kopyala
COPY backend/ .

# Cloud Run'ın beklediği port
EXPOSE 8080

# Uygulamayı başlat
CMD ["npm", "start"]