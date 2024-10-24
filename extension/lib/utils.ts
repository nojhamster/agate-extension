export type Clocking = {
  clockIn: number,
  clockOut: number,
}

/**
 * Convert a string (..h.. or -..h..) into a number of minutes
 */
export function stringToMinutes(str?: string): number {
  const match = /^(-)?\s*(\d+)\s*[h:]\s*(\d+)$/.exec((str || '').trim())
  if (!match) { return 0 }

  const minutes = (parseInt(match[2]) * 60) + parseInt(match[3])

  return match[1] ? minutes * -1 : minutes
}

/**
 * Take a number of minutes and return a formated string (..h.. or -..h..)
 */
export function minutesToString(nbMinutes: number, opts?: { withSign?: boolean }): string {
  if (!nbMinutes && nbMinutes !== 0) { return 'N/A' }

  let hours = Math.floor(Math.abs(nbMinutes / 60)).toString().padStart(2, '0');
  let minutes = Math.abs(nbMinutes % 60).toString().padStart(2, '0');

  let sign = opts?.withSign ? '+' : '';
  if (nbMinutes < 0) { sign = '-'; }

  return `${sign}${hours}h${minutes}`;
}

/**
 * Take a date and return a formated string (..h.. or -..h..)
 */
export function dateToString(date: Date): string {
  if (!date) { return 'N/A'; }

  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${hours}h${minutes}`;
}

/**
 * Get the punch URL for a given user ID and date
 */
export function getPunchUrl(userId: string, date: string, opts?: { withHost?: boolean }): string {
  return `${opts?.withHost !== false ? window.location.origin : ''}/fr/time/punch/${userId}/${date}`;
}

/**
 * Get clockings of the given date for a given user ID
 */
export async function getClockings(userId: string, date: string): Promise<Clocking[]> {
  const response = await fetch(getPunchUrl(userId, date));

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const text = await response.text();
  const parser = new DOMParser();
  const clockingPage = parser.parseFromString(text, 'text/html');
  const clockings = [];

  const inputs = clockingPage.querySelectorAll<HTMLInputElement>('#punch_manage tr:not(.tr-punch-canceled) input[type=time]');

  for (let i = 0; i < inputs.length; i += 2) {
    clockings.push({
      clockIn: stringToMinutes(inputs[i]?.value),
      clockOut: stringToMinutes(inputs[i + 1]?.value),
    });
  }

  return clockings;
}

/**
 * Return whether a clocking is still in progress (has a clock-in but no clock-out)
 */
export function hasUnfinishedClocking(clockings: Clocking[]): boolean {
  return clockings.some(({ clockIn, clockOut }) => (clockIn && !clockOut));
}

/**
 * Get the total worktime based on clockings
 */
export function getWorktime(clockings: Clocking[], currentTime: Date): number {
  let worktime = 0;

  if (Array.isArray(clockings) && clockings.length > 0) {
    clockings.forEach(({ clockIn, clockOut }) => {
      if (clockIn && clockOut) {
        // For each clock-in/clock-out couple, add the period to the work time
        worktime += (clockOut - clockIn);
      } else if (clockIn) {
        // If the clock-in has no associated clock-out, add the period going from clock-in to current time
        worktime += (currentTime.getHours() * 60) + currentTime.getMinutes() - clockIn;
      }
    })
  }

  return worktime
}