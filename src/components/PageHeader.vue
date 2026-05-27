<template>
  <header class="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-8">
    <div>
      <p v-if="eyebrow" class="text-xs uppercase tracking-[0.3em] text-[color:var(--app-muted)] mb-2">
        {{ eyebrow }}
      </p>
      <h1 class="font-accent text-3xl sm:text-4xl text-white leading-tight">{{ title }}</h1>
      <p v-if="subtitle" class="text-sm text-[color:var(--app-muted)] mt-2 max-w-2xl">{{ subtitle }}</p>
    </div>
    <div v-if="$slots.actions" class="flex flex-wrap items-center gap-3">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
});
</script>
