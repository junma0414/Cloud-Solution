// app/page.js
import Navbar from './components/Navbar.js';
import styles from './page.module.css';
import Layout from './components/Layout';

export default function Home() {
  return (
    <div>
      <Navbar />
      <Layout>
        <main className={`${styles.main} bg-gradient-to-r from-blue-500 to-blue-900`}>
          <section className={styles.hero}>
            <div className={styles.heroLeft}>
              <h1 className="text-4xl !text-white font-extrabold mb-4 drop-shadow-lg text-white">
                Observe.Streamline.Revolutionize.
              </h1>
              <p className={`${styles.subtitle} text-gray-100`}>
                <span className="block mb-2">Revolutionize Your Business with AI with our cutting-edge AI solutions help you automate, 
                optimize, and grow.</span>
                <span>Continuously monitor your models, track drift, and ensure governance — all from one dashboard.</span>
              </p>
              <div className={styles.cta}>
                <a href="/solution" className={`${styles.ctaPrimary} bg-white text-blue-600 hover:bg-gray-100 font-semibold`}>
                  Learn More →
                </a>
                <a href="/contact" className={`${styles.ctaSecondary} border-2 border-white !text-white hover:bg-gay-100 hover:text-blue-600 font-semibold`}>
                  Contact Us
                </a>
              </div>
            </div>
            <div className={styles.heroRight}>
              <video
                className={styles.heroVideo}
                src="/obserpedia.webm"
                autoPlay
                muted
                loop
                playsInline
                width="100%"
                height="auto"
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </section>
        </main>
      {/* Structured Data */}
      <Script id="ld-json-homepage" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "Obserpedia",
          "url": "https://www.obserpedia.com",
          "logo": "https://www.obserpedia.com/logo.png",
          "description": "Obserpedia provides AI monitoring, risk auditing, and compliance solutions for LLMs and enterprise AI systems."
        })}
      </Script>

      <Script id="ld-json-website" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          "url": "https://www.obserpedia.com",
          "potentialAction": {
            "@type": "SearchAction",
            "target": "https://www.obserpedia.com/search?q={search_term_string}",
            "query-input": "required name=search_term_string"
          }
        })}
      </Script>

{/* end of json-ld */}
      </Layout>
    </div>
  );
}