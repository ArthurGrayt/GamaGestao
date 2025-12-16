import { 
  startOfDay, endOfDay, subDays, 
  startOfWeek, endOfWeek, subWeeks,
  startOfMonth, endOfMonth, subMonths,
  startOfQuarter, endOfQuarter, subQuarters,
  startOfYear, endOfYear, subYears,
  format, addDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRangeType, DateFilterState } from '../types';

export const calculateDateRange = (range: DateRangeType, referenceDate: Date = new Date()): DateFilterState => {
  let startDate: Date, endDate: Date, prevStartDate: Date, prevEndDate: Date;

  // Ensure we are working with a Date object
  const ref = new Date(referenceDate);

  switch (range) {
    case 'hoje': // Treated as 'Day' selector
      startDate = startOfDay(ref);
      endDate = endOfDay(ref);
      prevStartDate = startOfDay(subDays(ref, 1));
      prevEndDate = endOfDay(subDays(ref, 1));
      break;
      
    case 'ontem': // Kept for legacy compatibility, maps to specific day logic usually
      const yesterday = subDays(new Date(), 1);
      startDate = startOfDay(yesterday);
      endDate = endOfDay(yesterday);
      prevStartDate = startOfDay(subDays(yesterday, 1));
      prevEndDate = endOfDay(subDays(yesterday, 1));
      break;

    case 'semana':
      // User selects a day, we get that week (Sunday to Saturday)
      startDate = startOfWeek(ref, { weekStartsOn: 0 }); // 0 = Sunday
      endDate = endOfWeek(ref, { weekStartsOn: 0 });
      // Compare with previous week
      prevStartDate = startOfWeek(subWeeks(ref, 1), { weekStartsOn: 0 });
      prevEndDate = endOfWeek(subWeeks(ref, 1), { weekStartsOn: 0 });
      break;

    case 'mes':
      // User selects a month (via day in that month)
      startDate = startOfMonth(ref);
      endDate = endOfMonth(ref);
      // Compare with previous month
      prevStartDate = startOfMonth(subMonths(ref, 1));
      prevEndDate = endOfMonth(subMonths(ref, 1));
      break;

    case 'trimestre':
      // User selects a date, we get that quarter
      startDate = startOfQuarter(ref);
      endDate = endOfQuarter(ref);
      // Compare with previous quarter
      prevStartDate = startOfQuarter(subQuarters(ref, 1));
      prevEndDate = endOfQuarter(subQuarters(ref, 1));
      break;

    case 'ano':
      startDate = startOfYear(ref);
      endDate = endOfYear(ref);
      prevStartDate = startOfYear(subYears(ref, 1));
      prevEndDate = endOfYear(subYears(ref, 1));
      break;

    default:
      startDate = startOfDay(ref);
      endDate = endOfDay(ref);
      prevStartDate = startOfDay(subDays(ref, 1));
      prevEndDate = endOfDay(subDays(ref, 1));
  }

  return { range, startDate, endDate, prevStartDate, prevEndDate };
};

export const formatDateDisplay = (date: Date) => {
  return format(date, "dd 'de' MMM", { locale: ptBR });
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};