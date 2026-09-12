// Opening hours across time zones.
//
// isOpenAt used to read the *server's* local clock, so a UTC host put every
// restaurant's hours an hour or two out - and createOrder rejects on the
// isOpenNow flag that follows from it, so the mistake silently refused real
// orders. This runs with TZ=UTC deliberately, which is what a deployed host
// looks like.
//
//   node scripts/checkSchedule.js
process.env.TZ = "UTC";
import "../config/env.js";

const { isOpenAt, DEFAULT_TIMEZONE, buildScheduleFromRange } = await import("../utils/schedule.js");

let passed = 0;
let failed = 0;
const ok = (label, cond, detail = "") => {
  cond ? passed++ : failed++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${label}${detail && !cond ? ` - ${detail}` : ""}`);
};

const nineToFive = buildScheduleFromRange("09:00", "17:00");

console.log(`\nserver TZ is ${process.env.TZ}; default zone is ${DEFAULT_TIMEZONE}`);

// A Monday. 08:30 UTC is 09:30 in Belgrade (CET, +1).
const mondayMorning = new Date("2026-01-05T08:30:00Z");
ok("open in Belgrade at 09:30 local", isOpenAt(nineToFive, mondayMorning, "Europe/Belgrade"));
ok("shut if judged by a UTC host", !isOpenAt(nineToFive, mondayMorning, "UTC"));
ok("shut in New York at 03:30 local", !isOpenAt(nineToFive, mondayMorning, "America/New_York"));

// 16:30 UTC is 17:30 in Belgrade - past closing.
const mondayEvening = new Date("2026-01-05T16:30:00Z");
ok("shut in Belgrade at 17:30 local", !isOpenAt(nineToFive, mondayEvening, "Europe/Belgrade"));
ok("open in New York at 11:30 local", isOpenAt(nineToFive, mondayEvening, "America/New_York"));

console.log("\nthe default zone is used when none is stored");
ok("an absent zone behaves like Belgrade",
  isOpenAt(nineToFive, mondayMorning, undefined) === isOpenAt(nineToFive, mondayMorning, "Europe/Belgrade"));

console.log("\nan unusable zone never closes a restaurant by accident");
ok("a nonsense zone falls back to the host rather than throwing",
  isOpenAt(nineToFive, mondayMorning, "Not/AZone") === isOpenAt(nineToFive, mondayMorning, "UTC"));

console.log("\nthe two documented conventions still hold");
const allDay = buildScheduleFromRange("00:00", "00:00");
ok("equal open and close means around the clock", isOpenAt(allDay, mondayMorning, "Europe/Belgrade"));

// An overnight window that runs into the next morning.
const overnight = buildScheduleFromRange("20:00", "04:00");
// 01:00 UTC Tuesday = 02:00 Tuesday in Belgrade, inside Monday's spillover.
ok("an overnight window spills into the next morning",
  isOpenAt(overnight, new Date("2026-01-06T01:00:00Z"), "Europe/Belgrade"));
// 10:00 UTC = 11:00 local, well outside it.
ok("and not during the day", !isOpenAt(overnight, new Date("2026-01-06T10:00:00Z"), "Europe/Belgrade"));

console.log("\nDST is handled by the zone database, not by an offset");
// Belgrade is +1 in January and +2 in July. 07:30 UTC is 08:30 vs 09:30 local.
ok("08:30 local in January is before opening", !isOpenAt(nineToFive, new Date("2026-01-05T07:30:00Z"), "Europe/Belgrade"));
ok("09:30 local in July is after opening", isOpenAt(nineToFive, new Date("2026-07-06T07:30:00Z"), "Europe/Belgrade"));

console.log(`\n  ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
