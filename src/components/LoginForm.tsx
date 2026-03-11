import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

interface Props {
  onError: (msg: string) => void;
}

export function LoginForm({ onError }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) onError(error.message);
    setLoading(false);
  }

  return (
    <form className="card login-card" onSubmit={onSubmit}>
      <h1>Teacher Login</h1>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required />
      <input
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        type="password"
        required
      />
      <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
    </form>
  );
}
