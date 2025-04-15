'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase/client';
import { useRouter } from 'next/navigation';
import styles from './ResetPassword.module.css';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get("access_token");
      const type = params.get("type");
    const email=params.get("email");

      if (type === "recovery" && token) {
        try {
          // Only verify the token without email
          const { error: verificationError } = await supabase.auth.verifyOtp({
            token,
            type: 'recovery',
           email: email
          });

          if (verificationError) throw verificationError;
          
          setLoading(false);
        } catch (err) {
          setError(err.message.includes('expired') 
            ? "This link has expired. Please request a new one." 
            : "Invalid verification link");
          setLoading(false);
        }
      } else {
        setError("Invalid password reset link");
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setError(null); // Reset error state
  
  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  try {
    const { error: updateError } = await supabase.auth.updateUser({
      password
    });

    if (updateError) {
      setError(
        updateError.message.includes('different') 
          ? 'Please choose a different password' 
          : updateError.message
      );
      return;
    }
    
    setSuccess(true);
  } catch (err) {
    setError('Failed to update password');
  }
};

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Validating your reset link...</h2>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <h2>Password Reset Error</h2>
          <p className={styles.error}>{error}</p>
          <button 
            onClick={() => router.push('/forgot-password')}
            className={styles.button}
          >
            Request New Reset Link
          </button>
        </div>
      </div>
    );
  }

return (
  <div className={styles.container}>
    <div className={styles.card}>
      <h1 className={styles.title}>Set New Password</h1>
      
      {success ? (
        <div className={styles.successMessage}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Password updated successfully!
        </div>
      ) : error ? (
        // Only this error section is changed - everything else remains identical
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ marginBottom: '1rem', fontSize: '1.25rem', fontWeight: '600' }}>
            Password Reset Needed
          </h2>
          <div style={{
            backgroundColor: '#fef2f2',
            padding: '1rem',
            borderRadius: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            <p style={{ 
              color: '#b91c1c', 
              margin: 0,
              lineHeight: '1.5'
            }}>
              {error.includes('different') 
                ? 'Please choose a new password different from your current one'
                : error}
            </p>
          </div>
          <button
            onClick={() => router.push('/')}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#4f46e5',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            OK
          </button>
        </div>
      ) : (
        // Original form code remains completely unchanged
        <form onSubmit={handleSubmit}>
          <div className={styles.passwordField}>
            <label className={styles.fieldLabel}>New Password</label>
            <input
              type="password"
              className={styles.inputField}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Enter new password"
            />
          </div>
          
          <div className={styles.passwordField}>
            <label className={styles.fieldLabel}>Confirm Password</label>
            <input
              type="password"
              className={styles.inputField}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              placeholder="Re-enter new password"
            />
           {error && (
  <div style={{
    backgroundColor: '#fef2f2',
    padding: '1rem',
    borderRadius: '8px',
    margin: '1rem 0',
    textAlign: 'center',
    border: '1px solid #fee2e2'
  }}>
    <p style={{
      color: '#b91c1c',
      margin: 0,
      fontSize: '0.9375rem',
      lineHeight: '1.5'
    }}>
      {error.includes('different') 
        ? 'For security, please choose a new password'
        : error}
    </p>
  </div>
)}
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className={styles.loadingSpinner} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                </svg>
                Updating...
              </span>
            ) : 'Reset Password'}
          </button>
        </form>
      )}
    </div>
  </div>
);
}