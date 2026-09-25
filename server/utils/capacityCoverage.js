/**
 * Minimum coverage guarantee for auto-allocation.
 *
 * Ensures every active (flaggable) service keeps at least one auto-assignable
 * staff member - even services with zero waiting tickets when the balance run
 * started. This closes the "empty window loses staff" trap, where a service that
 * dipped to an empty queue (lull before a customer takes a number) would be
 * stripped of staff while everyone stacked onto the busy windows.
 *
 * The pass is strictly additive: it only grants flags, never removes them, so the
 * busiest windows keep the extra staff the load-based allocation gave them.
 * Uncovered services are given to the least-loaded user (fewest active flags) to
 * minimize multi-tasking burden.
 *
 * @param {Array<{id: number, caterNew: boolean, caterRenewal: boolean, caterRetirement: boolean}>} assignments
 *   The pending user flag assignments (one entry per auto-assignable user).
 * @param {Array<{id: number, prefix: string}>} services
 *   The active services to guarantee coverage for.
 * @param {Record<string, string>} flagByPrefix
 *   Maps a service prefix to its cater flag key (e.g. { NW: 'caterNew' }).
 * @returns {number} How many assignments gained a coverage flag (0 if none needed).
 */
function ensureMinimumCoverage(assignments, services, flagByPrefix) {
  const flags = ['caterNew', 'caterRenewal', 'caterRetirement'];
  let touched = 0;

  for (const service of services) {
    const flag = flagByPrefix[service.prefix];
    if (!flag) continue; // Unallocatable service (no flag slot)

    if (assignments.some(a => a[flag])) continue; // Already covered

    // Give this window to the user carrying the fewest active flags (multi-task).
    let target = null;
    let fewestFlags = Infinity;
    for (const a of assignments) {
      const count = flags.reduce((sum, f) => sum + (a[f] ? 1 : 0), 0);
      if (count < fewestFlags) {
        fewestFlags = count;
        target = a;
      }
    }

    if (target) {
      target[flag] = true;
      touched += 1;
    }
  }

  return touched;
}

module.exports = { ensureMinimumCoverage };