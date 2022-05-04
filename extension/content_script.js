(function () {
  'use strict'

  if (document.readyState === 'complete') {
    startAgateScript()
  } else {
    window.addEventListener('load', startAgateScript)
  }

  function startAgateScript() {
    insertStyles();

    const userId = /^\/\w+\/time\/sheet\/(\d+)/.exec(window.location.pathname)?.[1];

    document
      .querySelectorAll('tr.work:not(.notworkedTr)')
      .forEach((workRow) => {
        const cell = workRow.querySelector('.hourButton')?.parentElement || workRow.querySelector('td:nth-child(3)');
        const infoButton = document.createElement('button');

        infoButton.classList.add('btn', 'ams-btn', 'ams-float-right', 'ams-ml-4');
        infoButton.setAttribute('title', 'Plus d\'informations');
        infoButton.innerHTML = '<i class="fa fa-info"></i>';
        infoButton.addEventListener('click', () => {
          summerize(workRow).catch((e) => {
            console.error('Failed to summerize row');
            console.error(e);
          });
        });

        const checkClockingsButton = document.createElement('a');

        const rowDate = /td-(\d+-\d+-\d+)/.exec(workRow.getAttribute('id'))?.[1];

        checkClockingsButton.classList.add('btn', 'ams-btn', 'ams-float-right', 'ams-ml-4');
        checkClockingsButton.setAttribute('href', getPunchUrl(rowDate));
        checkClockingsButton.setAttribute('title', 'Voir les pointages du jour');
        checkClockingsButton.innerHTML = '<i class="fa fa-history fa-lg"></i>';

        cell.appendChild(checkClockingsButton);
        cell.appendChild(infoButton);

        if (workRow.classList.contains('trToday')) {
          summerize(workRow).catch((e) => {
            console.error('Failed to summerize row');
            console.error(e);
          });
        }
      });

    async function summerize(workRow) {
      const clockingsCell = workRow.querySelector('.hourButton')?.parentElement || workRow.querySelector('td:nth-child(3)');

      if (!clockingsCell) { return; }

      let summary = clockingsCell.querySelector('.ams-summary');

      if (!summary) {
        summary = document.createElement('div');
        summary.classList.add('ams-summary', 'ams-float-right');
        clockingsCell.appendChild(summary);
      }

      summary.innerHTML = '';

      const rowDate = /td-(\d+-\d+-\d+)/.exec(workRow.getAttribute('id'))?.[1];

      const spinnerButton = createSpinnerButton();
      summary.appendChild(spinnerButton);

      let clockings;
      try {
        clockings = await getClockings(rowDate);
      } catch (e) {
        console.error('Failed to download clockings of current date');
        console.error(e);
      } finally {
        summary.removeChild(spinnerButton);
      }

      if (Array.isArray(clockings)) {
        clockings.forEach((clocking) => {
          summary.appendChild(createClockingButton(clocking));
        });
      }

      // We only need to calculate the end of day for the current date
      if (!workRow.classList.contains('trToday')) {
        return;
      }

      const dailyTotal = stringToMinutes(workRow.querySelector('.theoricalColumn')?.textContent);

      let regulation = 0;
      let breakTime = 0;
      let leaveTaken = false;

      workRow
        .querySelectorAll('.hourButton')
        .forEach((item) => {
          if (item.querySelector('i.fa-cutlery')) {
            breakTime += stringToMinutes(item?.textContent);
            return;
          }
          if (item.querySelector('i.icon-os-absence')) {
            leaveTaken = true;
            regulation += stringToMinutes(item?.textContent);
            return;
          }
          if (item.classList.contains('withoutValidation')) {
            regulation += stringToMinutes(item?.textContent);
          }
        });

      const minBreakTime = 45;

      if (!leaveTaken && breakTime === 0) {
        // If there are no break time, use the time between the two first clocking ranges
        // If a leave has been taken, we don't need to regulate the break time

        if (clockings.length >= 2) {
          breakTime = (clockings[1]?.clockIn - clockings[0]?.clockOut) || 0;
        }
        regulation += (breakTime - minBreakTime);
      }

      const remainingButton = document.createElement('button');
      remainingButton.classList.add('btn', 'ams-btn');
      remainingButton.setAttribute('title', 'Temps de travail restant');
      remainingButton.innerHTML = `
        <i class="fa fa-clock-o"></i>
        <span class="text"></span>
      `;

      const endOfDayButton = document.createElement('button');
      endOfDayButton.classList.add('btn', 'ams-btn');
      endOfDayButton.setAttribute('title', 'Fin de la journée');
      endOfDayButton.innerHTML = `
        <i class="fa fa-flag-checkered"></i>
        <span class="text"></span>
      `;

      const minToMs   = 60000;
      const worktime  = getWorktime(clockings);
      const remaining = dailyTotal - worktime - regulation;
      const endOfDay  = new Date(Date.now() + remaining * minToMs);

      remainingButton.querySelector('.text').textContent = minutesToString(remaining);
      endOfDayButton.querySelector('.text').textContent = dateToString(endOfDay);

      summary.appendChild(remainingButton);
      summary.appendChild(endOfDayButton);
    }

    function createSpinnerButton() {
      const spinnerButton = document.createElement('button');
      spinnerButton.classList.add('btn', 'ams-btn');
      spinnerButton.setAttribute('title', 'Chargement...');
      spinnerButton.innerHTML = '<i class="fa fa-pulse fa-spinner"></i>';
      return spinnerButton;
    }

    function createClockingButton({ clockIn, clockOut }) {
      let clockRange = 0;

      if (clockIn && clockOut) {
        clockRange = clockOut - clockIn;
      } else if (clockIn) {
        const now = new Date()
        clockRange = (now.getHours() * 60) + now.getMinutes() - clockIn;
      }

      const button = document.createElement('button');
      button.classList.add('btn', 'ams-btn-primary');
      button.setAttribute('title', minutesToString(clockRange));
      button.innerHTML = `
        ${clockIn ? minutesToString(clockIn) : '...'}
        <i class="fa fa-angle-right"></i>
        ${clockOut ? minutesToString(clockOut) : '...'}
      `;
      return button;
    }

    /**
     * Get the total worktime based on clockings
     */
    function getWorktime (clockings) {
      let worktime = 0

      if (Array.isArray(clockings) && clockings.length > 0) {
        clockings.forEach(({ clockIn, clockOut }) => {
          if (clockIn && clockOut) {
            // For each clock-in/clock-out couple, add the period to the work time
            worktime += (clockOut - clockIn)
          } else if (clockIn) {
            // If the clock-in has no associated clock-out, add the period going from clock-in to current time
            const now = new Date()
            worktime += (now.getHours() * 60) + now.getMinutes() - clockIn
          }
        })
      }

      return worktime
    }

    /**
     * Convert a string (..h.. or -..h..) into a number of minutes
     * @param {String} str
     */
    function stringToMinutes (str) {
      const match = /^(-)?\s*(\d+)[h:](\d+)$/.exec((str || '').trim())
      if (!match) { return 0 }

      const minutes = (parseInt(match[2]) * 60) + parseInt(match[3])

      return match[1] ? minutes * -1 : minutes
    }

    /**
     * Take a number of minutes and return a formated string (..h.. or -..h..)
     * @param {Integer} nbMinutes
     */
    function minutesToString (nbMinutes) {
      if (!nbMinutes && nbMinutes !== 0) { return 'N/A' }

      let hours = Math.floor(Math.abs(nbMinutes / 60)).toString().padStart(2, '0');
      let minutes = Math.abs(nbMinutes % 60).toString().padStart(2, '0');

      return nbMinutes >= 0 ? `${hours}h${minutes}` : `-${hours}h${minutes}`
    }

    /**
     * Take a date and return a formated string (..h.. or -..h..)
     * @param {Integer} date
     */
    function dateToString(date) {
      if (!date) { return 'N/A'; }

      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');

      return `${hours}h${minutes}`;
    }

    function getPunchUrl(date) {
      return `${window.location.origin}/fr/time/punch/${userId}/${date}`;
    }

    /**
     * Get clockings of the given date
     */
    function getClockings(date) {
      return fetch(getPunchUrl(date))
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }
          return response.text();
        })
        .then((text) => {
          const parser = new DOMParser();
          const clockingPage = parser.parseFromString(text, 'text/html');
          const clockings = [];

          const inputs = clockingPage.querySelectorAll('#punches_collection tr:not(.tr-punch-canceled) input[type=time]');

          for (let i = 0; i < inputs.length; i += 2) {
            clockings.push({
              clockIn: stringToMinutes(inputs[i]?.value),
              clockOut: stringToMinutes(inputs[i + 1]?.value),
            });
          }

          return clockings;
        });
    }

    /**
     * Insert extension specific styles in the document head
     */
    function insertStyles() {
      const style = document.createElement('style');

      style.textContent = `
        .ams-float-right
        {
          float: right;
        }

        .ams-summary > button,
        .ams-ml-4
        {
          margin-left: 4px;
        }

        .ams-btn {
          background-color: transparent;
          color: #444;
          border-color: #AAA;
          min-width: 30px;
        }
        .ams-btn-primary {
          background-color: transparent;
          color: #4583aa;
          border-color: #4583aa;
        }
        .bankHolidayTr {
          background: repeating-linear-gradient(45deg, #ffe7b8, #ffe7b8 10px, #ffffff 10px, #ffffff 20px);
        }
      `;

      document.head.appendChild(style);
    }
  }
})()