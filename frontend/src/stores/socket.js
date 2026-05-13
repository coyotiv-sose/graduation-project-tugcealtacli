import { defineStore } from 'pinia';
import { io } from 'socket.io-client';

export const useSocketStore = defineStore('socket', {
  state: () => ({
    connected: false,
    socket: null
  }),
  actions: {
    init() {
      // Eğer zaten bir bağlantı varsa ikinci kez başlatma
      if (this.socket?.connected) return;

      this.socket = io('http://localhost:3000', {
        withCredentials: true
      });

      this.socket.on('connect', () => {
        this.connected = true;
        console.log('Tuvia Socket bağlantısı başarılı! ✅');
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        console.log('Socket bağlantısı koptu.');
      });

      // Dinleyicileri tanımlıyoruz
      this.socket.on('new_task_assigned', (task) => {
        alert(`🔔 YENİ GÖREV: "${task.title}" size atandı!`);
      });

      this.socket.on('help_received', (data) => {
        alert(data.message);
      });
    },

    joinMyRoom(userId) {
      if (this.socket && userId) {
        this.socket.emit('join_user_room', userId);
      }
    },

    disconnect() {
      if (this.socket) {
        // Tüm dinleyicileri sustur
        this.socket.off('new_task_assigned');
        this.socket.off('help_received');
        this.socket.off('task_created');
        
        // Bağlantıyı tamamen kapat
        this.socket.disconnect();
        this.socket = null;
        this.connected = false;
        console.log('Socket temizlendi ve bağlantı kapatıldı. 🧹');
      }
    }
  }
});