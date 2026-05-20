<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useUserConfigStore } from '../stores/userConfig';

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const route = useRoute();
const router = useRouter();
const userConfig = useUserConfigStore();

const draggingId = ref(null);
const dragOverId = ref(null);
const isHidden = ref(false);
const isHovering = ref(false);
const lastScrollY = ref(0);

const orderedItems = computed(() => {
  const order = userConfig.config.navOrder || [];
  const byId = new Map(props.items.map((item) => [item.id, item]));
  const sorted = order.map((id) => byId.get(id)).filter(Boolean);
  props.items.forEach((item) => {
    if (!order.includes(item.id)) {
      sorted.push(item);
    }
  });
  return sorted;
});

function navigate(to) {
  router.push(to);
}

function onDragStart(id) {
  draggingId.value = id;
}

function onDragOver(event, id) {
  event.preventDefault();
  dragOverId.value = id;
}

function onDrop(id) {
  if (!draggingId.value || draggingId.value === id) return;
  const order = [...(userConfig.config.navOrder || [])];
  if (!order.length) {
    order.push(...props.items.map((item) => item.id));
  }
  const fromIndex = order.indexOf(draggingId.value);
  const toIndex = order.indexOf(id);
  if (fromIndex === -1 || toIndex === -1) return;
  order.splice(fromIndex, 1);
  order.splice(toIndex, 0, draggingId.value);
  userConfig.setNavOrder(order);
  dragOverId.value = null;
}

function onDragEnd() {
  draggingId.value = null;
  dragOverId.value = null;
}

function showDock() {
  isHidden.value = false;
}

function handleScroll() {
  const currentY = window.scrollY || 0;
  const delta = currentY - lastScrollY.value;
  if (delta > 8 && currentY > 120 && !isHovering.value) {
    isHidden.value = true;
  } else if (delta < -8) {
    isHidden.value = false;
  }
  lastScrollY.value = currentY;
}

onMounted(() => {
  lastScrollY.value = window.scrollY || 0;
  window.addEventListener('scroll', handleScroll, { passive: true });
  if (!userConfig.config.navOrder || !userConfig.config.navOrder.length) {
    userConfig.setNavOrder(props.items.map((item) => item.id));
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <div class="fixed inset-x-0 bottom-4 z-50 flex justify-center pointer-events-none">
    <div
      class="relative pointer-events-auto"
      @mouseenter="() => { isHovering = true; showDock(); }"
      @mouseleave="() => { isHovering = false; }"
    >
      <div
        class="absolute inset-x-6 -top-6 h-6 bg-gradient-to-t from-white/60 dark:from-black/40 to-transparent"
      ></div>
      <nav
        class="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/30 dark:border-white/10 bg-white/70 dark:bg-dark-card/60 backdrop-blur-xl shadow-xl shadow-black/10 transition-all duration-300"
        :class="isHidden ? 'translate-y-10 opacity-70' : 'translate-y-0 opacity-100'"
      >
        <button
          v-for="item in orderedItems"
          :key="item.id"
          type="button"
          class="group flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          :class="[
            route.path === item.to
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
              : 'text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10',
            dragOverId === item.id ? 'ring-2 ring-teal-400' : '',
          ]"
          draggable="true"
          @dragstart="onDragStart(item.id)"
          @dragover="(event) => onDragOver(event, item.id)"
          @drop="() => onDrop(item.id)"
          @dragend="onDragEnd"
          @click="navigate(item.to)"
        >
          <component :is="item.icon" :size="18" class="opacity-80 group-hover:opacity-100" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
    </div>
  </div>
</template>
