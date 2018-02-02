(function () {
  'use strict'

  if (!document.querySelector('#fiche_pointage .jour_courant')) { return }

  const recap = document.querySelector('#recap_mensuel')
  if (!recap) { return }

  let monthlyDiff  = stringToMinutes(getTextOf('#fiche_pointage tfoot .diff'))
  let regulation   = stringToMinutes(getTextOf('#fiche_pointage .jour_courant span.regulation'))
  const dailyTotal = stringToMinutes(getTextOf('#fiche_pointage .jour_courant .champs_temps_theorique'))
  const dailyBreak = stringToMinutes(getTextOf('#fiche_pointage .jour_courant .champs_pause'))
  const transfered = stringToMinutes(getTransferedTime())
  const clockings  = getClockings()

  monthlyDiff += transfered

  const msToMin      = 60000
  const minBreakTime = 45
  const breakTaken   = (dailyBreak > 0)
  const halfDay      = (regulation > 225)

  if (!halfDay && dailyBreak < minBreakTime) {
    // If the break time lasted less than 45min, remove every minute under 45 from the regulation
    // If it's a half day (regulation > 3h45), we don't need to regulate the break time
    regulation += (dailyBreak - minBreakTime)
  }

  const newBody = document.createElement('tbody')

  newBody.innerHTML = `
    <tr class="head">
      <td colspan="2">En bref</td>
    </tr>
    <tr>
      <td class="libelle">Temps de travail</td>
      <td id="as-worktime"></td>
    </tr>
    <tr>
      <td class="libelle">Temps de pause</td>
      <td id="as-breaktime"></td>
    </tr>
    <tr>
      <td class="libelle">Régulations</td>
      <td id="as-regulation"></td>
    </tr>
    <tr style="border-top: 1px solid grey">
      <td class="libelle">Reste à faire</td>
      <td id="as-remaining"></td>
    </tr>
    <tr>
      <td class="libelle">Fin de la journée</td>
      <td id="as-endofday"></td>
    </tr>
    <tr style="border-top: 1px solid grey">
      <td class="libelle">Etat horaire J-1</td>
      <td id="as-mdiff"></td>
    </tr>
    <tr>
      <td class="libelle">Etat horaire actuel</td>
      <td id="as-cdiff"></td>
    </tr>
  `

  recap.appendChild(newBody)
  updateMetrics()

  /**
   * Calculate all dynamic values and update DOM
   */
  function updateMetrics () {
    const worktime    = getWorktime()
    const remaining   = dailyTotal - worktime - regulation
    const currentDiff = monthlyDiff - remaining
    const endOfDay    = new Date(Date.now() + remaining * msToMin)

    const borderTop = { 'border-top': '1px solid grey' }

    document.getElementById('as-worktime').textContent   = minutesToString(worktime)
    document.getElementById('as-breaktime').textContent  = minutesToString(dailyBreak)
    document.getElementById('as-regulation').textContent = minutesToString(regulation)
    document.getElementById('as-remaining').textContent  = minutesToString(remaining)
    document.getElementById('as-endofday').textContent   = dateToString(endOfDay)
    document.getElementById('as-mdiff').textContent      = minutesToString(monthlyDiff)
    document.getElementById('as-cdiff').textContent      = minutesToString(currentDiff)

    // Update metrics every 15s
    setTimeout(updateMetrics, 15000)
  }

  /**
   * Get the total worktime based on clockings
   */
  function getWorktime () {
    let worktime = 0

    if (clockings.length > 0) {
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
   * Get the clockings of the current day
   */
  function getClockings () {
    const clockings = document.querySelectorAll('#fiche_pointage .jour_courant .couple_pointage')

    return Array.from(clockings || []).map(clocking => {
      const clockIn = parseFloat(clocking.getAttribute('data-entree'))
      const clockOut = parseFloat(clocking.getAttribute('data-sortie'))

      return {
        clockIn: isNaN(clockIn) ? null : clockIn,
        clockOut: isNaN(clockOut) ? null : clockOut
      }
    })
  }

  /**
   * Get work time transfered from the previous month
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
  function getTextOf (selector) {
    const element = document.querySelector(selector)
    const content = (element && element.textContent) || ''
    return content.trim()
  }

  /**
   * Return the number of minutes from midnight
   */
  function minutesFromMidnight () {
    const now = new Date()
    return (now.getHours() * 60) + now.getMinutes()
  }

  /**
   * Convert a string (..h.. or -..h..) into a number of minutes
   * @param {String} str
   */
  function stringToMinutes (str) {
    str = (str || '').trim()
    const match = /^(-)?(\d+)h(\d+)$/.exec(str)
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

    let hours = Math.floor(Math.abs(nbMinutes / 60))
    let minutes = Math.abs(nbMinutes % 60)

    if (hours < 10) { hours = `0${hours}` }
    if (minutes < 10) { minutes = `0${minutes}` }

    return nbMinutes >= 0 ? `${hours}h${minutes}` : `-${hours}h${minutes}`
  }

  /**
   * Take a date and return a formated string (..h.. or -..h..)
   * @param {Integer} date
   */
  function dateToString (date) {
    if (!date) { return 'N/A' }

    let hours = date.getHours()
    let minutes = date.getMinutes()

    if (hours < 10) { hours = `0${hours}` }
    if (minutes < 10) { minutes = `0${minutes}` }

    return `${hours}h${minutes}`
  }
})()