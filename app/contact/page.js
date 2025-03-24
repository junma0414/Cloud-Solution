// app/contact/page.js
import React from 'react';
import Navbar from '../components/Navbar.js';
import styles from './page.module.css'; // Use only one CSS module
import ContactForm from './ContactForm'; // Import the Client Component

export default function ContactPage() {
  return (
    <div>
      {/* Navbar (if needed) */}
      <Navbar />

      {/* About Section */}
      <div className={styles.aboutSection}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>About Me</h1>
        <p>
          We specialize in <strong>AI audits</strong>, helping businesses assess and optimize
          their artificial intelligence systems for performance, ethics, and compliance.
          Our expertise extends to providing tailored <strong>AI solutions</strong>,
          with a strong focus on <strong>AI vision technologies</strong> and <strong>AIOps</strong>.
        </p>
        <p>
          Whether you need to implement cutting-edge computer vision systems, streamline IT operations with AI-driven insights, or enhance existing AI capabilities, we’re here to guide you every step of the way. Let us empower your business with intelligent, scalable, and innovative AI solutions that drive efficiency and growth.
        </p>
      </div>

      {/* Contact Form Section */}
      <div className={styles.contactForm}>
        <h2 className={styles.formTitle}>Contact Us</h2>
        <form className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name" className={styles.label}>Name</label>
            <input type="text" id="name" name="name" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input type="email" id="email" name="email" className={styles.input} required />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="message" className={styles.label}>Message</label>
            <textarea id="message" name="message" className={styles.textarea} rows="5" required />
          </div>
          <button type="submit" className={styles.submitButton}>Send Message</button>
        </form>
      </div>
    </div>
  );
}