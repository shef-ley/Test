import { LEVELS } from '../constants';
import type { Student } from '../types';

interface Props {
  students: Student[];
}

export function StudentDisplay({ students }: Props) {
  return (
    <main className="display-board">
      <header className="board-title">Classroom Clip Chart</header>
      <div className="stacked-levels">
        {LEVELS.map((level) => {
          const grouped = students.filter((student) => student.level === level.level);
          return (
            <section key={level.level} className="level-card presentation" style={{ borderColor: level.color }}>
              <header style={{ backgroundColor: level.color }}>
                <h2>Level {level.level}</h2>
                <p>{level.title}</p>
              </header>
              <div className="names-wrap">
                {grouped.length === 0 ? (
                  <p className="empty">No students</p>
                ) : (
                  grouped.map((student) => <span key={student.id}>{student.first_name}</span>)
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
