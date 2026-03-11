import { useMemo, useState } from 'react';
import { LEVELS } from '../constants';
import { addStudent, editStudent, removeStudent, startNewDay, updateStudentLevel } from '../lib/api';
import { getDayKey } from '../lib/day';
import type { HistoryRecord, Student } from '../types';

interface Props {
  students: Student[];
  history: HistoryRecord[];
  days: string[];
  selectedDay: string;
  onRefreshHistory: (day: string) => Promise<void>;
  onError: (message: string) => void;
}

export function TeacherDashboard({
  students,
  history,
  days,
  selectedDay,
  onRefreshHistory,
  onError,
}: Props) {
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState('');
  const [noteByStudent, setNoteByStudent] = useState<Record<string, string>>({});

  const filtered = useMemo(
    () => students.filter((student) => student.first_name.toLowerCase().includes(query.toLowerCase())),
    [students, query]
  );

  return (
    <div className="dashboard">
      <section className="card controls">
        <h1>Teacher Dashboard</h1>
        <div className="inline">
          <input placeholder="Search students" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button
            className="danger"
            onClick={async () => {
              try {
                if (window.confirm('Start new day and reset all students to Level 4?')) {
                  await startNewDay(students);
                  await onRefreshHistory(getDayKey());
                }
              } catch (error) {
                onError(error instanceof Error ? error.message : 'Failed to start new day.');
              }
            }}
          >
            Start New Day
          </button>
        </div>
        <div className="inline">
          <input
            placeholder="Add student first name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            onClick={async () => {
              if (!newName.trim()) return;
              try {
                await addStudent(newName);
                setNewName('');
              } catch (error) {
                onError(error instanceof Error ? error.message : 'Failed to add student.');
              }
            }}
          >
            Add Student
          </button>
        </div>
      </section>

      <section className="card">
        <h2>Students ({filtered.length})</h2>
        <div className="student-list">
          {filtered.map((student) => (
            <article key={student.id} className="student-row">
              <div>
                <strong>{student.first_name}</strong>
                <p>Level {student.level}</p>
              </div>
              <div className="inline buttons">
                <button
                  onClick={async () => {
                    try {
                      await updateStudentLevel({ student, direction: 'up', note: noteByStudent[student.id] });
                    } catch (error) {
                      onError(error instanceof Error ? error.message : 'Failed to move student up.');
                    }
                  }}
                >
                  +1
                </button>
                <button
                  onClick={async () => {
                    try {
                      await updateStudentLevel({ student, direction: 'down', note: noteByStudent[student.id] });
                    } catch (error) {
                      onError(error instanceof Error ? error.message : 'Failed to move student down.');
                    }
                  }}
                >
                  -1
                </button>
                <select
                  value={student.level}
                  onChange={async (e) => {
                    try {
                      await updateStudentLevel({
                        student,
                        setTo: Number(e.target.value),
                        note: noteByStudent[student.id],
                      });
                    } catch (error) {
                      onError(error instanceof Error ? error.message : 'Failed to set level.');
                    }
                  }}
                >
                  {LEVELS.map((level) => (
                    <option key={level.level} value={level.level}>
                      L{level.level}
                    </option>
                  ))}
                </select>
                <input
                  placeholder="Optional note"
                  value={noteByStudent[student.id] || ''}
                  onChange={(e) => setNoteByStudent((prev) => ({ ...prev, [student.id]: e.target.value }))}
                />
                <button
                  onClick={async () => {
                    const edited = window.prompt('Edit first name', student.first_name);
                    if (!edited || edited === student.first_name) return;
                    try {
                      await editStudent(student.id, edited, student.first_name, student.level);
                    } catch (error) {
                      onError(error instanceof Error ? error.message : 'Failed to edit student.');
                    }
                  }}
                >
                  Edit
                </button>
                <button
                  className="danger"
                  onClick={async () => {
                    if (!window.confirm(`Remove ${student.first_name} from the roster?`)) return;
                    try {
                      await removeStudent(student);
                    } catch (error) {
                      onError(error instanceof Error ? error.message : 'Failed to remove student.');
                    }
                  }}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="inline">
          <h2>Daily History ({selectedDay})</h2>
          <select
            value={selectedDay}
            onChange={async (e) => {
              try {
                await onRefreshHistory(e.target.value);
              } catch (error) {
                onError(error instanceof Error ? error.message : 'Failed to refresh history.');
              }
            }}
          >
            {days.map((day) => (
              <option key={day} value={day}>
                {day}
              </option>
            ))}
          </select>
        </div>
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <strong>{item.student_first_name}</strong>
              <span>{item.action_type}</span>
              <span>
                {item.previous_level ?? '-'} → {item.new_level ?? '-'}
              </span>
              <time>{new Date(item.created_at).toLocaleTimeString()}</time>
              <em>{item.note || ''}</em>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
