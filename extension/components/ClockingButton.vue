<script lang="ts" setup>
import HourButton from './HourButton.vue';
import { type Clocking, minutesToString } from '~/lib/utils';

const {
  clocking,
} = defineProps({
  clocking: {
    type: Object as PropType<Clocking>,
    required: true,
  }
});

const { clockIn, clockOut } = clocking;

const clockDuration = computed(() => {
  let clockRange = 0;

  if (clockIn && clockOut) {
    clockRange = clockOut - clockIn;
  } else if (clockIn) {
    const now = new Date()
    clockRange = (now.getHours() * 60) + now.getMinutes() - clockIn;
  }

  return minutesToString(clockRange);
});

</script>

<template>
  <HourButton :title="clockDuration">
    {{ clocking.clockIn ? minutesToString(clocking.clockIn) : '...' }}
    <i class="fa fa-angle-right"></i>
    {{ clocking.clockOut ? minutesToString(clocking.clockOut) : '...' }}
  </HourButton>
</template>
