// components/ActiveSectionHighlighter.js
'use client'; // Mark this as a Client Component
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';

export default function ActiveSectionHighlighter({ headings }) {
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 }
    );

    // Observe all headings
    document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((heading) => {
      observer.observe(heading);
    });

    return () => observer.disconnect(); // Cleanup observer
  }, []);

  return <Sidebar headings={headings} activeId={activeId} />;
}