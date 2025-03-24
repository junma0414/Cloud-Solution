import Head from 'next/head';

export default function Home() {
  return (
    <div>
      <Head>
        <title>Your Cloud Solution</title>
        <meta name="description" content="Your reliable cloud partner." />
      </Head>
      <header className="hero">
        <div className="container">
          <h1>Your Cloud Solution</h1>
          <p>Scalable, secure, and reliable cloud infrastructure for your business.</p>
          <div className="cta-buttons">
            <a href="/pricing" className="btn-primary">View Pricing</a>
            <a href="/contact" className="btn-secondary">Contact Us</a>
          </div>
        </div>
      </header>
    </div>
  );
}

<section className="features">
  <div className="container">
    <h2>Features</h2>
    <div className="feature-grid">
      <div className="feature">
        <h3>Scalable Infrastructure</h3>
        <p>Grow your business without worrying about infrastructure limits.</p>
      </div>
      <div className="feature">
        <h3>24/7 Support</h3>
        <p>Our team is always available to assist you.</p>
      </div>
      <div className="feature">
        <h3>Secure Data Storage</h3>
        <p>Your data is safe with our advanced security measures.</p>
      </div>
    </div>
  </div>
</section>


<section className="testimonials">
  <div className="container">
    <h2>What Our Customers Say</h2>
    <div className="testimonial-grid">
      <div className="testimonial">
        <p>"Amazing service! Highly recommended."</p>
        <p>- John Doe</p>
      </div>
      <div className="testimonial">
        <p>"The best cloud solution we've ever used."</p>
        <p>- Jane Smith</p>
      </div>
    </div>
  </div>
</section>

