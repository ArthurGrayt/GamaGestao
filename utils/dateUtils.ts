import {
  format,
  isSameDay,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  subMonths,
  subYears,
  addDays,
  startOfQuarter,
  endOfQuarter,
  subQuarters
} from 'date-fns';
import { DateRangeType, DateFilterState } from '../types';
import { ptBR } from 'date-fns/locale';

/**
 * Returns the start of the date in UTC ISO format (yyyy-MM-ddT00:00:00.000Z).
 * It takes the LOCAL year, month, and day of the input date and assumes they map to UTC.
 */
export const getUTCStart = (date: Date): string => {
  return format(date, "yyyy-MM-dd'T'00:00:00.000'Z'"); // Naive local parts + Z suffix force UTC interpretation of those parts
};

/**
 * Returns the end of the date in UTC ISO format.
 * If the date is Today, it returns the CURRENT UTC timestamp to match < NOW().
 * Otherwise, it returns yyyy-MM-ddT23:59:59.999Z.
 */
export const getUTCEnd = (date: Date): string => {
  // Logic: Interval is [Start, End).
  // We want to include the full 'date'. So we point to the START of the NEXT day.
  // HOWEVER, we must NOT exceed "End of Today" (Start of Tomorrow) to avoid Future appointments.

  const now = new Date();
  const nextDayFromInput = startOfDay(addDays(date, 1));
  const nextDayFromNow = startOfDay(addDays(now, 1));

  // Use the earlier of the two dates to effectively cap at "End of Today"
  // if the selected filter goes into the future.
  const effectiveEnd = (nextDayFromInput > nextDayFromNow)
    ? nextDayFromNow
    : nextDayFromInput;

  return format(effectiveEnd, "yyyy-MM-dd'T'00:00:00.000'Z'");
};

/**
 * Legacy/Alternative approach if we want strictly standard intervals without "Today" logic
 */
export const getUTCEndOfDay = (date: Date): string => {
  return format(date, "yyyy-MM-dd'T'23:59:59.999'Z'");
}

// --- Restored Functions ---

export const formatDateDisplay = (date: Date): string => {
  return format(date, 'dd/MM/yyyy');
};

export const formatCurrency = (value: number | string): string => {
  const numValue = Number(value);
  if (isNaN(numValue)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

export const calculateDateRange = (type: DateRangeType, selectedDate: Date): DateFilterState => {
  let startDate: Date;
  let endDate: Date;
  let prevStartDate: Date;
  let prevEndDate: Date;

  const now = selectedDate;

  switch (type) {
    case 'hoje':
      startDate = startOfDay(now);
      endDate = endOfDay(now);
      prevStartDate = startOfDay(subDays(now, 1));
      prevEndDate = endOfDay(subDays(now, 1));
      break;

    case 'ontem':
      startDate = startOfDay(subDays(now, 1));
      endDate = endOfDay(subDays(now, 1));
      prevStartDate = startOfDay(subDays(now, 2));
      prevEndDate = endOfDay(subDays(now, 2));
      break;

    case 'semana':
      startDate = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
      endDate = endOfWeek(now, { weekStartsOn: 0 });
      // Previous week
      prevStartDate = subDays(startDate, 7);
      prevEndDate = subDays(endDate, 7);
      break;

    case 'mes':
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      // Previous month
      prevStartDate = startOfMonth(subMonths(now, 1));
      prevEndDate = endOfMonth(subMonths(now, 1));
      break;

    case 'trimestre':
      startDate = startOfQuarter(now);
      endDate = endOfQuarter(now);
      // Previous quarter
      prevStartDate = startOfQuarter(subQuarters(now, 1));
      prevEndDate = endOfQuarter(subQuarters(now, 1));
      break;

    case 'ano':
      startDate = startOfYear(now);
      endDate = endOfYear(now);
      // Previous year
      prevStartDate = startOfYear(subYears(now, 1));
      prevEndDate = endOfYear(subYears(now, 1));
      break;

    default:
      // Default to month
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
      prevStartDate = startOfMonth(subMonths(now, 1));
      prevEndDate = endOfMonth(subMonths(now, 1));
  }

  return {
    range: type,
    startDate,
    endDate,
    prevStartDate,
    prevEndDate
  };
};