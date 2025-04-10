'use client';
import { useState, useMemo } from 'react';
import { useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { FiDownload } from 'react-icons/fi';
import styles from './../Dashboard.module.css';

export default function DataTab({ data }) {
  const allColumns = [
    'user_id', 'api_key', 'endpoint', 'project_name', 'model_name',
    'headers', 'request_body', 'input_text', 'requested_at',
    'response_status', 'response_body', 'processing_time_ms',
    'responded_at', 'status'
  ];

  const [selectedColumns, setSelectedColumns] = useState([
    'project_name', 'model_name', 'requested_at', 
    'response_status', 'processing_time_ms'
  ]);

 // const tableRef = useRef(null);

const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  const tableRef = useRef(null);

  // Sort the data based on sortConfig
  const sortedData = useMemo(() => {
    let sortableData = [...(data || [])];
    if (sortConfig.key) {
      sortableData.sort((a, b) => {
        // Handle null/undefined values
        if (a[sortConfig.key] == null) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (b[sortConfig.key] == null) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        // Special handling for dates
        if (sortConfig.key.includes('_at')) {
          const dateA = new Date(a[sortConfig.key]);
          const dateB = new Date(b[sortConfig.key]);
          return sortConfig.direction === 'ascending' 
            ? dateA - dateB 
            : dateB - dateA;
        }
        
        // Numeric comparison
        if (typeof a[sortConfig.key] === 'number') {
          return sortConfig.direction === 'ascending' 
            ? a[sortConfig.key] - b[sortConfig.key] 
            : b[sortConfig.key] - a[sortConfig.key];
        }
        
        // String comparison
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  const filteredData = sortedData
    ?.filter(item => item.del_flag === 0)
    ?.map(item => {
      const row = {};
      selectedColumns.forEach(col => {
        if (col === 'requested_at' || col === 'responded_at') {
          row[col] = new Date(item[col]).toLocaleString();
        } else if (col === 'headers' || col === 'request_body' || col === 'response_body') {
          row[col] = typeof item[col] === 'string' ? item[col] : JSON.stringify(item[col], null, 2);
        } else {
          row[col] = item[col];
        }
      });
      return row;
    }) || [];


  

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "API Calls");
    XLSX.writeFile(workbook, "api_calls.xlsx");
  };

  const toggleColumn = (column) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(c => c !== column) 
        : [...prev, column]
    );
  };

  return (
    <div className={styles.dataTab}>
      <div className={styles.dataToolbar}>
        <button onClick={exportToExcel} className={styles.toolbarButton}>
          <FiDownload /> Export to Excel
        </button>
      </div>

      <div className={styles.columnSelector}>
        <span className={styles.columnSelectorLabel}>Select Columns:</span>
        <div className={styles.columnCheckboxList}>
          {allColumns.map(col => (
            <label key={col} className={styles.columnCheckbox}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={() => toggleColumn(col)}
              />
              <span>{col.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Table container with scroll */}
          <div className={styles.tableContainer}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {selectedColumns.map(col => (
                <th 
                  key={col}
                  onClick={() => requestSort(col)}
                  className={`${styles.sortableHeader} ${
                    sortConfig.key === col ? styles.sorted : ''
                  }`}
                >
                  <div className={styles.headerContent}>
                    <span>{col.replace(/_/g, ' ')}</span>
                    <span className={styles.sortIcons}>
                      <span className={`
                        ${styles.sortIcon} 
                        ${sortConfig.key === col && sortConfig.direction === 'ascending' ? styles.active : ''}
                      `}>
                        ↑
                      </span>
                      <span className={`
                        ${styles.sortIcon} 
                        ${sortConfig.key === col && sortConfig.direction === 'descending' ? styles.active : ''}
                      `}>
                        ↓
                      </span>
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>


                   <tbody>
            {filteredData.map((row, i) => (
              <tr key={i}>
                {selectedColumns.map(col => (
                  <td 
                    key={`${i}-${col}`}
                    data-column={col}
                    className={styles.tableCell}
                  >
                    <div className={styles.cellContent}>
                      {row[col]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}


