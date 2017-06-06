(function () {
  'use strict'

  if (!document.querySelector('#fiche_pointage .jour_courant')) { return }

  const monthlyDiff = stringToDuration(getTextOf('#fiche_pointage tfoot .diff'))
  const dailyTotal  = stringToDuration(getTextOf('#fiche_pointage .jour_courant .champs_temps_theorique'))
  const dailyBreak  = stringToDuration(getTextOf('#fiche_pointage .jour_courant .champs_pause'))
  const transfered  = stringToDuration(getTransferedTime())
  const clockings   = getClockings()

  const worktime  = moment.duration(0).add(dailyBreak).subtract(45, 'm')
  const remaining = moment.duration(0).add(dailyTotal)

  if (clockings.length > 0) {
    clockings.forEach(({ clockIn, clockOut }) => {
      if (clockIn && clockOut) {
        // For each in/out couple, add the period to the worktime
        worktime.add(clockOut).subtract(clockIn)
      }
    })

    const { clockIn: lastClockIn, clockOut: lastClockOut } = clockings[clockings.length - 1]

    if (lastClockIn && !lastClockOut) {
      // If the last clockin has no associated clockout, add the period going from clockin to current time
      worktime.add(moment().hours(), 'h').add(moment().minutes(), 'm').subtract(lastClockIn)
    }
  }

  remaining.subtract(worktime)

  const endOfDay    = moment().add(remaining)
  const currentDiff = moment.duration(0).add(monthlyDiff).add(transfered)
  const recapBody   = document.querySelector('#recap_mensuel > tbody')

  recapBody.appendChild(createHeaderRow(), recapBody.firstChild)
  recapBody.appendChild(createRow('Temps de travail effectif', durationToString(worktime)), recapBody.firstChild)
  recapBody.appendChild(createRow('Reste à faire', durationToString(remaining)), recapBody.firstChild)
  recapBody.appendChild(createRow('Fin de la journée', endOfDay.format('HH[h]mm')), recapBody.firstChild)
  recapBody.appendChild(createRow('Avance J-1', durationToString(currentDiff)), recapBody.firstChild)
})()

/**
 * Create the header of the new section
 */
function createHeaderRow () {
  const headerRow = document.createElement('tr')
  headerRow.classList.add('head')

  const title = document.createElement('td')
  title.colSpan = 2
  title.textContent = 'En bref'

  headerRow.appendChild(title)

  return headerRow
}

/**
 * Add a label/value row to the new section
 * @param {String} label
 * @param {String} value
 */
function createRow(label, value) {
  const row = document.createElement('tr')

  const labelCell = document.createElement('td')
  labelCell.classList.add('libelle')
  labelCell.textContent = label

  const valueCell = document.createElement('td')
  valueCell.textContent = value

  row.appendChild(labelCell)
  row.appendChild(valueCell)

  return row
}

/**
 * Get the clockings of the current day
 */
function getClockings () {
  const clockings = document.querySelectorAll('#fiche_pointage .jour_courant .couple_pointage')

  return Array.from(clockings || []).map(clocking => {
    const clockIn = moment.duration(parseFloat(clocking.getAttribute('data-entree')), 'm')
    const clockOut = moment.duration(parseFloat(clocking.getAttribute('data-sortie')), 'm')

    return {
      clockIn: clockIn.isValid() ? clockIn : null,
      clockOut: clockOut.isValid() ? clockOut : null
    }
  })
}

/**
 * Get worktime transfered from the previous month
 */
function getTransferedTime () {
  const recap = document.querySelectorAll('#recap_mensuel td')

  for (let i = 0; i < recap.length; i++) {
    if (/report/i.test(recap[i].textContent)) {
      const nextCell = recap[i + 1]
      return nextCell && nextCell.textContent
    }
  }
}

/**
 * Return the text content of a selector
 * @param {String} selector
 */
function getTextOf(selector) {
  const element = document.querySelector(selector)
  const content = (element && element.textContent) || ''
  return content.trim()
}

/**
 * Convert a string (..h.. or -..h..) into a momentjs duration
 * @param {String} str
 */
function stringToDuration (str) {
  if (!str) { return null }
  const duration = moment.duration(str.replace('h', ':'))
  return duration.isValid() ? duration : null
}

/**
 * Take a momentjs duration and return a formated string (..h.. or -..h..)
 * @param {Moment.duration} duration
 */
function durationToString (duration) {
  if (!duration || !duration.isValid()) { return 'N/A'; }

  let hours = Math.abs(duration.hours())
  let minutes = Math.abs(duration.minutes())

  if (hours < 10) { hours = `0${hours}` }
  if (minutes < 10) { minutes = `0${minutes}` }

  return duration.asSeconds() >= 0 ? `${hours}h${minutes}` : `-${hours}h${minutes}`
}
