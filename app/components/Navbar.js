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
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check active session
 const [mounted, setMounted] = useState(false); // Add mounted state

  // Check active session
  useEffect(() => {
    setMounted(true); // Set mounted to true on client side
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
        setShowAuthDialog(false);
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {

    const redirectUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/auth/callback' 
    : `https://obserpedia.com/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href // Stay on current page after login
      }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowProfileDropdown(false);
  };

  const toggleProfileDropdown = () => {
    setShowProfileDropdown(!showProfileDropdown);
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
            className={`${styles.link} ${mounted && pathname === '/' ? styles.active : ''}`}
          >
            Home
          </Link>
          <Link
            href="/solution"
            className={`${styles.link} ${mounted && pathname === '/solution' ? styles.active : ''}`}
          >
            Solution
          </Link>
          <Link
            href="/article"
            className={`${styles.link} ${mounted && pathname === '/article' ? styles.active : ''}`}
          >
            Docs
          </Link>
          <Link
            href="/api-guide"
            className={`${styles.link} ${mounted && pathname === '/api-guide' ? styles.active : ''}`}
          >
            API
          </Link>
          <Link
            href="/contact"
            className={`${styles.link} ${mounted && pathname === '/contact' ? styles.active : ''}`}
          >
            Contact
          </Link>
          
          {/* Auth Button */}
          {mounted && user ? (
            <div className={styles.profileContainer}>
              <button 
                onClick={toggleProfileDropdown}
                className={styles.profileButton}
              >
         
                  <Image
  src={user?.app_metadata?.provider === 'google' ? '/google-logo.png' : '/email.png'}
  alt="Profile"
  width={32}
  height={32}
  className={styles.profileImage}
/>

              </button>
              
              {showProfileDropdown && (
                <div className={styles.profileDropdown}>
                  <div className={styles.dropdownItemDisabled}>Dashboard</div>
                  <div className={styles.dropdownItemDisabled}>Usage</div>
                  <div className={styles.dropdownItemDisabled}>API Keys</div>
                  <div 
                    className={styles.dropdownItem}
                    onClick={handleLogout}
                  >
                    Log Out
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthDialog(true)}
              className={`${styles.link} ${styles.loginButton}`}
            >
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Auth Dialog */}
      {showAuthDialog && (
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
              <Image 
                src="/google-logo.png" // Add your Google logo image
                width={16}
                height={16}
                alt="Google"
                className={styles.googleIcon}
              />
              Continue with Google
            </button>

            <div className={styles.authToggle}>
              {authMode === 'login' ? (
                <>
                  <span>Don't have an account?</span>
                  <button 
                    onClick={() => setAuthMode('signup')}
                    className={styles.toggleButton}
                  >
                    Sign Up
                  </button>
                </>
              ) : (
                <>
                  <span>Already have an account?</span>
                  <button 
                    onClick={() => setAuthMode('login')}
                    className={styles.toggleButton}
                  >
                    Log In
                  </button>
                </>
              )}
            </div>

            <button 
              onClick={() => setShowAuthDialog(false)}
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