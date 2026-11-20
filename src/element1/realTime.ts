// All speeds in the scene are radians per second of REAL (simulated) time.
// timeScale then means "simulated seconds per real second": 1 = real time, 86400 = one day per second.

const TWO_PI = Math.PI * 2;
const DAY = 86400; // seconds in a day

// Angular speed for an orbit, from its period in days. Negative days = retrograde (backwards).
export const orbitDays = (days: number) => TWO_PI / (days * DAY);

// Angular speed for a spin, from its rotation period in hours. Negative hours = retrograde.
export const spinHours = (hours: number) => TWO_PI / (hours * 3600);

// Most moons are tidally locked: they spin once per orbit, so the same face always points at the planet.
export const tidallyLocked = (orbitPeriodDays: number) => ({
  orbitSpeed: orbitDays(orbitPeriodDays),
  spinSpeed: orbitDays(orbitPeriodDays),
});

export const TWO_PI_RADIANS = TWO_PI;
export const MAX_TIME_SCALE = 3.2e8; // about 10 years per second
export const START_TIME_SCALE = 86400; // start at 1 day per second so something visibly moves