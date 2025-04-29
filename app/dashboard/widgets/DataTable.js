'use client';
import { useMemo, useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import styles from './Charts.module.css';

export default function DataTable({ data, columns, downloadable = false }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [searchTerm, setSearchTerm] = useState('');

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return sortedData;
    return sortedData.filter(row => 
      columns.some(col => 
        String(row[col.id]).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [sortedData, searchTerm, columns]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleDownload = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + columns.map(col => col.label).join(",") + "\n" 
      + filteredData.map(row => 
          columns.map(col => `"${row[col.id]}"`).join(",")
        ).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "data_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        {downloadable && (
          <button onClick={handleDownload} className={styles.downloadButton}>
            <FiDownload size={16} />
            Export
          </button>
        )}
      </div>
      <div className={styles.tableWrapper}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {columns.map(column => (
                <th 
                  key={column.id} 
                  onClick={() => requestSort(column.id)}
                  className={sortConfig.key === column.id ? styles.sorted : ''}
                >
                  {column.label}
                  {sortConfig.key === column.id && (
                    <span>{sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                {columns.map(column => (
                  <td key={column.id}>
                    {column.format ? column.format(row[column.id]) : row[column.id]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filteredData.length === 0 && (
        <div className={styles.noData}>No data available</div>
      )}
    </div>
  );
}