import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// dayjs 플러그인 설정
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * 표준 시간대: UTC
 * - 모든 서버 로직에서 UTC 사용
 * - DB 저장도 UTC
 * - 클라이언트에서 로컬 시간대로 변환
 */
export const STANDARD_TIMEZONE = 'UTC';

/**
 * 현재 UTC 시간 반환
 */
export function now(): Date {
  return dayjs().utc().toDate();
}

/**
 * UTC 시간 생성
 */
export function utcDate(date?: string | number | Date | dayjs.Dayjs): Date {
  return dayjs(date).utc().toDate();
}

/**
 * 특정 시간대로 변환
 */
export function toTimezone(date: Date, tz: string): dayjs.Dayjs {
  return dayjs(date).tz(tz);
}

/**
 * ISO 8601 형식 문자열로 변환 (UTC)
 */
export function toISOString(date: Date): string {
  return dayjs(date).utc().toISOString();
}

/**
 * YYYY-MM-DD 형식으로 변환
 */
export function formatDate(date: Date): string {
  return dayjs(date).utc().format('YYYY-MM-DD');
}

/**
 * YYYY-MM-DD HH:mm:ss 형식으로 변환
 */
export function formatDateTime(date: Date): string {
  return dayjs(date).utc().format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Date를 timestamp (밀리초)로 변환
 */
export function toTimestamp(date: Date): number {
  return dayjs(date).valueOf();
}

/**
 * timestamp에서 Date 생성
 */
export function fromTimestamp(timestamp: number): Date {
  return dayjs(timestamp).utc().toDate();
}

/**
 * 두 날짜의 차이 (일 단위)
 */
export function daysDiff(date1: Date, date2: Date): number {
  return dayjs(date1).diff(dayjs(date2), 'day');
}

/**
 * 두 날짜의 차이 (시간 단위)
 */
export function hoursDiff(date1: Date, date2: Date): number {
  return dayjs(date1).diff(dayjs(date2), 'hour');
}

/**
 * 두 날짜의 차이 (분 단위)
 */
export function minutesDiff(date1: Date, date2: Date): number {
  return dayjs(date1).diff(dayjs(date2), 'minute');
}

/**
 * 두 날짜의 차이 (초 단위)
 */
export function secondsDiff(date1: Date, date2: Date): number {
  return dayjs(date1).diff(dayjs(date2), 'second');
}

/**
 * 날짜 더하기
 */
export function addDays(date: Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate();
}

export function addHours(date: Date, hours: number): Date {
  return dayjs(date).add(hours, 'hour').toDate();
}

export function addMinutes(date: Date, minutes: number): Date {
  return dayjs(date).add(minutes, 'minute').toDate();
}

export function addSeconds(date: Date, seconds: number): Date {
  return dayjs(date).add(seconds, 'second').toDate();
}

/**
 * 날짜 빼기
 */
export function subtractDays(date: Date, days: number): Date {
  return dayjs(date).subtract(days, 'day').toDate();
}

export function subtractHours(date: Date, hours: number): Date {
  return dayjs(date).subtract(hours, 'hour').toDate();
}

export function subtractMinutes(date: Date, minutes: number): Date {
  return dayjs(date).subtract(minutes, 'minute').toDate();
}

export function subtractSeconds(date: Date, seconds: number): Date {
  return dayjs(date).subtract(seconds, 'second').toDate();
}

/**
 * 날짜 비교
 */
export function isBefore(date1: Date, date2: Date): boolean {
  return dayjs(date1).isBefore(dayjs(date2));
}

export function isAfter(date1: Date, date2: Date): boolean {
  return dayjs(date1).isAfter(dayjs(date2));
}

export function isSame(date1: Date, date2: Date): boolean {
  return dayjs(date1).isSame(dayjs(date2));
}

/**
 * 날짜의 시작/끝
 */
export function startOfDay(date: Date): Date {
  return dayjs(date).utc().startOf('day').toDate();
}

export function endOfDay(date: Date): Date {
  return dayjs(date).utc().endOf('day').toDate();
}

export function startOfMonth(date: Date): Date {
  return dayjs(date).utc().startOf('month').toDate();
}

export function endOfMonth(date: Date): Date {
  return dayjs(date).utc().endOf('month').toDate();
}

/**
 * 유효한 날짜인지 확인
 */
export function isValidDate(date: any): boolean {
  return dayjs(date).isValid();
}

/**
 * KST (한국 표준시) 변환
 * - 클라이언트 표시용
 */
export function toKST(date: Date): dayjs.Dayjs {
  return dayjs(date).tz('Asia/Seoul');
}

/**
 * KST 문자열 포맷
 */
export function formatKST(date: Date): string {
  return toKST(date).format('YYYY-MM-DD HH:mm:ss');
}
