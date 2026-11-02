import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const input =
  'w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-maroon/20 focus:bg-white transition-all duration-200';
const label = 'text-xs font-bold uppercase text-gray-600';

export default function AuthPage() {
  const { user, login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />; 

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });
  const switchMode = (toSignup) => { setIsSignup(toSignup); setError(''); setSuccess(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setBusy(true);
    try {
      if (isSignup) {
        const d = await signup(form.username, form.email, form.password);
        setSuccess(d.message);
        setIsSignup(false);                     
        setForm({ ...form, password: '' });
      } else {
        await login(form.email, form.password);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-maroon mb-2">WordWeave</h1>
          <p className="text-gray-500 text-sm font-medium">
            {isSignup ? 'Join WordWeave today and begin weaving your stories.' : 'Welcome back! Please login to your account.'}
          </p>
        </div>

        {error && <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">{error}</div>}
        {success && <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl text-sm font-semibold">{success}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignup && (
            <div className="flex flex-col gap-1.5">
              <label className={label}>Username</label>
              <input value={form.username} onChange={set('username')} required minLength={3} maxLength={15}
                pattern="^[a-zA-Z0-9_\-]+$" title="Letters, numbers, underscores and hyphens only." className={input} />
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className={label}>Email Address</label>
            <input type="email" value={form.email} onChange={set('email')} required className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={label}>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={isSignup ? 6 : undefined}
              placeholder={isSignup ? 'Minimum 6 characters' : ''} className={input} />
          </div>

          <button type="submit" disabled={busy} className="w-full py-3.5 bg-maroon text-white font-bold rounded-xl hover:bg-maroon-hover active:scale-[0.99] transition-all text-base shadow-md shadow-maroon/10 disabled:opacity-60">
            {busy ? 'Please wait…' : isSignup ? 'Register Account' : 'Sign In'}
          </button>
        </form>

        <button onClick={() => switchMode(!isSignup)} className="block w-full text-center text-sm font-bold text-maroon hover:text-maroon-hover underline mt-5">
          {isSignup ? 'Already have an account? Login here' : "Don't have an account? Sign Up"}
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" /><span className="text-xs font-bold text-gray-400 uppercase">or</span><div className="flex-1 h-px bg-gray-200" />
        </div>
        <Link to="/" className="block w-full text-center py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors text-sm">
          Continue as guest →
        </Link>
      </div>
    </div>
  );
}