<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Check, ChevronLeft, ChevronRight, Globe2, Landmark, Palette, UserRound, Wallet, ShieldCheck, CircleCheck } from 'lucide-vue-next';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const steps = [
  { id: 'identity', title: 'Акаунт', subtitle: 'Базові дані для входу і профілю.', icon: UserRound },
  { id: 'language', title: 'Мова', subtitle: 'Інтерфейс і локаль застосунку.', icon: Globe2 },
  { id: 'currency', title: 'Валюта', subtitle: 'Основна валюта щоденних витрат.', icon: Landmark },
  { id: 'tracking', title: 'Джерела', subtitle: 'Які фінансові канали ви відстежуєте.', icon: Wallet },
  { id: 'theme', title: 'Вигляд', subtitle: 'Тема і валюта відображення сум.', icon: Palette },
];

const languageOptions = [
  { value: 'uk', label: 'Українська', hint: 'Основна локаль для України' },
  { value: 'en', label: 'English', hint: 'Для міжнародного інтерфейсу' },
  { value: 'de', label: 'Deutsch', hint: 'Для німецькомовного використання' },
  { value: 'es', label: 'Español', hint: 'Для іспаномовного інтерфейсу' },
  { value: 'pl', label: 'Polski', hint: 'Для польського регіонального сценарію' },
];

const currencyOptions = [
  { value: 'UAH', label: 'UAH', hint: 'Українська гривня', symbol: '₴' },
  { value: 'USD', label: 'USD', hint: 'Долар США', symbol: '$' },
  { value: 'EUR', label: 'EUR', hint: 'Євро', symbol: '€' },
  { value: 'PLN', label: 'PLN', hint: 'Польський злотий', symbol: 'zł' },
  { value: 'GBP', label: 'GBP', hint: 'Британський фунт', symbol: '£' },
  { value: 'CHF', label: 'CHF', hint: 'Швейцарський франк', symbol: 'Fr' },
];

const trackingOptions = [
  { value: 'cash', label: 'Готівка' },
  { value: 'card', label: 'Картка' },
  { value: 'bank', label: 'Банк' },
  { value: 'wallet', label: 'Гаманець' },
  { value: 'savings', label: 'Заощадження' },
  { value: 'all', label: 'Все разом' },
];

const themeOptions = [
  { value: 'dark', label: 'Abyss', hint: 'Темна робоча тема' },
  { value: 'light', label: 'Frost', hint: 'Світлий режим' },
  { value: 'auto', label: 'System', hint: 'Автовибір за системою' },
];

const form = ref({
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  language: 'uk',
  currency: 'UAH',
  display_currency: 'UAH',
  theme: 'dark',
  tracking_sources: ['card'],
});

const currentStep = ref(0);
const errorMsg = ref('');
const isSubmitting = ref(false);

const activeStep = computed(() => steps[currentStep.value]);
const isLastStep = computed(() => currentStep.value === steps.length - 1);
const progressText = computed(() => `Крок ${currentStep.value + 1} з ${steps.length}`);

function isSelected(currentValue, optionValue) {
  return currentValue === optionValue;
}

function toggleTracking(value) {
  const current = new Set(form.value.tracking_sources);

  if (value === 'all') {
    form.value.tracking_sources = ['all'];
    return;
  }

  current.delete('all');
  if (current.has(value)) {
    current.delete(value);
  } else {
    current.add(value);
  }

  form.value.tracking_sources = Array.from(current);
}

function validateStep() {
  errorMsg.value = '';

  if (currentStep.value === 0) {
    if (!form.value.username || !form.value.email || !form.value.password) {
      errorMsg.value = 'Заповніть логін, email і пароль.';
      return false;
    }
    if (form.value.password.length < 8) {
      errorMsg.value = 'Пароль має містити щонайменше 8 символів.';
      return false;
    }
  }

  if (currentStep.value === 3 && !form.value.tracking_sources.length) {
    errorMsg.value = 'Оберіть хоча б одне джерело відстеження.';
    return false;
  }

  return true;
}

function nextStep() {
  if (validateStep()) {
    currentStep.value += 1;
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value -= 1;
    errorMsg.value = '';
  }
}

async function submitRegistration() {
  if (!validateStep()) {
    return;
  }

  isSubmitting.value = true;
  errorMsg.value = '';
  try {
    const result = await authStore.register(form.value);
    if (result.requiresTotp) {
      router.push('/login');
      return;
    }
    router.push('/dashboard');
  } catch (err) {
    const data = err.response?.data;
    if (data?.email?.[0]) {
      errorMsg.value = data.email[0];
    } else if (data?.password?.[0]) {
      errorMsg.value = data.password[0];
    } else if (data?.username?.[0]) {
      errorMsg.value = data.username[0];
    } else {
      errorMsg.value = 'Не вдалося завершити реєстрацію.';
    }
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="min-h-screen px-6 py-10 lg:px-10">
    <div class="max-w-7xl mx-auto">
      <div class="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside class="rounded-[28px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 lg:p-10">
          <div class="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
            <ShieldCheck :size="16" class="text-emerald-400" />
            <span>MyHaven Onboarding</span>
          </div>

          <div class="mt-8">
            <p class="text-xs uppercase tracking-[0.32em] text-slate-400">Desktop Registration</p>
            <h1 class="mt-4 font-accent text-4xl lg:text-6xl leading-none text-white">
              Підготуйте робочий простір під себе
            </h1>
            <p class="mt-5 text-base lg:text-lg text-slate-300/90 leading-7">
              Реєстрація з орієнтацією на desktop-користувача: чиста форма, компактні вибори і налаштування без mobile-app патернів.
            </p>
          </div>

          <div class="mt-10 grid gap-4">
            <div
              v-for="(step, index) in steps"
              :key="step.id"
              class="rounded-2xl border px-4 py-4 transition"
              :class="index === currentStep ? 'border-sky-500/40 bg-sky-500/10' : 'border-white/10 bg-white/5'"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex items-start gap-3">
                  <div class="mt-0.5 rounded-xl bg-white/5 p-2 text-sky-300">
                    <component :is="step.icon" :size="16" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-white">{{ step.title }}</p>
                    <p class="mt-1 text-sm text-slate-400">{{ step.subtitle }}</p>
                  </div>
                </div>
                <CircleCheck v-if="index < currentStep" :size="18" class="text-emerald-400" />
              </div>
            </div>
          </div>

          <div class="mt-8 rounded-3xl border border-white/10 bg-slate-950/30 p-5">
            <p class="text-sm text-slate-400">Вибрано зараз</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-200">{{ form.language.toUpperCase() }}</span>
              <span class="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-200">{{ form.currency }}</span>
              <span class="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-200">{{ form.theme }}</span>
              <span class="rounded-full bg-white/5 px-3 py-1.5 text-xs text-slate-200">{{ form.display_currency }}</span>
            </div>
          </div>
        </aside>

        <div class="rounded-[28px] border border-white/10 bg-white/10 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 lg:p-10">
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="text-xs uppercase tracking-[0.22em] text-slate-400">{{ progressText }}</p>
              <h2 class="mt-2 text-3xl font-semibold text-white">{{ activeStep.title }}</h2>
            </div>
            <button
              type="button"
              class="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
              @click="router.push('/login')"
            >
              <ChevronLeft :size="16" />
              До входу
            </button>
          </div>

          <div class="mt-6 grid grid-cols-5 gap-2">
            <span
              v-for="(step, index) in steps"
              :key="step.id"
              class="h-1.5 rounded-full"
              :class="index <= currentStep ? 'bg-sky-500' : 'bg-white/10'"
            ></span>
          </div>

          <div class="mt-8">
            <div v-if="currentStep === 0" class="grid gap-5 md:grid-cols-2">
              <div>
                <label class="mb-2 block text-sm text-slate-400">Логін</label>
                <input v-model="form.username" type="text" placeholder="myhaven_user" class="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-2 block text-sm text-slate-400">Email</label>
                <input v-model="form.email" type="email" placeholder="you@example.com" class="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-2 block text-sm text-slate-400">Ім'я</label>
                <input v-model="form.first_name" type="text" placeholder="Ім'я" class="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none" />
              </div>
              <div>
                <label class="mb-2 block text-sm text-slate-400">Прізвище</label>
                <input v-model="form.last_name" type="text" placeholder="Прізвище" class="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none" />
              </div>
              <div class="md:col-span-2">
                <label class="mb-2 block text-sm text-slate-400">Пароль</label>
                <input v-model="form.password" type="password" placeholder="Мінімум 8 символів" class="w-full rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none" />
              </div>
            </div>

            <div v-else-if="currentStep === 1" class="grid gap-3">
              <button
                v-for="option in languageOptions"
                :key="option.value"
                type="button"
                class="flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition"
                :class="isSelected(form.language, option.value) ? 'border-sky-500/40 bg-sky-500/10' : 'border-white/10 bg-slate-950/20 hover:bg-white/5'"
                @click="form.language = option.value"
              >
                <div>
                  <p class="text-sm font-medium text-white">{{ option.label }}</p>
                  <p class="mt-1 text-sm text-slate-400">{{ option.hint }}</p>
                </div>
                <Check v-if="isSelected(form.language, option.value)" :size="18" class="text-sky-300" />
              </button>
            </div>

            <div v-else-if="currentStep === 2" class="grid gap-3 md:grid-cols-2">
              <button
                v-for="option in currencyOptions"
                :key="option.value"
                type="button"
                class="rounded-2xl border px-4 py-4 text-left transition"
                :class="isSelected(form.currency, option.value) ? 'border-sky-500/40 bg-sky-500/10' : 'border-white/10 bg-slate-950/20 hover:bg-white/5'"
                @click="form.currency = option.value"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <p class="text-base font-semibold text-white">{{ option.label }}</p>
                    <p class="mt-1 text-sm text-slate-400">{{ option.hint }}</p>
                  </div>
                  <span class="text-lg text-sky-300">{{ option.symbol }}</span>
                </div>
              </button>
            </div>

            <div v-else-if="currentStep === 3" class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <button
                v-for="option in trackingOptions"
                :key="option.value"
                type="button"
                class="rounded-2xl border px-4 py-4 text-left text-sm transition"
                :class="form.tracking_sources.includes(option.value) ? 'border-sky-500/40 bg-sky-500/10 text-white' : 'border-white/10 bg-slate-950/20 text-slate-300 hover:bg-white/5'"
                @click="toggleTracking(option.value)"
              >
                {{ option.label }}
              </button>
            </div>

            <div v-else class="grid gap-8">
              <div>
                <p class="mb-3 text-sm text-slate-400">Тема інтерфейсу</p>
                <div class="grid gap-3 md:grid-cols-3">
                  <button
                    v-for="option in themeOptions"
                    :key="option.value"
                    type="button"
                    class="rounded-2xl border px-4 py-4 text-left transition"
                    :class="isSelected(form.theme, option.value) ? 'border-sky-500/40 bg-sky-500/10' : 'border-white/10 bg-slate-950/20 hover:bg-white/5'"
                    @click="form.theme = option.value"
                  >
                    <p class="text-sm font-medium text-white">{{ option.label }}</p>
                    <p class="mt-1 text-sm text-slate-400">{{ option.hint }}</p>
                  </button>
                </div>
              </div>

              <div>
                <p class="mb-3 text-sm text-slate-400">Валюта відображення витрат</p>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="option in currencyOptions"
                    :key="option.value"
                    type="button"
                    class="rounded-xl border px-3 py-2 text-sm transition"
                    :class="isSelected(form.display_currency, option.value) ? 'border-sky-500/40 bg-sky-500/10 text-white' : 'border-white/10 bg-slate-950/20 text-slate-300 hover:bg-white/5'"
                    @click="form.display_currency = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>
            </div>

            <p v-if="errorMsg" class="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {{ errorMsg }}
            </p>

            <div class="mt-8 flex items-center justify-between gap-4">
              <button
                v-if="currentStep > 0"
                type="button"
                class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
                @click="previousStep"
              >
                <ChevronLeft :size="16" />
                Назад
              </button>
              <div v-else></div>

              <button
                v-if="!isLastStep"
                type="button"
                class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
                @click="nextStep"
              >
                Продовжити
                <ChevronRight :size="16" />
              </button>
              <button
                v-else
                type="button"
                :disabled="isSubmitting"
                class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-70"
                @click="submitRegistration"
              >
                {{ isSubmitting ? 'Створюємо акаунт…' : 'Створити акаунт' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
