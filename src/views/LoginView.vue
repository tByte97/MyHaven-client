<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Sparkles,
} from 'lucide-vue-next';
import BrandMark from '../components/BrandMark.vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const totpCode = ref('');
const showPassword = ref(false);
const errorMsg = ref('');
const isSubmitting = ref(false);

const requiresTotp = computed(() => authStore.requiresTotp);

async function handlePrimaryLogin() {
  errorMsg.value = '';
  isSubmitting.value = true;
  try {
    const result = await authStore.login(username.value, password.value);
    if (!result.requiresTotp) router.push('/dashboard');
  } catch (err) {
    errorMsg.value = err.response?.data?.detail || 'Не вдалося увійти.';
  } finally {
    isSubmitting.value = false;
  }
}

async function handleTotpVerification() {
  errorMsg.value = '';
  isSubmitting.value = true;
  try {
    await authStore.verifyTotp(totpCode.value);
    router.push('/dashboard');
  } catch (err) {
    errorMsg.value = err.response?.data?.detail || 'Невірний код підтвердження.';
  } finally {
    isSubmitting.value = false;
  }
}

function backToCredentials() {
  authStore.clearPendingLogin();
  totpCode.value = '';
  errorMsg.value = '';
}
</script>

<template>
  <section class="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
    <aside class="hidden lg:flex relative overflow-hidden border-r border-[color:var(--app-border)]">
      <div class="absolute inset-0 opacity-40"></div>
      <div class="absolute -top-32 -left-32 w-[40rem] h-[40rem] rounded-full gradient-sky opacity-20 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 w-[30rem] h-[30rem] rounded-full bg-emerald-500/15 blur-3xl"></div>
      <div class="relative z-10 flex flex-col justify-between p-12 w-full">
        <div class="flex items-center gap-3">
          <BrandMark class="size-10 rounded-xl gradient-sky shadow-glow" image-class="h-[76%] w-[76%] object-contain" />
          <div>
            <div class="font-accent text-2xl leading-none">MyHaven</div>
            <div class="text-[11px] uppercase tracking-[0.2em] text-[color:var(--app-muted)] mt-1">
              Особистий фінансовий простір
            </div>
          </div>
        </div>

        <div class="max-w-lg">
          <div class="inline-flex items-center gap-2 text-xs glass rounded-full px-3 py-1.5 mb-6">
            <Sparkles :size="14" class="text-sky-300" />
            Створено для ясності
          </div>
          <h1 class="font-accent text-6xl leading-[1.05] text-white">
            Ваші фінанси,<br />
            <span class="italic text-sky-300">зібрані спокійно.</span>
          </h1>
          <p class="mt-6 text-[color:var(--app-muted)] text-base max-w-md leading-relaxed">
            Відстежуйте витрати, плануйте бюджети й аналізуйте гроші у робочому просторі MyHaven.
          </p>
        </div>

        <div class="grid grid-cols-3 gap-3 max-w-lg">
          <div class="glass rounded-xl p-4">
            <div class="font-accent text-2xl text-sky-300">UAH</div>
            <div class="text-[11px] uppercase tracking-wider text-[color:var(--app-muted)] mt-1">валюта</div>
          </div>
          <div class="glass rounded-xl p-4">
            <div class="font-accent text-2xl text-sky-300">2FA</div>
            <div class="text-[11px] uppercase tracking-wider text-[color:var(--app-muted)] mt-1">захист</div>
          </div>
          <div class="glass rounded-xl p-4">
            <div class="font-accent text-2xl text-sky-300">Live</div>
            <div class="text-[11px] uppercase tracking-wider text-[color:var(--app-muted)] mt-1">дані</div>
          </div>
        </div>
      </div>
    </aside>

    <div class="flex items-center justify-center px-6 py-12 lg:px-16 relative">
      <div class="w-full max-w-sm">
        <div v-if="!requiresTotp" class="space-y-5">
          <div class="lg:hidden flex items-center gap-2 mb-8">
            <BrandMark class="size-9 rounded-lg gradient-sky" image-class="h-[72%] w-[72%] object-contain" />
            <div class="font-accent text-xl">MyHaven</div>
          </div>
          <div>
            <h2 class="font-accent text-3xl text-white">Раді бачити знову</h2>
            <p class="text-sm text-[color:var(--app-muted)] mt-1.5">Увійдіть до свого робочого простору.</p>
          </div>

          <form class="space-y-4" @submit.prevent="handlePrimaryLogin">
            <div class="space-y-1.5">
              <label class="text-xs text-[color:var(--app-muted)]">Логін</label>
              <input v-model="username" autocomplete="username" class="mh-input h-10" required />
            </div>
            <div class="space-y-1.5">
              <label class="text-xs text-[color:var(--app-muted)]">Пароль</label>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  class="mh-input h-10 pr-10"
                  required
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--app-muted)] hover:text-white"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" :size="17" />
                  <Eye v-else :size="17" />
                </button>
              </div>
            </div>

            <p v-if="errorMsg" class="text-xs text-rose-200 border border-rose-400/30 bg-rose-500/10 rounded-md px-3 py-2">
              {{ errorMsg }}
            </p>

            <button type="submit" :disabled="isSubmitting" class="mh-button-primary w-full">
              <Loader2 v-if="isSubmitting" :size="17" class="animate-spin" />
              <template v-else>Увійти <ArrowRight :size="17" /></template>
            </button>
          </form>

          <div class="text-sm text-center text-[color:var(--app-muted)] pt-3 border-t border-white/10">
            Ще немає акаунта?
            <button class="text-sky-300 hover:text-sky-200 font-medium" @click="router.push('/register')">
              Створити
            </button>
          </div>
        </div>

        <div v-else class="space-y-6">
          <div class="size-12 rounded-xl bg-sky-500/15 grid place-items-center">
            <ShieldCheck :size="26" class="text-sky-300" />
          </div>
          <div>
            <h2 class="font-accent text-3xl text-white">Двофакторна перевірка</h2>
            <p class="text-sm text-[color:var(--app-muted)] mt-1.5">
              Введіть 6-значний код з authenticator-застосунку.
            </p>
          </div>

          <form class="space-y-5" @submit.prevent="handleTotpVerification">
            <input
              v-model="totpCode"
              inputmode="numeric"
              maxlength="6"
              minlength="6"
              pattern="[0-9]{6}"
              required
              placeholder="000000"
              class="mh-input h-12 text-center tracking-[0.35em] text-lg"
            />
            <p v-if="errorMsg" class="text-xs text-rose-200 text-center">{{ errorMsg }}</p>
            <button type="submit" :disabled="isSubmitting" class="mh-button-primary w-full">
              {{ isSubmitting ? 'Підтверджуємо...' : 'Підтвердити і продовжити' }}
            </button>
          </form>

          <button class="mx-auto flex items-center gap-2 text-xs text-[color:var(--app-muted)] hover:text-white" @click="backToCredentials">
            <ArrowLeft :size="15" /> Назад до входу
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
