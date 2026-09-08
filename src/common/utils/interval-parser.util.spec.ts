import { parseIntervalToCron } from './interval-parser.util';

describe('parseIntervalToCron', () => {
  it('should parse hour variations correctly', () => {
    expect(parseIntervalToCron('1 Hr')).toBe('0 * * * *');
    expect(parseIntervalToCron('1 hr')).toBe('0 * * * *');
    expect(parseIntervalToCron('1 hour')).toBe('0 * * * *');
    expect(parseIntervalToCron('1h')).toBe('0 * * * *');
    expect(parseIntervalToCron('2 Hours')).toBe('0 */2 * * *');
    expect(parseIntervalToCron('6 hrs')).toBe('0 */6 * * *');
  });

  it('should parse minute variations correctly', () => {
    expect(parseIntervalToCron('1 Min')).toBe('* * * * *');
    expect(parseIntervalToCron('1m')).toBe('* * * * *');
    expect(parseIntervalToCron('5 Min')).toBe('*/5 * * * *');
    expect(parseIntervalToCron('5m')).toBe('*/5 * * * *');
    expect(parseIntervalToCron('10 Mint')).toBe('*/10 * * * *');
    expect(parseIntervalToCron('10 Min')).toBe('*/10 * * * *');
    expect(parseIntervalToCron('15 mins')).toBe('*/15 * * * *');
    expect(parseIntervalToCron('30 Min')).toBe('*/30 * * * *');
  });

  it('should parse second variations correctly', () => {
    expect(parseIntervalToCron('1 Sec')).toBe('* * * * * *');
    expect(parseIntervalToCron('1s')).toBe('* * * * * *');
    expect(parseIntervalToCron('10 Sec')).toBe('*/10 * * * * *');
    expect(parseIntervalToCron('30s')).toBe('*/30 * * * * *');
  });

  it('should parse day variations correctly', () => {
    expect(parseIntervalToCron('1 Day')).toBe('0 0 * * *');
    expect(parseIntervalToCron('2 days')).toBe('0 0 */2 * *');
  });

  it('should preserve standard cron expressions unchanged', () => {
    expect(parseIntervalToCron('0 * * * *')).toBe('0 * * * *');
    expect(parseIntervalToCron('*/5 * * * *')).toBe('*/5 * * * *');
    expect(parseIntervalToCron('0 0 12 * * ?')).toBe('0 0 12 * * ?');
  });

  it('should return default 1 hour cron if empty or undefined', () => {
    expect(parseIntervalToCron('')).toBe('0 * * * *');
    expect(parseIntervalToCron(undefined)).toBe('0 * * * *');
  });
});
