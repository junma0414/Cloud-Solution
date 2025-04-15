'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase/client';
import styles from './Navbar.module.css';
import Image from 'next/image';
import logo from '../../public/main.png';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check active session
  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('Check your email for confirmation!');
        setAuthMode('login');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setShowDialog(false);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Define closeDialog function
  const closeDialog = () => {
    setShowDialog(false);
    setEmail('');
    setPassword('');
    setLoading(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className="flex items-center pb-4">
          <Image
            src={logo}
            alt="AI Solution Logo"
            width={120}
            height={80}
            priority
          />
        </Link>

        {/* Navigation Links */}
        <div className={styles.links}>
          <Link
            href="/"
            className={`${styles.link} ${pathname === '/' ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link
            href="/solution"
            className={`${styles.link} ${pathname === '/solution' ? styles.active : ''}`}
          >
            Solution
          </Link>
          <Link
            href="/article"
            className={`${styles.link} ${pathname === '/docs' ? styles.active : ''}`}
          >
            Docs
          </Link>
          <Link
            href="/api"
            className={`${styles.link} ${pathname === '/api' ? styles.active : ''}`}
          >
            API
          </Link>
          <Link
            href="/contact"
            className={`${styles.link} ${pathname === '/contact' ? styles.active : ''}`}
          >
            Contact
          </Link>
          
          {/* Auth Button */}
          {user ? (
            <button 
              onClick={handleLogout}
              className={`${styles.link} ${styles.loginButton}`}
            >
              Log Out
            </button>
          ) : (
            <button 
              onClick={() => setShowDialog(true)}
              className={`${styles.link} ${styles.loginButton}`}
            >
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Auth Dialog */}
      {showDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <h3>{authMode === 'login' ? 'Log In' : 'Sign Up'}</h3>
            
            <form onSubmit={handleAuth}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={styles.dialogInput}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={styles.dialogInput}
              />
              <button 
                type="submit" 
                disabled={loading}
                className={styles.dialogButton}
              >
                {loading ? 'Processing...' : authMode === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            </form>

            <button 
              onClick={handleGoogleLogin}
              className={styles.googleButton}
            >
              Continue with Google
            </button>

            <div className={styles.authToggle}>
              {authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className={styles.toggleButton}
                  >
                    Sign Up
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={styles.toggleButton}
                  >
                    Log In
                  </button>
                </span>
              )}
            </div>

            <button 
              onClick={closeDialog}
              className={styles.closeButton}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}