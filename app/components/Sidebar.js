// components/Sidebar.js
import React from 'react';

const Sidebar = ({ headings }) => {
  // Recursive function to render nested headings
  const renderHeadings = (headings) => {
    return (
      <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {headings.map((heading) => (
          <li key={heading.id} style={{ marginBottom: '10px' }}>
            {/* Use native anchor links for scrolling */}
            <a
              href={`#${heading.id}`}
              style={{ textDecoration: 'none', color: '#2563eb', fontSize: '14px' }}
            >
              {heading.text}
            </a>
            {heading.children.length > 0 && (
              <div style={{ paddingLeft: '20px', marginTop: '5px' }}>
                {renderHeadings(heading.children)}
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div style={{ width: '250px', padding: '20px', backgroundColor: '#f4f4f4', boxShadow: '2px 0 5px rgba(0, 0, 0, 0.1)' }}>
      {/* Add "Table of Contents" heading */}
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#2563eb', fontSize: '1.25rem' }}>
        Table of Contents
      </h3>
      {/* Render the nested headings */}
      {renderHeadings(headings)}
    </div>
  );
};

export default Sidebar;