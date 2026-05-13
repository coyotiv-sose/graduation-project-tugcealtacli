<template>
  <div class="row justify-content-center align-items-center" style="min-height: 80vh;">
    <div class="col-12 col-md-8 col-lg-5">
      
      <!-- Logo ve Başlık -->
      <div class="text-center mb-4">
        <div class="d-inline-flex align-items-center justify-content-center bg-primary text-white rounded-3 shadow-sm mb-3" style="width: 60px; height: 60px;">
          <span class="fs-2 fw-bolder">T</span>
        </div>
        <h2 class="fw-bolder text-dark mb-1">TUVIA'ya Hoş Geldiniz</h2>
        <p class="text-muted">Yetenek ve yardımlaşma odaklı yönetim sistemi.</p>
      </div>

      <!-- Giriş / Kayıt Kartı -->
      <div class="card shadow-lg border-0 rounded-4">
        
        <!-- Sekmeler (Giriş Yap / Kayıt Ol) -->
        <div class="card-header bg-transparent border-bottom-0 pt-4 pb-0 px-4">
          <ul class="nav nav-pills nav-justified" role="tablist">
            <li class="nav-item" role="presentation">
              <button 
                class="nav-link fw-bold rounded-3" 
                :class="{ 'active': isLoginMode, 'text-dark': !isLoginMode }" 
                @click="isLoginMode = true"
              >
                Giriş Yap
              </button>
            </li>
            <li class="nav-item" role="presentation">
              <button 
                class="nav-link fw-bold rounded-3" 
                :class="{ 'active': !isLoginMode, 'text-dark': isLoginMode }" 
                @click="isLoginMode = false"
              >
                Kayıt Ol
              </button>
            </li>
          </ul>
        </div>

        <div class="card-body p-4 p-md-5">
          
          <!-- GİRİŞ FORMU -->
          <form v-if="isLoginMode" @submit.prevent="handleLogin" class="d-flex flex-column gap-3">
            <div>
              <label class="form-label fw-bold text-muted small">Ad Soyad</label>
              <input 
                v-model="loginForm.name" 
                type="text" 
                class="form-control form-control-lg bg-light" 
                placeholder="İsminizi girin" 
                required 
              />
            </div>

            <div>
              <label class="form-label fw-bold text-muted small">Şifre</label>
              <input 
                v-model="loginForm.password" 
                type="password" 
                class="form-control form-control-lg bg-light" 
                placeholder="••••••••" 
                required 
              />
            </div>

            <button type="submit" class="btn btn-primary btn-lg fw-bold w-100 mt-2 shadow-sm">
              Sisteme Giriş Yap
            </button>
          </form>

          <!-- KAYIT FORMU -->
          <form v-else @submit.prevent="handleRegister" class="d-flex flex-column gap-3">
            <div>
              <label class="form-label fw-bold text-muted small">Ad Soyad</label>
              <input 
                v-model="registerForm.name" 
                type="text" 
                class="form-control bg-light" 
                placeholder="Örn: Tuğçe" 
                required 
              />
            </div>

            <div class="row g-3">
              <div class="col-md-8">
                <label class="form-label fw-bold text-muted small">Uzmanlık Alanı</label>
                <input 
                  v-model="registerForm.mainSkill" 
                  type="text" 
                  class="form-control bg-light" 
                  placeholder="Örn: CSS, Pazarlama..." 
                  required 
                />
              </div>
              <div class="col-md-4">
                <label class="form-label fw-bold text-muted small">Seviye (1-5)</label>
                <input 
                  v-model="registerForm.skillLevel" 
                  type="number" 
                  min="1" 
                  max="5" 
                  class="form-control bg-light" 
                  required 
                />
              </div>
            </div>

            <div>
              <label class="form-label fw-bold text-muted small">Şifre Belirleyin</label>
              <input 
                v-model="registerForm.password" 
                type="password" 
                class="form-control bg-light" 
                placeholder="En az 6 karakter" 
                required 
              />
            </div>

            <div>
              <label class="form-label fw-bold text-muted small">Yönetici Kodu (Opsiyonel)</label>
              <input 
                v-model="registerForm.adminSecret" 
                type="password" 
                class="form-control bg-light" 
                placeholder="Sadece yöneticiler için" 
              />
              <div class="form-text" style="font-size: 0.75rem;">
                Çalışan profili oluşturuyorsanız burayı boş bırakın.
              </div>
            </div>

            <button type="submit" class="btn btn-primary btn-lg fw-bold w-100 mt-2 shadow-sm">
              Hesap Oluştur
            </button>
          </form>

        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const isLoginMode = ref(true)

const loginForm = ref({
  name: '',
  password: ''
})

const registerForm = ref({
  name: '',
  mainSkill: '',
  skillLevel: 1,
  password: '',
  adminSecret: ''
})

const handleLogin = async () => {
  try {
    await auth.login(loginForm.value.name, loginForm.value.password)
    router.push('/')
  } catch (error) {
    alert('Hata Detayı: ' + (error.response?.data?.detail || error.response?.data?.error || 'Giriş başarısız oldu.'))
  }
}

const handleRegister = async () => {
  try {
    await auth.register(registerForm.value)
    alert('Kayıt başarılı! Yönlendiriliyorsunuz...')
    
    // Kayıt başarılı olunca bilgileri login formuna taşıyıp giriş sekmesine atıyoruz
    loginForm.value.name = registerForm.value.name
    loginForm.value.password = registerForm.value.password
    
    isLoginMode.value = true
    registerForm.value = { name: '', mainSkill: '', skillLevel: 1, password: '', adminSecret: '' }
  } catch (error) {
    // Backend'den gelen gerçek hatayı yakalayan kısım (Örn: next is not a function veya Şifre kısa vb.)
    alert('Hata Detayı: ' + (error.response?.data?.detail || error.response?.data?.error || 'Kayıt başarısız oldu.'))
  }
}
</script>