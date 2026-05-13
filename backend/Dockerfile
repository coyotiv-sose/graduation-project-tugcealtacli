FROM node:alpine

# Konteynır içinde çalışma dizinini ayarla
WORKDIR /app

# Google zaten backend klasöründe, o yüzden yanındaki dosyaları direkt kopyala
COPY package*.json ./
RUN npm install

# Geri kalan her şeyi kopyala
COPY . .

# Cloud Run için portu aç
EXPOSE 8080

CMD ["npm", "start"]