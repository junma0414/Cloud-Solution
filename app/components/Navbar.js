'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import Image from 'next/image';
import logo from '../../public/main.png';
import { useState } from 'react'; // Import useState for dialog state

export default function Navbar() {
  const pathname = usePathname();
  const [showDialog, setShowDialog] = useState(false); // State for dialog visibility

  const handleLoginClick = () => {
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
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
            className={`${styles.link} ${
              pathname === '/' ? styles.active : ''
            }`}
          >
            Home
          </Link>
          <Link
            href="/solution"
            className={`${styles.link} ${
              pathname === '/solution' ? styles.active : ''
            }`}
          >
            Solution
          </Link>
          <Link
            href="/article"
            className={`${styles.link} ${
              pathname === '/docs' ? styles.active : ''
            }`}
          >
            Docs
          </Link>
          <Link
            href="/api"
            className={`${styles.link} ${
              pathname === '/api' ? styles.active : ''
            }`}
          >
            API
          </Link>
          <Link
            href="/contact"
            className={`${styles.link} ${
              pathname === '/contact' ? styles.active : ''
            }`}
          >
            Contact
          </Link>
          
          {/* Login Button */}
          <button 
            onClick={handleLoginClick}
            className={`${styles.link} ${styles.loginButton}`}
          >
            Log In
          </button>
        </div>
      </div>

      {/* Dialog Box */}
      {showDialog && (
        <div className={styles.dialogOverlay}>
          <div className={styles.dialogBox}>
            <h3>In Maintenance Now...</h3>
            <p>Our login system is currently under maintenance. Please check back later.</p>
            <button 
              onClick={closeDialog}
              className={styles.dialogButton}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}