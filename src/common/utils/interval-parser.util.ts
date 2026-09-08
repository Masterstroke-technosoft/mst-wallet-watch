/**
 * Parses human-readable interval strings (e.g. "1 Hr", "30 Min", "5 Min", "10 Mint", "15s")
 * or standard cron expressions into a valid cron expression.
 */
export function parseIntervalToCron(input?: string): string {
  if (!input || !input.trim()) {
    return '0 * * * *'; // default: every 1 hour
  }

  const trimmed = input.trim();

  // If already standard cron format with multiple space-separated fields (5 or 6 fields)
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 5) {
    return trimmed;
  }

  // Match: digits followed by time unit (e.g., "1 Hr", "30 Min", "10 Mint", "5m", "15s")
  const match = trimmed.match(
    /^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|mint|mints|h|hr|hrs|hour|hours|d|day|days)$/i,
  );

  if (!match) {
    return trimmed;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (value <= 0) {
    return '0 * * * *';
  }

  // Seconds (supported via 6-field cron in node-cron / cron package)
  if (['s', 'sec', 'secs', 'second', 'seconds'].includes(unit)) {
    if (value === 1) return '* * * * * *';
    if (value < 60) return `*/${value} * * * * *`;
    const mins = Math.floor(value / 60);
    return mins === 1 ? '* * * * *' : `*/${mins} * * * *`;
  }

  // Minutes
  if (['m', 'min', 'mins', 'minute', 'minutes', 'mint', 'mints'].includes(unit)) {
    if (value === 1) return '* * * * *';
    if (value < 60) return `*/${value} * * * *`;
    const hrs = Math.floor(value / 60);
    return hrs === 1 ? '0 * * * *' : `0 */${hrs} * * *`;
  }

  // Hours
  if (['h', 'hr', 'hrs', 'hour', 'hours'].includes(unit)) {
    if (value === 1) return '0 * * * *';
    if (value < 24) return `0 */${value} * * *`;
    const days = Math.floor(value / 24);
    return `0 0 */${days} * *`;
  }

  // Days
  if (['d', 'day', 'days'].includes(unit)) {
    if (value === 1) return '0 0 * * *';
    return `0 0 */${value} * *`;
  }

  return trimmed;
}
