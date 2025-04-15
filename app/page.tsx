// app/page.js
import Navbar from './components/Navbar.js';
import styles from './page.module.css';

import Layout from './components/Layout'


export default function Home() {
  return (
    <div>
      <Navbar />
      <Layout>
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <h1 className={styles.title}>Revolutionize Your Business with AI</h1>
          <p className={styles.subtitle}>
            Our cutting-edge AI solutions help you automate, optimize, and grow.
          </p>
          <div className={styles.cta}>
            <a href="/solution" className={styles.ctaPrimary}>
              Learn More
            </a>
            <a href="/contact" className={styles.ctaSecondary}>
              Contact Us
            </a>
          </div>
        </section>
      </main>
      </Layout>
    </div>
  );
}