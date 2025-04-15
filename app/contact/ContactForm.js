// app/contact/ContactForm.js
'use client';

import { useState } from 'react';
import styles from './contact.module.css'; // Changed to use contact.module.css

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    const formData = new FormData(event.target);
    const data = {
      name: formData.get('name'),
      email: formData.get('email'),
      message: formData.get('message'),
    };

    try {
      const response = await fetch('/sendEmail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setMessage({ text: 'Message sent successfully!', type: 'success' });
        event.target.reset(); // Clear the form
      } else {
        setMessage({ text: 'Failed to send message. Please try again.', type: 'error' });
      }
    } catch (error) {
      setMessage({ text: 'An error occurred. Please try again later.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>Name</label>
        <input
          type="text"
          name="name"
          id="name"
          placeholder="Your Name"
          required
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>Email</label>
        <input
          type="email"
          name="email"
          id="email"
          placeholder="Your Email"
          required
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label htmlFor="message" className={styles.label}>Message</label>
        <textarea
          name="message"
          id="message"
          placeholder="Your Message"
          required
          className={styles.textarea}
          rows="5"
        ></textarea>
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className={styles.submitButton}
      >
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </button>
      {message.text && (
        <div 
          className={`${styles.message} ${message.type === 'success' ? styles.success : styles.error}`}
        >
          {message.text}
        </div>
      )}
    </form>
  );
}