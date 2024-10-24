import { createApp } from 'vue';
import { Menu, vTooltip } from 'floating-vue'
import Summerizer from '@/components/Summerizer.vue';

import 'floating-vue/dist/style.css';
import './style.css';

export default defineContentScript({
  matches: [
    '*://agate-tempo.cnrs.fr/*/time/sheet/*/month/*/*',
    '*://agate-tempo.cnrs.fr/*/time/sheet/*/week/*/*'
  ],
  runAt: 'document_idle',
  main() {
    const userId = /^\/\w+\/time\/sheet\/(\d+)/.exec(window.location.pathname)?.[1];

    document
      .querySelectorAll('tr.work:not(.notworkedTr)')
      .forEach((workRow) => {
        const clockingsCell = workRow.querySelector('.hourButtonDropdown')?.parentElement || workRow.querySelector('td:nth-child(3)');
        const rowDate = /td-(\d+-\d+-\d+)/.exec(workRow.getAttribute('id') ?? '')?.[1];

        if (!clockingsCell) { return; }
        if (!rowDate) { return; }

        const summary = document.createElement('div');
        summary.classList.add('ams-summary', 'float-end');
        clockingsCell.appendChild(summary);

        const app = createApp(Summerizer, { userId, date: rowDate, workRow });
        app.component('VMenu', Menu);
        app.directive('tooltip', vTooltip);
        app.mount(summary);
      });
  },
});


