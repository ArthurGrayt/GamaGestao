export type DateRangeType = 'hoje' | 'ontem' | 'semana' | 'mes' | 'trimestre' | 'ano';

export interface DateFilterState {
  range: DateRangeType;
  startDate: Date;
  endDate: Date;
  prevStartDate: Date;
  prevEndDate: Date;
}

export interface KPIData {
  label: string;
  value: number | string;
  previousValue: number | string;
  change: number; // percentage
  trend: 'up' | 'down' | 'neutral';
  isCurrency?: boolean;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  prevValue?: number;
  [key: string]: any;
}

// Simplified DB Types based on Schema
export interface Agendamento {
  id: number;
  status: string;
  data_atendimento: string;
  compareceu: boolean;
  unidade: number;
}

export interface FinanceiroTransacao {
  id: number;
  tipo_transacao: 'Pagar' | 'Receber';
  valor_original: number;
  data_emissao: string;
  data_vencimento: string;
  status: string;
}

export interface KanbanTask {
  id: number;
  status: string;
  created_at: string;
  datadeentrega: string;
}

export interface Cliente {
  id: string; // uuid
  created_at: string;
  status: string;
}