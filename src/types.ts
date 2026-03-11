export interface Student {
  id: string;
  first_name: string;
  level: number;
  created_at: string;
  updated_at: string;
}

export interface HistoryRecord {
  id: string;
  student_id: string | null;
  student_first_name: string;
  previous_level: number | null;
  new_level: number | null;
  action_type: string;
  note: string | null;
  created_at: string;
  day_key: string;
}
