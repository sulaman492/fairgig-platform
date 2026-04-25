import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import { authApi, getApiErrorMessage } from '../lib/authApi';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError('');
    setIsSubmitting(true);

    try {
      await authApi.post('/api/auth/login', {
        email: email.trim(),
        password,
      });

      navigate('/dashboard');
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to log in right now. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_45%,_#e5e7eb_100%)]">
      <Navbar />
      <main className="mx-auto flex min-h-screen max-w-7xl items-center px-4 pb-16 pt-28 sm:px-6 lg:grid lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-8">
        <section className="hidden rounded-[34px] bg-slate-950 p-10 text-white shadow-2xl lg:block">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-300">Welcome back</p>
          <h1 className="mt-5 font-display text-5xl leading-tight">Pick up right where your records left off.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Sign in to review verified earnings, track dispute updates, and keep your worker history organized in one place.
          </p>
          <div className="mt-10 rounded-[28px] border border-white/10 bg-white/5 p-6">
            <p className="text-sm text-slate-300">Fastest returning flow</p>
            <p className="mt-2 text-3xl font-bold">Under 30 seconds</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">Designed so workers can get in, find what they need, and move on with their day.</p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-[34px] border border-white/80 bg-white/90 p-7 shadow-[0_22px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-700">Log in</p>
          <h2 className="mt-4 font-display text-3xl text-slate-950">Access your FairGig account</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Use your email and password to continue to your worker dashboard.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 pr-12 outline-none transition focus:border-slate-900 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-500" />
                Keep me signed in
              </label>
              <a href="#" className="font-medium text-slate-800 hover:text-slate-950">
                Forgot password?
              </a>
            </div>

            {serverError && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Logging in...' : 'Continue'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Need an account?{' '}
            <Link to="/signup" className="font-semibold text-slate-800 hover:text-slate-950">
              Create one here
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Login;
