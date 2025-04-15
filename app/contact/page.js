// app/contact/page.js
import React from 'react';
import Navbar from '../components/Navbar.js';
import styles from './contact.module.css'; // Use contact.module.css
import ContactForm from './ContactForm';
import Layout from '../components/Layout';

export default function ContactPage() {
  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        {/* About Section */}
        <div className={styles.aboutSection}>
          <h1 className={styles.title}>About Us</h1>
          <p className={styles.description}>
            We specialize in <strong>AI audits</strong>, helping businesses assess and optimize
            their artificial intelligence systems for performance, ethics, and compliance.
            Our expertise extends to providing tailored <strong>AI solutions</strong>,
            with a strong focus on <strong>AI vision technologies</strong> and <strong>AIOps</strong>.
          </p>
          <p className={styles.description}>
            Whether you need to implement cutting-edge computer vision systems, streamline IT operations with AI-driven insights, or enhance existing AI capabilities, we're here to guide you every step of the way. Let us empower your business with intelligent, scalable, and innovative AI solutions that drive efficiency and growth.
          </p>
        </div>

        {/* Contact Form Section */}
        <div className={styles.contactForm}>
          <h2 className={styles.formTitle}>Contact Us</h2>
          <ContactForm />
        </div>
      </div>
      <Layout />
    </div>
  );
}