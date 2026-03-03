<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const username = ref('');
const password = ref('');
const errorMsg = ref('');
const authStore = useAuthStore();
const router = useRouter();

async function handleLogin() {
  try {
    await authStore.login(username.value, password.value);
    router.push('/dashboard'); 
  } catch (err) {
    errorMsg.value = 'Невірний логін або пароль';
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h2>Вхід у систему</h2>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Логін:</label>
          <input v-model="username" type="text" required placeholder="Ваш логін" />
        </div>
        
        <div class="form-group">
          <label>Пароль:</label>
          <input v-model="password" type="password" required placeholder="Ваш пароль" />
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        
        <button type="submit" class="login-btn">Увійти</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
  background-color: #f3f4f6;
}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
}
.form-group {
  margin-bottom: 1rem;
}
input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-top: 5px;
}
.login-btn {
  width: 100%;
  padding: 0.75rem;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
}
.login-btn:hover { background-color: #2563eb; }
.error { color: red; text-align: center; margin-bottom: 1rem; }
</style>