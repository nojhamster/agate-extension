<script lang="ts" setup>
import { useSlots } from 'vue';

const {
  text,
  title,
  icon,
  loading,
} = defineProps({
  title: String,
  text: String,
  icon: String,
  loading: Boolean,
});

const iconClass = computed(() => {
  let iClass: string | undefined;

  if (loading) {
    iClass = 'fa fa-pulse fa-spinner';
  } else if (icon) {
    const iconFamily = /^[a-z]+/.exec(icon)?.[0] || 'fa';
    iClass = `${iconFamily} ${icon}`;
  }

  if (iClass && (text || useSlots().default))  {
    iClass += ' me-1';
  }

  return iClass;
});

</script>

<template>
  <button @click.prevent class="ams-button" v-tooltip="title">
    <i v-if="iconClass" :class="iconClass"></i>
    <slot>{{ text }}</slot>
  </button>
</template>
