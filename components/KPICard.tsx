import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { formatCurrency } from '../utils/dateUtils';

interface KPICardProps {
  title: string;
  value: number;
  prevValue: number;
  isLoading?: boolean;
  isCurrency?: boolean;
  icon?: React.ReactNode;
  score?: number;
  onClick?: () => void;
  extraInfo?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  prevValue,
  isLoading,
  isCurrency,
  icon,
  score,
  onClick,
  extraInfo
}) => {
  if (isLoading) {
    return (
      <div className="bg-white/50 backdrop-blur-md rounded-3xl p-6 border border-white/60 animate-pulse h-40">
        <div className="h-4 bg-slate-200/50 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-slate-200/50 rounded w-3/4"></div>
      </div>
    );
  }

  const diff = value - prevValue;
  const percentage = prevValue !== 0 ? (diff / prevValue) * 100 : 0;

  const displayValue = isCurrency ? formatCurrency(value) : value.toLocaleString('pt-BR');

  return (
    <div
      onClick={onClick}
      className={`bg-white/70 backdrop-blur-2xl rounded-2xl p-3.5 shadow-lg shadow-slate-200/40 border border-white/80 flex flex-col justify-between hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-300 group h-28 relative overflow-hidden ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start mb-0.5 z-10">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors truncate pr-2">{title}</h3>
        {icon && (
          <div className="text-slate-400 bg-white/50 p-1.5 rounded-lg backdrop-blur-sm group-hover:text-blue-500 group-hover:bg-blue-50 transition-all shadow-sm">
            {icon}
          </div>
        )}
      </div>

      <div className="z-10 flex items-end justify-between gap-2">
        <div className="flex flex-col">
          <div className="text-3xl font-bold text-slate-800 tracking-tight leading-none mb-1.5">{displayValue}</div>

          <div className="flex items-center space-x-1.5">
            <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-sm border border-transparent ${percentage > 0
              ? 'bg-green-50 text-green-600 border-green-100'
              : percentage < 0
                ? 'bg-red-50 text-red-600 border-red-100'
                : 'bg-slate-50 text-slate-500 border-slate-100'
              }`}>
              {percentage > 0 && <ArrowUp size={10} className="mr-0.5" />}
              {percentage < 0 && <ArrowDown size={10} className="mr-0.5" />}
              {percentage === 0 && <Minus size={10} className="mr-0.5" />}
              {Math.abs(percentage).toFixed(0)}%
            </span>
          </div>
        </div>

        {score !== undefined && (
          <div className="flex flex-col items-end mb-0.5">
            <div className="text-lg font-bold text-blue-600 leading-none">{score}</div>
            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">PTS</span>
          </div>
        )}
      </div>

      {extraInfo && (
        <div className="mt-1.5 flex items-center justify-between border-t border-slate-100/50 pt-1.5 overflow-hidden">
          <span className="text-[9px] font-medium text-slate-400 truncate tracking-wide whitespace-nowrap">
            {extraInfo}
          </span>
        </div>
      )}
    </div>
  );
};