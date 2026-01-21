import DayType from '@/src/core/types/DaysType';

import dayjs from 'dayjs';
import 'dayjs/locale/es';
import DAYS from '../../lib/days';

// Set the locale globally (similar to moment.locale('es'))
dayjs.locale('es');



export function timesamp_standard_format() {
  return dayjs().format('dddd, DD-MMM-YY');
}

export function timestamp_format() {
  return dayjs().format('YYYY-MM-DD HH:mm:ss');
}

export function current_day_name() {
  return dayjs().format('dddd');
}

export function time_posix_format() {
  return dayjs().unix(); // Returns the POSIX timestamp
}

export function determineCurrentDayByDayName(dayToDetermine:string) {
  return current_day_name().toLocaleLowerCase() === dayToDetermine.toLocaleLowerCase()
}

// Helpers to work with id_day via order index (no name comparisons)
function getCurrentDayOrder(): number | null {
  const index = dayjs().day(); // 0: Sunday, 1-6: Monday-Saturday
  return index === 0 ? null : index;
}

export function determineCurrentDayById(id_day: string): boolean {
  const info = (DAYS as Record<string, DayType>)[id_day];
  if (!info || typeof info.order_to_show !== 'number') return false;
  const order = getCurrentDayOrder();
  return order !== null && info.order_to_show === order;
}

// Convenience alias using id_day directly
export function determineIfCurrentDay(id_day: string): boolean {
  return determineCurrentDayById(id_day);
}