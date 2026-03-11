import { useEffect, useMemo, useState } from 'react';
import { LoginForm } from './components/LoginForm';
import { StudentDisplay } from './components/StudentDisplay';
import { TeacherDashboard } from './components/TeacherDashboard';
import { fetchHistory, fetchHistoryDays, fetchStudents } from './lib/api';
import { getDayKey } from './lib/day';
import { supabase } from './lib/supabase';
import type { HistoryRecord, Student } from './types';

export default function App() {
  const [students, setStudents] = useState<Student[]>([]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [days, setDays] = useState<string[]>([getDayKey()]);
  const [selectedDay, setSelectedDay] = useState(getDayKey());
  const [sessionReady, setSessionReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState('');

  const mode = useMemo(() => new URLSearchParams(window.location.search).get('view'), []);
  const isDisplayMode = mode === 'display';

  useEffect(() => {
    const init = async () => {
      const { data: studentsData, error: studentErr } = await fetchStudents();
      if (studentErr) {
        setError(studentErr.message);
      } else {
        setStudents(studentsData || []);
      }

      if (isDisplayMode) {
        setSessionReady(true);
        return;
      }

      const [{ data: daysData, error: daysErr }, { data: sessionData }] = await Promise.all([
        fetchHistoryDays(),
        supabase.auth.getSession(),
      ]);

      if (daysErr) {
        setError(daysErr.message);
      } else {
        const loadedDays = (daysData || []).map((d) => d.day_key);
        if (loadedDays.length) {
          setDays(loadedDays);
          setSelectedDay(loadedDays[0]);
        }
      }

      setLoggedIn(Boolean(sessionData.session));
      setSessionReady(true);
    };

    void init();

    const studentsChannel = supabase
      .channel('students-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, async () => {
        const { data, error: studentErr } = await fetchStudents();
        if (studentErr) {
          setError(studentErr.message);
          return;
        }
        setStudents(data || []);
      })
      .subscribe();

    if (isDisplayMode) {
      return () => {
        void supabase.removeChannel(studentsChannel);
      };
    }

    const historyChannel = supabase
      .channel('history-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'history_logs' }, async () => {
        const { data, error: historyErr } = await fetchHistory(selectedDay);
        if (historyErr) {
          setError(historyErr.message);
          return;
        }
        setHistory(data || []);
      })
      .subscribe();

    const authSub = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(Boolean(session)));

    return () => {
      void supabase.removeChannel(studentsChannel);
      void supabase.removeChannel(historyChannel);
      authSub.data.subscription.unsubscribe();
    };
  }, [isDisplayMode, selectedDay]);

  useEffect(() => {
    if (!isDisplayMode && loggedIn) {
      void refreshHistory(selectedDay);
    }
  }, [isDisplayMode, loggedIn, selectedDay]);

  async function refreshHistory(day: string) {
    setSelectedDay(day);
    const [{ data: historyData, error: historyErr }, { data: daysData, error: daysErr }] = await Promise.all([
      fetchHistory(day),
      fetchHistoryDays(),
    ]);

    if (historyErr) {
      setError(historyErr.message);
    } else {
      setHistory(historyData || []);
    }

    if (daysErr) {
      setError(daysErr.message);
    } else {
      const loadedDays = (daysData || []).map((d) => d.day_key);
      if (loadedDays.length) setDays(loadedDays);
    }
  }

  if (!sessionReady) return <div className="loading">Loading…</div>;

  if (isDisplayMode) {
    return (
      <>
        {error && <p className="error-banner">{error}</p>}
        <StudentDisplay students={students} />
      </>
    );
  }

  if (!loggedIn) {
    return (
      <div className="centered">
        <LoginForm onError={setError} />
        {error && <p className="error">{error}</p>}
      </div>
    );
  }

  return (
    <>
      <header className="topbar">
        <h1>Classroom Behavior Manager</h1>
        <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
      </header>
      {error && <p className="error-banner">{error}</p>}
      <TeacherDashboard
        students={students}
        history={history}
        days={days}
        selectedDay={selectedDay}
        onRefreshHistory={refreshHistory}
        onError={setError}
      />
    </>
  );
}
