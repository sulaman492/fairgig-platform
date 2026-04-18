// src/components/Login.tsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Login.css';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
}

const API_GATEWAY_URL = 'http://localhost:5000';

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // Clear server error when user starts typing
    if (serverError) {
      setServerError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setServerError('');

    try {
      // ✅ Call backend API through API Gateway
      const response = await axios.post(`${API_GATEWAY_URL}/api/auth/login`, {
        email: formData.email,
        password: formData.password
      }, {
        withCredentials: true  // ✅ Important for cookies
      });

      if (response.data.success) {
        const { user, token } = response.data;
        
        // Store user info based on remember me
        const storage = formData.rememberMe ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(user));
        storage.setItem('isLoggedIn', 'true');
        
        // Redirect based on role
        switch (user.role) {
          case 'worker':
            navigate('/worker/dashboard');
            break;
          case 'verifier':
            navigate('/verifier/dashboard');
            break;
          case 'advocate':
            navigate('/advocate/dashboard');
            break;
          default:
            navigate('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.data?.error) {
        setServerError(error.response.data.error);
      } else {
        setServerError('Invalid email or password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    alert('Please contact support to reset your password.');
  };

  const handleSocialLogin = (provider: string) => {
    alert(`${provider} login will be available soon. Please use email/password for now.`);
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-left">
          <div className="login-brand">
            <i className="fas fa-hand-peace"></i>
            <h2>FairGig</h2>
          </div>
          <div className="login-quote">
            <i className="fas fa-quote-right"></i>
            <p>Welcome back! Your journey to better gig opportunities continues here.</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <i className="fas fa-chart-line"></i>
              <div>
                <h4>Track Your Earnings</h4>
                <p>Monitor your income and grow your career</p>
              </div>
            </div>
            <div className="feature-item">
              <i className="fas fa-shield-alt"></i>
              <div>
                <h4>Secure Platform</h4>
                <p>Your data is protected with enterprise-grade security</p>
              </div>
            </div>
            <div className="feature-item">
              <i className="fas fa-headset"></i>
              <div>
                <h4>24/7 Support</h4>
                <p>Get help whenever you need it</p>
              </div>
            </div>
          </div>
          <div className="login-stats">
            <div className="stat">
              <span className="stat-number">50K+</span>
              <span className="stat-label">Active Users</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat">
              <span className="stat-number">98%</span>
              <span className="stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-header">
            <h1>Welcome back</h1>
            <p>Don't have an account? <a href="/signup">Sign up</a></p>
          </div>

          {serverError && (
            <div className="server-error">
              <i className="fas fa-exclamation-circle"></i>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">
                Email Address
              </label>
              <div className="input-wrapper">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email address"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'error' : ''}
                  autoComplete="email"
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>
              <div className="input-wrapper">
                <i className="fas fa-lock"></i>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'error' : ''}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <button 
                type="button" 
                className="forgot-password"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </>
              )}
            </button>

            <div className="login-divider">
              <span>or continue with</span>
            </div>

            <div className="social-login">
              <button 
                type="button" 
                className="social-btn google"
                onClick={() => handleSocialLogin('Google')}
              >
                <i className="fab fa-google"></i>
                Google
              </button>
              <button 
                type="button" 
                className="social-btn linkedin"
                onClick={() => handleSocialLogin('LinkedIn')}
              >
                <i className="fab fa-linkedin"></i>
                LinkedIn
              </button>
              <button 
                type="button" 
                className="social-btn github"
                onClick={() => handleSocialLogin('GitHub')}
              >
                <i className="fab fa-github"></i>
                GitHub
              </button>
            </div>
          </form>

          <div className="login-footer">
            <p>
              By signing in, you agree to our 
              <a href="/terms"> Terms of Service</a> and 
              <a href="/privacy"> Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;