'use client'; // Mark this as a Client Component
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';
import Image from 'next/image'; // Import the Next.js Image component
import logo from '../../public/main.jpg' // Adjust the path to your logo file


export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
        <Image
            src={logo}// Path to your logo
            alt="AI Solution Logo" // Alt text for accessibility
            width={120} // Set the width of the logo
            height={80} // Set the height of the logo
            priority // Optional: Prioritize loading the logo
          />
  
        </Link>

        {/* Navigation Links */}
        <div className={styles.links}>
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
              pathname === '/article' ? styles.active : ''
            }`}
          >
            Article
          </Link>
          <Link
            href="/contact"
            className={`${styles.link} ${
              pathname === '/contact' ? styles.active : ''
            }`}
          >
            Contact
          </Link>
        </div>
      </div>
    </nav>
  );
}