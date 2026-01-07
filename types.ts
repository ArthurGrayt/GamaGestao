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

export type QuestionType = 'short_text' | 'long_text' | 'choice' | 'rating' | 'select' | 'section_break';

export interface Form {
  id: number;
  title: string;
  description: string;
  slug: string;
  active: boolean;
  created_at: string;
}

export interface FormQuestion {
  id: number;
  form_id: number;
  label: string;
  question_type: QuestionType;
  required: boolean;
  question_order: number;
  option_1?: string;
  option_2?: string;
  option_3?: string;
  option_4?: string;
  option_5?: string;
  min_value?: number;
  max_value?: number;
  temp_id?: string; // For stable keys in frontend
}

export interface FormAnswer {
  id: number;
  form_id: number;
  question_id: number;
  responder_name?: string;
  responder_identifier?: string;
  answer_text?: string;
  answer_number?: number;
  created_at: string;
}