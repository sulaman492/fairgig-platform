import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import Navbar from '../components/Layout/Navbar';
import { authApi, getApiErrorMessage } from '../lib/authApi';

const Signup = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validateForm = () => {
    const nextErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = 'Full name is required.';
    }
    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!formData.password) {
      nextErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);
    setServerError('');

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.post('/api/auth/signup', {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        role: 'worker',
      });

      navigate('/dashboard');
    } catch (error) {
      setServerError(getApiErrorMessage(error, 'Unable to create your account right now. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f3f4f6_0%,_#eef2f7_32%,_#e5e7eb_100%)]">
      <Navbar />
      <main className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 pb-16 pt-28 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8">
        <section className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-700">Create account</p>
          <h1 className="mt-4 font-display text-4xl leading-tight text-slate-950 sm:text-5xl">
            Start your FairGig profile and keep your work history in one place.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-600">
            FairGig helps gig workers turn scattered platform activity into something useful: verified earnings, a stronger work
            record, and a clearer path when payments or account issues go wrong.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[28px] bg-white/80 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
              <div className="text-2xl font-bold text-slate-950">Verified earnings</div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Build income records you can use for applications, documentation, and proof of work.
              </p>
            </div>
            <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
              <div className="text-2xl font-bold">Worker support</div>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Keep disputes, payment issues, and platform records easier to track when you need them.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-md rounded-[34px] border border-white/80 bg-white/90 p-7 shadow-[0_22px_60px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <h2 className="font-display text-3xl text-slate-950">Join FairGig</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">Create your account to start building verified work history.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Full name</span>
              <div className="relative">
                <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ayesha Khan"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </div>
              {errors.fullName && <p className="mt-2 text-sm text-red-600">{errors.fullName}</p>}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Email address</span>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-12 py-3.5 outline-none transition focus:border-slate-900 focus:bg-white"
                />
              </div>
              {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="At least 6 characters"
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
              {errors.password && <p className="mt-2 text-sm text-red-600">{errors.password}</p>}
            </label>

            <label className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
              <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-950 focus:ring-slate-500" />
              <span>
                I agree to the <a href="#" className="font-semibold text-slate-800">Terms</a> and <a href="#" className="font-semibold text-slate-800">Privacy Policy</a>.
              </span>
            </label>

            {serverError && (
              <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-950 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Creating account...' : 'Create account'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-slate-800 hover:text-slate-950">
              Log in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default Signup;
