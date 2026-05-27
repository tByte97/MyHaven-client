<script setup>
import { computed, onMounted, ref } from 'vue';
import api from '../stores/api';
import { usePreferencesStore } from '../stores/preferences';
import PageHeader from '../components/PageHeader.vue';
import {
  AlertCircle,
  Check,
  File as FileIcon,
  FileSpreadsheet,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-vue-next';

const preferences = usePreferencesStore();

const uploads = ref([]);
const banks = ref([]);
const isLoading = ref(true);
const isUploading = ref(false);
const dragOver = ref(false);
const selectedBank = ref('');
const selectedFile = ref(null);
const uploadProgress = ref(0);
const uploadName = ref('');
const fileInput = ref(null);

const statusConfig = {
  COMPLETED: { icon: Check, label: 'Готово', class: 'bg-emerald-500/15 text-success' },
  DONE: { icon: Check, label: 'Готово', class: 'bg-emerald-500/15 text-success' },
  FAILED: { icon: AlertCircle, label: 'Помилка', class: 'bg-rose-500/15 text-danger' },
  PENDING: { icon: Loader2, label: 'Очікує', class: 'bg-amber-500/15 text-warning' },
  PROCESSING: { icon: Loader2, label: 'Обробка', class: 'bg-sky-500/15 text-sky-300', spin: true },
};

const selectedBankInfo = computed(() => banks.value.find((bank) => String(bank.id) === String(selectedBank.value)));

function normalizeStatus(status) {
  return String(status || 'PENDING').toUpperCase();
}

function uploadStatus(upload) {
  return statusConfig[normalizeStatus(upload.status)] || statusConfig.PENDING;
}

function bankColor(bank, index = 0) {
  const palette = ['#1f7aff', '#30d69a', '#f5ba45', '#f06464', '#9f7aea', '#47c7ff'];
  return bank?.color || palette[index % palette.length];
}

function uploadBankName(upload) {
  return upload.bank_name || upload.bank?.name || banks.value.find((bank) => bank.id === upload.bank)?.name || 'Невідомий банк';
}

function uploadBank(upload) {
  return upload.bank && typeof upload.bank === 'object'
    ? upload.bank
    : banks.value.find((bank) => String(bank.id) === String(upload.bank));
}

function uploadFileName(upload) {
  return upload.filename || upload.original_filename || upload.file_name || upload.name || 'Банківська виписка';
}

function uploadSize(upload) {
  const size = Number(upload.size || upload.file_size || 0);
  if (!size) return null;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} КБ`;
  return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

function transactionsCount(upload) {
  return upload.transactionsCount || upload.transactions_count || upload.total_transactions || 0;
}

function formatDate(value) {
  if (!value) return 'Дата невідома';
  return preferences.formatDate(value, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function fetchUploads() {
  isLoading.value = true;
  try {
    const res = await api.getUploads();
    uploads.value = res.data || [];
  } catch (error) {
    console.error(error);
  } finally {
    isLoading.value = false;
  }
}

async function fetchBanks() {
  try {
    const res = await api.getBanks();
    banks.value = res.data || [];
    if (!selectedBank.value && banks.value.length) {
      selectedBank.value = banks.value[0].id;
    }
  } catch (error) {
    console.error(error);
  }
}

function onFileSelect(event) {
  const file = event.target.files?.[0];
  if (file) selectedFile.value = file;
}

function onDrop(event) {
  event.preventDefault();
  dragOver.value = false;
  const file = event.dataTransfer.files?.[0];
  if (file) {
    selectedFile.value = file;
    uploadFile();
  }
}

async function uploadFile() {
  if (!selectedFile.value || !selectedBank.value) {
    alert('Оберіть банк та файл');
    return;
  }

  isUploading.value = true;
  uploadProgress.value = 0;
  uploadName.value = selectedFile.value.name;

  try {
    const formData = new FormData();
    formData.append('bank', selectedBank.value);
    formData.append('file', selectedFile.value);

    await api.uploadFile(formData, {
      onUploadProgress: (event) => {
        if (!event.total) return;
        uploadProgress.value = Math.round((event.loaded * 100) / event.total);
      },
    });

    selectedFile.value = null;
    uploadProgress.value = 100;
    if (fileInput.value) fileInput.value.value = '';
    await fetchUploads();
  } catch (error) {
    console.error(error);
    alert('Помилка завантаження файлу');
  } finally {
    setTimeout(() => {
      isUploading.value = false;
      uploadProgress.value = 0;
      uploadName.value = '';
    }, 450);
  }
}

async function deleteUpload(id) {
  if (!confirm('Видалити цю виписку та всі пов’язані транзакції?')) return;
  try {
    await api.deleteUpload(id);
    await fetchUploads();
  } catch (error) {
    console.error(error);
    alert('Не вдалося видалити виписку');
  }
}

onMounted(() => {
  fetchBanks();
  fetchUploads();
});
</script>

<template>
  <div>
    <PageHeader
      eyebrow="Імпорт"
      title="Виписки та файли"
      subtitle="Завантажуйте банківські виписки, відстежуйте обробку й керуйте імпортованими даними."
    >
      <template #actions>
        <button class="mh-button-secondary" type="button" @click="fetchUploads">
          <RefreshCw :size="17" /> Оновити
        </button>
      </template>
    </PageHeader>

    <div class="grid lg:grid-cols-[1fr_400px] gap-4">
      <section class="glass-strong rounded-xl p-5 lg:p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
          <div>
            <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Банк-джерело</p>
            <h2 class="font-accent text-2xl text-[color:var(--app-heading)] mt-1">Звідки ця виписка?</h2>
          </div>
          <select v-model="selectedBank" class="mh-select md:w-56">
            <option value="" disabled>Оберіть банк</option>
            <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
          </select>
        </div>

        <div
          class="relative rounded-xl border-2 border-dashed py-14 px-4 text-center transition-all"
          :class="dragOver ? 'border-sky-400 bg-sky-500/10 scale-[1.01]' : 'border-[color:var(--app-border)] bg-[color:var(--app-soft)] hover:border-sky-400/60'"
          @dragover.prevent="dragOver = true"
          @dragleave="dragOver = false"
          @drop="onDrop"
        >
          <input
            ref="fileInput"
            type="file"
            accept=".pdf,.csv,.xlsx,.xls"
            hidden
            @change="onFileSelect"
          />

          <div class="size-14 mx-auto rounded-xl gradient-sky shadow-glow grid place-items-center mb-4">
            <Upload :size="24" class="text-white" />
          </div>
          <h3 class="font-accent text-2xl text-[color:var(--app-heading)] mb-1">Перетягніть виписку сюди</h3>
          <p class="text-sm text-[color:var(--app-muted)] mb-5">
            або виберіть PDF, CSV чи Excel-файл вручну.
          </p>

          <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button class="mh-button-secondary" type="button" @click="fileInput?.click()">
              <FileIcon :size="17" /> Обрати файл
            </button>
            <button
              class="mh-button-primary"
              type="button"
              :disabled="isUploading || !selectedFile"
              @click="uploadFile"
            >
              <Upload :size="17" /> {{ isUploading ? 'Завантажуємо...' : 'Завантажити' }}
            </button>
          </div>

          <p v-if="selectedFile && !isUploading" class="mt-4 text-sm text-[color:var(--app-muted)]">
            Обрано: <span class="text-[color:var(--app-heading)] font-medium">{{ selectedFile.name }}</span>
            <span v-if="selectedBankInfo"> · {{ selectedBankInfo.name }}</span>
          </p>

          <div v-if="isUploading" class="absolute inset-x-5 bottom-5 glass-strong rounded-lg p-4 text-left">
            <div class="flex items-center justify-between gap-3 text-sm mb-2">
              <div class="flex items-center gap-2 min-w-0">
                <Loader2 :size="16" class="animate-spin text-sky-300 shrink-0" />
                <span class="truncate">{{ uploadName }}</span>
              </div>
              <span class="tabular text-[color:var(--app-muted)]">{{ uploadProgress }}%</span>
            </div>
            <div class="h-1.5 rounded-full bg-[color:var(--app-soft)] overflow-hidden">
              <div class="h-full gradient-sky transition-all" :style="{ width: uploadProgress + '%' }"></div>
            </div>
          </div>
        </div>

        <div class="grid sm:grid-cols-3 gap-3 mt-4">
          <div class="rounded-lg bg-[color:var(--app-soft)] border border-[color:var(--app-border)] p-3">
            <FileText :size="17" class="text-sky-300 mb-2" />
            <div class="text-sm font-semibold">PDF</div>
            <div class="text-xs text-[color:var(--app-muted)]">Банківські виписки</div>
          </div>
          <div class="rounded-lg bg-[color:var(--app-soft)] border border-[color:var(--app-border)] p-3">
            <FileSpreadsheet :size="17" class="text-success mb-2" />
            <div class="text-sm font-semibold">CSV</div>
            <div class="text-xs text-[color:var(--app-muted)]">Експортовані таблиці</div>
          </div>
          <div class="rounded-lg bg-[color:var(--app-soft)] border border-[color:var(--app-border)] p-3">
            <FileSpreadsheet :size="17" class="text-warning mb-2" />
            <div class="text-sm font-semibold">Excel</div>
            <div class="text-xs text-[color:var(--app-muted)]">XLSX та XLS</div>
          </div>
        </div>
      </section>

      <aside class="glass-strong rounded-xl p-5">
        <p class="text-xs uppercase tracking-[0.22em] text-[color:var(--app-muted)]">Історія</p>
        <h2 class="font-accent text-2xl text-[color:var(--app-heading)] mt-1 mb-4">Останні імпорти</h2>

        <div v-if="isLoading" class="py-12 text-center text-sm text-[color:var(--app-muted)]">
          Завантаження виписок...
        </div>

        <div v-else class="space-y-2">
          <div v-if="!uploads.length" class="py-10 text-center text-sm text-[color:var(--app-muted)]">
            <FileText :size="42" class="mx-auto mb-3 text-white/25" />
            Виписок ще немає.
          </div>

          <article
            v-for="(upload, index) in uploads"
            :key="upload.id"
            class="group rounded-lg bg-[color:var(--app-soft)] border border-[color:var(--app-border)] p-3 transition hover:bg-[color:var(--app-soft-hover)]"
          >
            <div class="flex items-start gap-3">
              <div class="size-9 rounded-md bg-sky-500/15 text-sky-300 grid place-items-center shrink-0">
                <FileIcon :size="17" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="text-sm font-semibold truncate text-[color:var(--app-heading)]">{{ uploadFileName(upload) }}</div>
                <div class="flex items-center gap-2 text-xs text-[color:var(--app-muted)] mt-1">
                  <span class="size-1.5 rounded-full shrink-0" :style="{ background: bankColor(uploadBank(upload), index) }"></span>
                  <span class="truncate">{{ uploadBankName(upload) }}</span>
                  <span>·</span>
                  <span>{{ uploadSize(upload) || formatDate(upload.uploaded_at || upload.created_at) }}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    class="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
                    :class="uploadStatus(upload).class"
                  >
                    <component
                      :is="uploadStatus(upload).icon"
                      :size="12"
                      :class="{ 'animate-spin': uploadStatus(upload).spin }"
                    />
                    {{ uploadStatus(upload).label }}
                  </span>
                  <span class="text-xs text-[color:var(--app-muted)] tabular">
                    {{ transactionsCount(upload) }} транзакцій
                  </span>
                </div>
              </div>
              <button
                class="size-8 rounded-md text-[color:var(--app-muted)] hover:bg-rose-500/15 hover:text-danger transition lg:opacity-0 lg:group-hover:opacity-100 grid place-items-center"
                type="button"
                aria-label="Видалити виписку"
                @click="deleteUpload(upload.id)"
              >
                <Trash2 :size="16" />
              </button>
            </div>
          </article>
        </div>
      </aside>
    </div>
  </div>
</template>
