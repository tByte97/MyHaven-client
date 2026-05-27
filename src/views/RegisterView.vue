<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-vue-next';
import BrandMark from '../components/BrandMark.vue';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const steps = ['Акаунт', 'Мова', 'Валюта', 'Джерела', 'Вигляд'];
const currentStep = ref(0);
const errorMsg = ref('');
const isSubmitting = ref(false);

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

const sourceOptions = [
  { value: 'manual', label: 'Ручні операції', desc: 'Додавайте витрати самостійно' },
  { value: 'telegram', label: 'Telegram-бот', desc: 'Швидкі записи через приватного бота' },
  { value: 'upload', label: 'Банківські виписки', desc: 'Імпорт CSV, XLSX або PDF' },
];

const themeOptions = [
  { value: 'light', label: 'Світла', desc: 'Світлий фон і чорний текст', gradient: 'from-[#FFFFFF] to-[#E8EEF6]' },
  { value: 'dark', label: 'Темна', desc: 'Темний фон і світлий текст', gradient: 'from-[#0A0F1E] to-[#1F2937]' },
  { value: 'auto', label: 'Авто', desc: 'За системною темою', gradient: 'from-[#FFFFFF] via-[#94A3B8] to-[#0A0F1E]' },
];

const isLastStep = computed(() => currentStep.value === steps.length - 1);

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
    errorMsg.value = 'Оберіть хоча б одне джерело.';
    return false;
  }
  return true;
}

function nextStep() {
  if (validateStep()) currentStep.value += 1;
}

function previousStep() {
  currentStep.value = Math.max(0, currentStep.value - 1);
  errorMsg.value = '';
}

function toggleSource(value) {
  const selected = new Set(form.value.tracking_sources);
  if (selected.has(value)) selected.delete(value);
  else selected.add(value);
  form.value.tracking_sources = Array.from(selected);
}

async function submitRegistration() {
  if (!validateStep()) return;
  isSubmitting.value = true;
  errorMsg.value = '';
  try {
    form.value.language = 'uk';
    form.value.currency = 'UAH';
    form.value.display_currency = 'UAH';
    const result = await authStore.register(form.value);
    if (result.requiresTotp) router.push('/login');
    else router.push('/dashboard');
  } catch (err) {
    const data = err.response?.data;
    errorMsg.value = data?.email?.[0] || data?.password?.[0] || data?.username?.[0] || 'Не вдалося завершити реєстрацію.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="min-h-screen flex items-center justify-center p-6">
    <div class="w-full max-w-3xl">
      <div class="flex items-center justify-between mb-10">
        <button class="flex items-center gap-2" @click="router.push('/login')">
          <BrandMark class="size-9 rounded-lg gradient-sky shadow-glow" image-class="h-[72%] w-[72%] object-contain" />
          <div class="font-accent text-lg">MyHaven</div>
        </button>
        <div class="text-xs text-[color:var(--app-muted)]">
          Крок <span class="text-white font-medium">{{ currentStep + 1 }}</span> з {{ steps.length }}
        </div>
      </div>

      <div class="flex gap-1.5 mb-10">
        <div v-for="(_, index) in steps" :key="index" class="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
          <div class="h-full gradient-sky transition-all duration-500" :style="{ width: index <= currentStep ? '100%' : '0%' }"></div>
        </div>
      </div>

      <div class="glass-strong rounded-2xl p-8 lg:p-10 shadow-elevated min-h-[480px]">
        <div class="text-xs uppercase tracking-[0.2em] text-sky-300 mb-2">{{ steps[currentStep] }}</div>

        <div v-if="currentStep === 0">
          <h2 class="font-accent text-3xl text-white mb-1">Створімо ваш простір.</h2>
          <p class="text-sm text-[color:var(--app-muted)] mb-8">Базові дані для входу й профілю.</p>
          <div class="grid sm:grid-cols-2 gap-4">
            <label class="space-y-1.5">
              <span class="text-xs text-[color:var(--app-muted)]">Ім'я</span>
              <input v-model="form.first_name" class="mh-input" />
            </label>
            <label class="space-y-1.5">
              <span class="text-xs text-[color:var(--app-muted)]">Прізвище</span>
              <input v-model="form.last_name" class="mh-input" />
            </label>
            <label class="space-y-1.5">
              <span class="text-xs text-[color:var(--app-muted)]">Логін</span>
              <input v-model="form.username" class="mh-input" />
            </label>
            <label class="space-y-1.5">
              <span class="text-xs text-[color:var(--app-muted)]">Email</span>
              <input v-model="form.email" type="email" class="mh-input" />
            </label>
            <label class="space-y-1.5 sm:col-span-2">
              <span class="text-xs text-[color:var(--app-muted)]">Пароль</span>
              <input v-model="form.password" type="password" class="mh-input" />
            </label>
          </div>
        </div>

        <div v-else-if="currentStep === 1">
          <h2 class="font-accent text-3xl text-white mb-1">Мова інтерфейсу.</h2>
          <p class="text-sm text-[color:var(--app-muted)] mb-8">MyHaven буде працювати українською.</p>
          <button type="button" class="w-full text-left p-4 rounded-xl border border-sky-400/40 bg-sky-500/10">
            <div class="font-medium text-white">Українська</div>
            <div class="text-xs text-[color:var(--app-muted)]">Україна · uk-UA</div>
            <Check class="absolute" />
          </button>
        </div>

        <div v-else-if="currentStep === 2">
          <h2 class="font-accent text-3xl text-white mb-1">Основна валюта.</h2>
          <p class="text-sm text-[color:var(--app-muted)] mb-8">Суми зберігаються й відображаються у гривні.</p>
          <div class="p-4 rounded-xl border border-sky-400/40 bg-sky-500/10 flex items-center gap-3">
            <div class="size-10 rounded-lg bg-sky-500/15 text-sky-300 font-accent text-xl grid place-items-center">₴</div>
            <div>
              <div class="font-medium text-white">UAH</div>
              <div class="text-xs text-[color:var(--app-muted)]">Українська гривня</div>
            </div>
          </div>
        </div>

        <div v-else-if="currentStep === 3">
          <h2 class="font-accent text-3xl text-white mb-1">Як відстежуємо гроші?</h2>
          <p class="text-sm text-[color:var(--app-muted)] mb-8">Оберіть сценарії, які плануєте використовувати.</p>
          <div class="grid md:grid-cols-3 gap-3">
            <button
              v-for="source in sourceOptions"
              :key="source.value"
              type="button"
              class="text-left p-4 rounded-xl border transition"
              :class="form.tracking_sources.includes(source.value) ? 'border-sky-400/40 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'"
              @click="toggleSource(source.value)"
            >
              <div class="font-medium text-white">{{ source.label }}</div>
              <div class="text-xs text-[color:var(--app-muted)] mt-1">{{ source.desc }}</div>
            </button>
          </div>
        </div>

        <div v-else>
          <h2 class="font-accent text-3xl text-white mb-1">Фінальний штрих.</h2>
          <p class="text-sm text-[color:var(--app-muted)] mb-8">Оберіть тему, з якою відкриється ваш простір.</p>
          <div class="grid md:grid-cols-3 gap-4">
            <button
              v-for="theme in themeOptions"
              :key="theme.value"
              type="button"
              class="text-left rounded-xl border overflow-hidden transition"
              :class="form.theme === theme.value ? 'border-sky-400/50 ring-1 ring-sky-400/30 bg-sky-500/10' : 'border-white/10 bg-white/5 hover:bg-white/10'"
              @click="form.theme = theme.value"
            >
              <div class="h-24 bg-gradient-to-br" :class="theme.gradient"></div>
              <div class="p-4">
                <div class="font-medium text-white">{{ theme.label }}</div>
                <div class="text-xs text-[color:var(--app-muted)]">{{ theme.desc }}</div>
              </div>
            </button>
          </div>

          <div class="mt-8 p-4 rounded-xl bg-white/5 border border-white/10">
            <div class="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--app-muted)] mb-3">
              <Sparkles :size="14" class="text-sky-300" /> Підсумок
            </div>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div><p class="text-[10px] uppercase tracking-widest text-[color:var(--app-muted)]">Мова</p><p class="font-medium text-white mt-1">Українська</p></div>
              <div><p class="text-[10px] uppercase tracking-widest text-[color:var(--app-muted)]">Валюта</p><p class="font-medium text-white mt-1">UAH</p></div>
              <div><p class="text-[10px] uppercase tracking-widest text-[color:var(--app-muted)]">Тема</p><p class="font-medium text-white mt-1">{{ form.theme }}</p></div>
              <div><p class="text-[10px] uppercase tracking-widest text-[color:var(--app-muted)]">Джерела</p><p class="font-medium text-white mt-1">{{ form.tracking_sources.length }}</p></div>
            </div>
          </div>
        </div>

        <p v-if="errorMsg" class="mt-5 rounded-md border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {{ errorMsg }}
        </p>
      </div>

      <div class="flex justify-between mt-6">
        <button class="mh-button-secondary" @click="currentStep === 0 ? router.push('/login') : previousStep()">
          <ChevronLeft :size="17" /> {{ currentStep === 0 ? 'До входу' : 'Назад' }}
        </button>
        <button v-if="!isLastStep" class="mh-button-primary" @click="nextStep">
          Продовжити <ChevronRight :size="17" />
        </button>
        <button v-else class="mh-button-primary" :disabled="isSubmitting" @click="submitRegistration">
          <Loader2 v-if="isSubmitting" :size="17" class="animate-spin" />
          <template v-else><Check :size="17" /> Створити акаунт</template>
        </button>
      </div>
    </div>
  </section>
</template>
