// app/solution/page.js
import Navbar from '../components/Navbar.js';
import styles from './page.module.css';

export default function Solution() {
  return (
    <div>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Our AI Solution</h1>
        <p className={styles.description}>
          Explore our AI Solution and Product by mature AI for better AI. <br />

          Coming Soon.
        </p>
      </main>
    </div>
  );
}