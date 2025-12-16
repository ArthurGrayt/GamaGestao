import React from 'react';
import { Calendar as CalendarIcon, ChevronDown } from 'lucide-react';
import { DateRangeType } from '../types';
import { format } from 'date-fns';

interface Props {
  selectedRange: DateRangeType;
  selectedDate: Date;
  onRangeChange: (range: DateRangeType) => void;
  onDateChange: (date: Date) => void;
}

const ranges: { label: string; value: DateRangeType }[] = [
  { label: 'Dia', value: 'hoje' },
  { label: 'Semana', value: 'semana' },
  { label: 'Mês', value: 'mes' },
  { label: 'Trimestre', value: 'trimestre' },
  { label: 'Ano', value: 'ano' },
];

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const DateFilter: React.FC<Props> = ({ selectedRange, selectedDate, onRangeChange, onDateChange }) => {
  
  const getInputValue = () => {
    if (selectedRange === 'trimestre') {
      return format(selectedDate, 'yyyy-MM');
    }
    if (selectedRange === 'ano') {
      return format(selectedDate, 'yyyy');
    }
    return format(selectedDate, 'yyyy-MM-dd');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    
    let newDate = new Date(val);
    
    if (selectedRange === 'ano') {
        newDate = new Date(parseInt(val), 0, 1);
    } else if (selectedRange === 'trimestre') {
        const [y, m] = val.split('-').map(Number);
        newDate = new Date(y, m - 1, 1);
    } else {
        // yyyy-MM-dd
        const [y, m, d] = val.split('-').map(Number);
        // Correctly parse local date components to avoid timezone shifts
        newDate = new Date(y, m - 1, d);
    }
    
    onDateChange(newDate);
  };

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    // Create new date preserving current year, setting to 1st of selected month
    const newDate = new Date(selectedDate.getFullYear(), newMonth, 1);
    onDateChange(newDate);
  };

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    // Create new date preserving current month, setting to 1st
    const newDate = new Date(newYear, selectedDate.getMonth(), 1);
    onDateChange(newDate);
  };

  // Generate years: e.g., 5 years back and 2 years forward
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 bg-white/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/40 shadow-sm transition-all hover:bg-white/50">
      
      {/* Type Selector */}
      <div className="flex bg-slate-200/40 rounded-xl p-1">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onRangeChange(range.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 ${
              selectedRange === range.value
                ? 'bg-white text-slate-800 shadow-sm transform scale-100'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/30'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Date Picker Input Area */}
      <div className="flex items-center space-x-2 px-2">
        {selectedRange === 'mes' ? (
          <div className="flex items-center gap-2 animate-fadeIn">
            {/* Custom Month Select */}
            <div className="relative group">
              <select
                value={selectedDate.getMonth()}
                onChange={handleMonthSelect}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white/50 border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-xl text-sm font-medium text-slate-700 outline-none transition-all cursor-pointer min-w-[110px]"
              >
                {months.map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Custom Year Select */}
            <div className="relative group">
              <select
                value={selectedDate.getFullYear()}
                onChange={handleYearSelect}
                className="appearance-none pl-3 pr-8 py-1.5 bg-white/50 border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-xl text-sm font-medium text-slate-700 outline-none transition-all cursor-pointer w-[80px]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CalendarIcon size={16} className="text-slate-400 group-hover:text-blue-500 transition-colors" />
              </div>
              <input 
                  type={selectedRange === 'ano' ? 'number' : (selectedRange === 'trimestre') ? 'month' : 'date'}
                  value={getInputValue()}
                  onChange={handleInputChange}
                  className="pl-9 pr-3 py-1.5 bg-white/50 border border-transparent hover:border-slate-200 focus:border-blue-400 rounded-xl text-sm font-medium text-slate-700 outline-none transition-all cursor-pointer"
              />
          </div>
        )}
      </div>
    </div>
  );
};
