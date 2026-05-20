<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeft, LockKeyhole, ShieldCheck, Wallet, LineChart, Landmark, CircleCheck } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('');
const password = ref('');
const totpCode = ref('');
const errorMsg = ref('');
const isSubmitting = ref(false);

const requiresTotp = computed(() => authStore.requiresTotp);

const highlights = [
  { label: 'Аналітика', value: 'Live dashboard', icon: LineChart },
  { label: 'Джерела', value: 'Картки, банки, готівка', icon: Landmark },
  { label: 'Безпека', value: 'JWT + TOTP', icon: ShieldCheck },
];

async function handlePrimaryLogin() {
  errorMsg.value = '';
  isSubmitting.value = true;
  try {
    const result = await authStore.login(username.value, password.value);
    if (!result.requiresTotp) {
      router.push('/dashboard');
    }
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
  <section class="min-h-screen px-6 py-10 lg:px-10">
    <div class="max-w-7xl mx-auto">
      <div class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <aside class="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 lg:p-10">
          <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <Wallet :size="16" class="text-sky-400" />
            <span>MyHaven Workspace</span>
          </div>

          <div class="mt-8 max-w-2xl">
            <p class="text-xs uppercase tracking-[0.32em] text-slate-400">Desktop Access</p>
            <h1 class="mt-4 font-accent text-4xl lg:text-6xl leading-none text-white">
              {{ requiresTotp ? 'Підтвердьте вхід кодом' : 'Фінанси в одному робочому просторі' }}
            </h1>
            <p class="mt-5 text-base lg:text-lg text-slate-300/90 leading-7">
              {{ requiresTotp
                ? 'Другий крок безпеки захищає ваш кабінет перед входом у дашборд.'
                : 'Вхід створений для desktop-сценарію: швидкий доступ до звітів, операцій і налаштувань без mobile-web стилізації.' }}
            </p>
          </div>

          <div class="mt-10 grid gap-4 md:grid-cols-3">
            <div
              v-for="item in highlights"
              :key="item.label"
              class="rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <component :is="item.icon" :size="18" class="text-sky-400" />
              <p class="mt-6 text-xs uppercase tracking-[0.18em] text-slate-500">{{ item.label }}</p>
              <p class="mt-2 text-sm font-medium text-slate-100">{{ item.value }}</p>
            </div>
          </div>

          <div class="mt-8 rounded-3xl border border-white/10 bg-slate-950/30 p-5">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-slate-400">Робочий ритм</p>
                <p class="mt-1 text-2xl font-semibold text-white">Abyss + Frost</p>
              </div>
              <CircleCheck :size="22" class="text-emerald-400" />
            </div>
            <div class="mt-5 grid gap-3">
              <div class="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <span class="text-slate-400">Доступ до панелі</span>
                <span class="text-slate-100">Після авторизації</span>
              </div>
              <div class="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3 text-sm">
                <span class="text-slate-400">Сценарій</span>
                <span class="text-slate-100">Desktop-first UX</span>
              </div>
            </div>
          </div>
        </aside>

        <div class="rounded-[28px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 lg:p-10 flex items-center">
          <div class="w-full max-w-md mx-auto">
            <div class="flex items-center justify-between mb-8">
              <div>
                <p class="text-xs uppercase tracking-[0.22em] text-slate-400">
                  {{ requiresTotp ? 'Verification' : 'Sign In' }}
                </p>
                <h2 class="mt-2 text-3xl font-semibold text-white">
                  {{ requiresTotp ? 'TOTP код' : 'Вхід до акаунта' }}
                </h2>
              </div>
              <div class="flex gap-2">
                <span class="h-1.5 w-10 rounded-full" :class="requiresTotp ? 'bg-white/10' : 'bg-sky-500'"></span>
                <span class="h-1.5 w-10 rounded-full" :class="requiresTotp ? 'bg-sky-500' : 'bg-white/10'"></span>
              </div>
            </div>

            <form v-if="!requiresTotp" class="space-y-5" @submit.prevent="handlePrimaryLogin">
              <div>
                <label class="mb-2 block text-sm text-slate-400">Логін</label>
                <input
                  v-model="username"
                  type="text"
                  required
                  placeholder="myhaven_user"
                  class="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm text-slate-400">Пароль</label>
                <input
                  v-model="password"
                  type="password"
                  required
                  placeholder="Ваш пароль"
                  class="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <p v-if="errorMsg" class="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {{ errorMsg }}
              </p>

              <div class="flex items-center justify-between gap-4 pt-2">
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                >
                  <LockKeyhole :size="16" />
                  {{ isSubmitting ? 'Перевіряємо…' : 'Увійти' }}
                </button>

                <button
                  type="button"
                  class="text-sm font-medium text-sky-300 transition hover:text-sky-200"
                  @click="router.push('/register')"
                >
                  Створити акаунт
                </button>
              </div>
            </form>

            <form v-else class="space-y-5" @submit.prevent="handleTotpVerification">
              <button
                type="button"
                class="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
                @click="backToCredentials"
              >
                <ArrowLeft :size="16" />
                Назад до логіна і пароля
              </button>

              <div class="rounded-2xl border border-white/10 bg-slate-950/25 px-4 py-3 text-sm text-slate-300">
                Введіть код з Google Authenticator, 1Password або іншого TOTP-застосунку.
              </div>

              <div>
                <label class="mb-2 block text-sm text-slate-400">6-значний код</label>
                <input
                  v-model="totpCode"
                  inputmode="numeric"
                  maxlength="6"
                  minlength="6"
                  pattern="[0-9]{6}"
                  required
                  placeholder="000000"
                  class="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm tracking-[0.35em] text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <p v-if="errorMsg" class="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {{ errorMsg }}
              </p>

              <button
                type="submit"
                :disabled="isSubmitting"
                class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
              >
                <ShieldCheck :size="16" />
                {{ isSubmitting ? 'Підтверджуємо…' : 'Підтвердити вхід' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
