process.env.TZ = 'America/Bogota';

export const COLOMBIA_TZ = 'America/Bogota';

export function nowColombia() {
  return new Date();
}

export function colombiaString(date = new Date()) {
  return date.toLocaleString('es-CO', { timeZone: COLOMBIA_TZ });
}

export function colombiaDate(date = new Date()) {
  return date.toLocaleString('en-US', {
    timeZone: COLOMBIA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}
