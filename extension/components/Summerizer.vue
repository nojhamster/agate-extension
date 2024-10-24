<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useNow } from '@vueuse/core';

import HourButton from './HourButton.vue';
import ClockingButton from './ClockingButton.vue';

import {
  type Clocking,
  getClockings,
  getWorktime,
  hasUnfinishedClocking,
  stringToMinutes,
  minutesToString,
  dateToString,
  getPunchUrl,
} from '~/lib/utils';

const { userId = '', date = '', workRow } = defineProps({
  userId: String,
  date: String,
  workRow: HTMLElement,
});

const now = useNow({ interval: 10000 });
const loadingClockings = ref(false);
const clockings = ref<Clocking[]>([]);

const isToday = computed(() => workRow?.classList.contains('trToday'));

const hourButtons = computed(() => {
  return Array.from(workRow?.querySelectorAll('.hourButton') || []);
});

const leaveTime = computed(() => {
  return hourButtons.value
    .filter(button => button.querySelector('i.icon-os-absence'))
    .reduce((total, button) => total + stringToMinutes(button?.textContent || ''), 0);
  });

const teleworkTime = computed(() => {
  return hourButtons.value
    .filter(button => button.querySelector('i.mdi-home'))
    .reduce((total, button) => total + stringToMinutes(button?.textContent || ''), 0);
});

const lunchTime = computed(() => {
  let breakDuration = hourButtons.value
    .filter(button => button.querySelector('i.mdi-silverware-fork-knife'))
    .reduce((total, button) => total + stringToMinutes(button?.textContent || ''), 0);

  if (leaveTime.value + teleworkTime.value + breakDuration === 0 && clockings.value.length >= 2) {
    // If there are no break time, use the time between the two first clocking ranges
    // If a leave has been taken, we don't need to regulate the break time
    breakDuration = (clockings.value[1]?.clockIn - clockings.value[0]?.clockOut) || 0;
  }

  return breakDuration;
});

const regulation = computed(() => {
  let totalRegulation = hourButtons.value
    .filter(button => button.querySelector('i.mdi-alert'))
    .reduce((total, button) => total + stringToMinutes(button?.textContent || ''), 0);

  if (leaveTime.value + teleworkTime.value + totalRegulation === 0) {
    // Add a regulation to make sure that the break time is at least 45 minutes
    // Unnecessary if a leave has been taken, or if a regulation is already present
    const minBreakTime = 45;
    totalRegulation = Math.min(lunchTime.value - minBreakTime, 0);
  }

  return totalRegulation;
});

const worktime = computed(() => {
  console.log('WORKTIME', date);
  return getWorktime(clockings.value, now.value);
});

const theoricalTime = computed(() => {
  return stringToMinutes(workRow?.querySelector('.theoricalColumn')?.textContent ?? '');
});

const remaining = computed(() => {
  return theoricalTime.value - leaveTime.value - teleworkTime.value - worktime.value - regulation.value;
});

const endOfDay = computed(() => {
  const minToMs = 60000;
  return new Date(Date.now() + remaining.value * minToMs);
});

async function updateCloakings() {
  loadingClockings.value = true;

  try {
    clockings.value = await getClockings(userId, date);
  } catch (e) {
    console.error(e);
  } finally {
    loadingClockings.value = false;
  }

  if (isToday.value && hasUnfinishedClocking(clockings.value)) {

  }
};

if (isToday.value) {
  updateCloakings();
}

const recapItems = computed(() => {
  const items = [
    {
      label: 'Théorique',
      value: minutesToString(theoricalTime.value)
    },
    {
      label: 'Effectif',
      value: minutesToString(worktime.value * -1, { withSign: true }),
      hide: worktime.value === 0
    },
    {
      label: 'Congés',
      value: minutesToString(leaveTime.value * -1, { withSign: true }),
      hide: leaveTime.value === 0
    },
    {
      label: 'Télétravail',
      value: minutesToString(teleworkTime.value * -1, { withSign: true }),
      hide: teleworkTime.value === 0
    },
    {
      label: 'Régulations',
      value: minutesToString(regulation.value * -1, { withSign: true }),
      hide: regulation.value === 0
    },
    {
      label: remaining.value >= 0 ? 'Reste à faire' : 'Heures supp.',
      value: minutesToString(Math.abs(remaining.value)),
      bold: true
    },
  ];

  return items.filter(item => !item.hide);
});

function openClockings() {
  const punchUrl = getPunchUrl(userId, date, { withHost: false });
  workRow?.querySelector<HTMLAnchorElement>(`a[data-url="${punchUrl}"]`)?.click();
}

</script>

<template>
  <ClockingButton v-for="(cloaking, index) in clockings" :key="index" :clocking="cloaking" />

  <VMenu v-if="isToday">
    <HourButton :text="minutesToString(remaining)" icon="fa-clock-o" />

    <template #popper>
      <div class="ams-recap">
        <header>Temps de travail restant</header>

        <div class="ams-grid">
          <template v-for="item in recapItems" :key="item.label">
            <div :class="{ 'ams-font-bold': item.bold }">{{ item.label}}</div>
            <div :class="{ 'ams-font-bold': item.bold }">{{ item.value }}</div>
          </template>
        </div>
      </div>
    </template>
  </VMenu>

  <HourButton v-if="isToday" title="Fin de la journe" :text="dateToString(endOfDay)" icon="fa-flag-checkered" />
  <HourButton title="Plus d'informations" icon="fa-info" @click="updateCloakings" :loading="loadingClockings" />
  <HourButton title="Contrôle des pointages" icon="mdi-clock-edit-outline" @click="openClockings" />
</template>
