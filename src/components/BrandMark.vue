<script setup>
import logoWhite from '../assets/logo(white).png';

defineProps({
  alt: {
    type: String,
    default: 'MyHaven',
  },
  imageClass: {
    type: String,
    default: 'h-[72%] w-[72%] object-contain',
  },
});
</script>

<template>
  <div class="grid place-items-center overflow-hidden">
    <img :src="logoWhite" :alt="alt" :class="imageClass" />
  </div>
</template>
