'use client';
import { useState, useMemo, useEffect } from 'react';
import styles from './AnalysisEnhancedDataTable.module.css';

function showCopied() {
  const notice = document.createElement('div');
  notice.textContent = '✓ Copied!';
  notice.style.position = 'fixed';
  notice.style.bottom = '20px';
  notice.style.right = '20px';
  notice.style.background = '#4CAF50';
  notice.style.color = 'white';
  notice.style.padding = '8px 16px';
  notice.style.borderRadius = '4px';
  notice.style.zIndex = '9999';
  
  document.body.appendChild(notice);
  setTimeout(() => notice.remove(), 1500);
}

// Usage
//navigator.clipboard.writeText(text).then(() => showCopied());
function copyToClipboard(text) {
  //navigator.clipboard.writeText(text);
navigator.clipboard.writeText(text).then(() => showCopied());
}

export default function EnhancedDataTable({ data = [], columns = [] , onSelectInputText }) {
  const [filters, setFilters] = useState({});
  const [visibleCount, setVisibleCount] = useState(50); // Show 50 rows initially
  const [selectedRowIndex, setSelectedRowIndex] = useState(null); // To track selected row

  const filterableAccessors = ['id', 'project_name', 'model_name'];
  const targetHeaders = ['Header', 'Request Body', 'Text', 'Response Body'];

  const handleFilterChange = (accessor, value) => {
    setFilters(prev => ({
      ...prev,
      [accessor]: value,
    }));
  };

  const filteredData = useMemo(() => {
    return data.filter(row =>
      columns.every(col => {
        const accessor = col.accessor;
        const filterValue = filters[accessor];
        if (!filterValue) return true;

        const cellValue = row[accessor];
        return cellValue?.toString().toLowerCase().includes(filterValue.toLowerCase());
      })
    );
  }, [data, filters, columns]);

  // Reset visible count when filtered data changes
  useEffect(() => {
    setVisibleCount(50);
  }, [filteredData]);

  if (!data.length) {
    return <div className={styles.noData}>No data available.</div>;
  }

  const handleRowClick = (rowIndex) => {
  const isSameRow = selectedRowIndex === rowIndex;
  setSelectedRowIndex(isSameRow ? null : rowIndex);

  const row = data[rowIndex];
  if (onSelectInputText) {
    onSelectInputText(isSameRow ? '' : row?.input_text || '');
  }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.accessor}>{col.header}</th>
            ))}
          </tr>
          <tr>
            {columns.map(col => (
              <th key={col.accessor}>
                {filterableAccessors.includes(col.accessor) ? (
                  <input
                    type="text"
                    placeholder={`Filter ${col.header}`}
                    value={filters[col.accessor] || ''}
                    onChange={e => handleFilterChange(col.accessor, e.target.value)}
                    className={styles.filterInput}
                  />
                ) : null}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.slice(0, visibleCount).map((row, rowIndex) => (
 <tr
              key={row.id || rowIndex}
              className={selectedRowIndex === rowIndex ? styles.selectedRow : ''}
              onClick={() => handleRowClick(rowIndex)} // Row click to toggle selection
            >

              {columns.map(col => {
                const cell = row[col.accessor];
                const content = typeof cell === 'string' ? cell : JSON.stringify(cell, null, 2);
                const isTarget = targetHeaders.includes(col.header);

                return (
                  <td
                    key={col.accessor}
                    className={isTarget ? styles.truncateCell : styles.fullCell}
                  >
                    {isTarget ? (
                      <>
                        <span className={styles.truncatedText}>{content}</span>
                        <div className={styles.tooltip}>
                          <pre>{content}</pre>
                          <button
                            className={styles.copyButton}
                            onClick={() => copyToClipboard(content)}
                          >
                            Copy
                          </button>
                        </div>
                      </>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {filteredData.length > visibleCount && (
        <div style={{ textAlign: 'left', marginTop: '1rem' }}>
          <button
            className={styles.analyzeButton}
            onClick={() => setVisibleCount(prev => prev + 50)}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}
