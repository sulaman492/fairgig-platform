import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, Briefcase } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Layout/Navbar';
import { authApi, getApiErrorMessage } from '../lib/authApi';

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    const loadingToast = toast.loading('Logging in...');

    try {
      const response = await authApi.post('/api/auth/login', {
        email: email.trim(),
        password,
      });

      toast.success(`Welcome back, ${response.data.user?.name || 'Worker'}!`, {
        id: loadingToast,
        duration: 3000,
      });

      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 500);
      
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Unable to log in. Please check your credentials.');
      toast.error(errorMessage, {
        id: loadingToast,
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Navbar />
      
      {/* Responsive main container */}
      <main className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4 sm:px-6 py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-[95%] sm:max-w-md md:max-w-lg lg:max-w-md">
          
          {/* Welcome Section - Responsive typography */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
              Welcome Back
            </h1>
            <p className="text-sm sm:text-base text-gray-500 mt-1 sm:mt-2">
              Sign in to continue to your dashboard
            </p>
          </div>

          {/* Form Card - Responsive padding */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 sm:p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
              
              {/* Email Field - Responsive input sizing */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-700 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 text-sm sm:text-base
                             focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
                             transition-all duration-200 outline-none"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-focus-within:text-gray-700 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 sm:pl-12 pr-9 sm:pr-12 py-2.5 sm:py-3.5 text-sm sm:text-base
                             focus:bg-white focus:border-gray-400 focus:ring-2 focus:ring-gray-200 
                             transition-all duration-200 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password - Responsive row/column */}
              <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3 xs:gap-0 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500 focus:ring-2"
                  />
                  <span className="text-gray-600 text-sm">Remember me</span>
                </label>
                <a href="#" className="text-gray-600 hover:text-gray-900 font-medium transition-colors text-sm">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button - Responsive sizing */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="relative w-full mt-4 sm:mt-6 py-2.5 sm:py-3.5 px-4 rounded-xl font-semibold text-white text-sm sm:text-base
                         bg-gray-900 hover:bg-gray-800 
                         disabled:opacity-70 disabled:cursor-not-allowed
                         transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]
                         shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Logging in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <div className="mt-5 sm:mt-6 text-center">
              <p className="text-gray-600 text-sm sm:text-base">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-gray-900 hover:text-gray-700 transition-colors">
                  Create one here
                </Link>
              </p>
            </div>

            {/* Trust Badge - Responsive text size */}
            <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-100">
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  <span>Secure Login</span>
                </div>
                <span className="hidden xs:inline">•</span>
                <span className="xs:inline hidden">256-bit SSL</span>
                <span className="hidden xs:inline">•</span>
                <div className="flex items-center gap-1">
                  <span>Privacy Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;