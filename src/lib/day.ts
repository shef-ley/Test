import { format } from 'date-fns';

export const getDayKey = (date = new Date()): string => format(date, 'yyyy-MM-dd');
