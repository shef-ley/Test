import { DEFAULT_LEVEL } from '../constants';
import type { ActionType } from '../constants';
import type { HistoryRecord, Student } from '../types';
import { getDayKey } from './day';
import { supabase } from './supabase';

export async function fetchStudents() {
  return supabase.from('students').select('*').order('first_name', { ascending: true });
}

export async function fetchHistory(dayKey: string) {
  return supabase
    .from('history_logs')
    .select('*')
    .eq('day_key', dayKey)
    .order('created_at', { ascending: false });
}

export async function fetchHistoryDays() {
  return supabase.from('history_days').select('*').order('day_key', { ascending: false });
}

export async function addStudent(firstName: string) {
  const trimmed = firstName.trim();
  const { data, error } = await supabase
    .from('students')
    .insert({ first_name: trimmed, level: DEFAULT_LEVEL })
    .select()
    .single<Student>();

  if (error || !data) throw error;

  await addHistory({
    student_id: data.id,
    student_first_name: data.first_name,
    previous_level: null,
    new_level: data.level,
    action_type: 'add student',
    note: null,
  });
}

export async function editStudent(id: string, firstName: string, oldName: string, level: number) {
  const trimmed = firstName.trim();
  const { data, error } = await supabase
    .from('students')
    .update({ first_name: trimmed })
    .eq('id', id)
    .select()
    .single<Student>();
  if (error || !data) throw error;

  await addHistory({
    student_id: data.id,
    student_first_name: data.first_name,
    previous_level: level,
    new_level: level,
    action_type: 'edit student',
    note: `Renamed from ${oldName} to ${data.first_name}`,
  });
}

export async function removeStudent(student: Student) {
  const { error } = await supabase.from('students').delete().eq('id', student.id);
  if (error) throw error;

  await addHistory({
    student_id: student.id,
    student_first_name: student.first_name,
    previous_level: student.level,
    new_level: null,
    action_type: 'remove student',
    note: null,
  });
}

interface UpdateLevelArgs {
  student: Student;
  direction?: 'up' | 'down';
  setTo?: number;
  note?: string;
}

export async function updateStudentLevel({ student, direction, setTo, note }: UpdateLevelArgs) {
  const current = student.level;
  let next = current;
  let action: ActionType = 'set level';

  if (direction === 'up') {
    next = Math.min(7, current + 1);
    action = 'move up';
  }
  if (direction === 'down') {
    next = Math.max(1, current - 1);
    action = 'move down';
  }
  if (typeof setTo === 'number') {
    next = Math.max(1, Math.min(7, setTo));
    action = 'set level';
  }

  if (next === current && direction) return;

  const { error } = await supabase.from('students').update({ level: next }).eq('id', student.id);
  if (error) throw error;

  await addHistory({
    student_id: student.id,
    student_first_name: student.first_name,
    previous_level: current,
    new_level: next,
    action_type: action,
    note: note?.trim() || null,
  });
}

export async function startNewDay(students: Student[]) {
  const today = getDayKey();
  const { error: dayError } = await supabase.from('history_days').upsert({ day_key: today });
  if (dayError) throw dayError;

  const updates = students
    .filter((student) => student.level !== DEFAULT_LEVEL)
    .map((student) => supabase.from('students').update({ level: DEFAULT_LEVEL }).eq('id', student.id));

  const updateResults = await Promise.all(updates);
  const failedUpdate = updateResults.find((result) => result.error);
  if (failedUpdate?.error) throw failedUpdate.error;

  const historyWrites = students.map((student) =>
    addHistory({
      student_id: student.id,
      student_first_name: student.first_name,
      previous_level: student.level,
      new_level: DEFAULT_LEVEL,
      action_type: 'new day reset',
      note: null,
    })
  );

  await Promise.all(historyWrites);
}

async function addHistory(payload: Omit<HistoryRecord, 'id' | 'created_at' | 'day_key'>) {
  const dayKey = getDayKey();
  const { error: dayErr } = await supabase.from('history_days').upsert({ day_key: dayKey });
  if (dayErr) throw dayErr;

  const { error } = await supabase.from('history_logs').insert({
    ...payload,
    day_key: dayKey,
  });

  if (error) throw error;
}
