import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Please enter your email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email');
      return;
    }

    setStep(2);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(formData.email, formData.newPassword);
    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess('Password reset successful!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-heading font-poppins text-dark mb-2">Reset Password</h1>
          <p className="text-body text-gray-500">
            {step === 1 ? 'Enter your email to reset your password' : 'Create a new password'}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-body p-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label className="block text-body text-gray-600 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter your email"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3"
            >
              Continue
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-body p-3 rounded-lg">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-600 text-body p-3 rounded-lg">
                {success}
              </div>
            )}

            <div>
              <label className="block text-body text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Enter new password"
              />
            </div>

            <div>
              <label className="block text-body text-gray-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="input-field"
                placeholder="Confirm new password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="btn-ghost w-full py-3"
            >
              Back
            </button>
          </form>
        )}

        <p className="text-center text-body text-gray-500 mt-6">
          Remember your password?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
