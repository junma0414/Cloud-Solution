'use client';
import { useState, useEffect, useRef,useMemo } from 'react';
import { supabase } from '../lib/supabase/client';
import styles from './Dashboard.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';


import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { FiDownload, FiColumns } from 'react-icons/fi';



import DailyColumnChart from './widgets/DailyColumnChart';
import ProcessingTimeChart from './widgets/ProcessingTimeChart';

// At the top with other imports
import GaugeTab from './widgets/GaugeTab';
import DataTab from './widgets/DataTab';



export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [apiData, setApiData] = useState([]);
  const [filters, setFilters] = useState({
    project: '',
    model: '',
    dateRange: '7d'
  });
  const pathname = usePathname();

  // Fetch data based on active tab
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      let query = supabase
        .from('grc_service')
        .select('*')
        .eq('user_id', user.id)
        .eq('del_flag', 0);

      // Apply filters
      if (filters.project) query = query.eq('project_name', filters.project);
      if (filters.model) query = query.eq('model_name', filters.model);
      
      // Date range filter
      const now = new Date();
      let fromDate = new Date();
      
      switch (filters.dateRange) {
        case '24h': fromDate.setDate(now.getDate() - 1); break;
        case '7d': fromDate.setDate(now.getDate() - 7); break;
        case '30d': fromDate.setDate(now.getDate() - 30); break;
        default: fromDate = new Date(0); // All time
      }

      query = query.gte('requested_at', fromDate.toISOString());

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching data:', error);
      } else {
        setApiData(data || []);
        
        // Calculate stats
        if (activeTab === 'home') {
          const stats = {
            totalCalls: data.length,
            avgResponseTime: data.reduce((acc, curr) => acc + (curr.processing_time_ms || 0), 0) / (data.length || 1),
            successRate: (data.filter(d => d.response_status >= 200 && d.response_status < 300).length / (data.length || 1))* 100,
            projects: [...new Set(data.map(d => d.project_name))],
            models: [...new Set(data.map(d => d.model_name))]
          };
          setStats(stats);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [activeTab, filters]);

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Dashboard</h3>
        </div>
        
        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.sidebarItem} ${activeTab === 'home' ? styles.active : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <svg className={styles.sidebarIcon} viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            <span>Overview</span>
          </button>
          
          <button
            className={`${styles.sidebarItem} ${activeTab === 'gauge' ? styles.active : ''}`}
            onClick={() => setActiveTab('gauge')}
          >
            <svg className={styles.sidebarIcon} viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z" />
            </svg>
            <span>Analytics</span>
          </button>
          
          <button
            className={`${styles.sidebarItem} ${activeTab === 'data' ? styles.active : ''}`}
            onClick={() => setActiveTab('data')}
          >
            <svg className={styles.sidebarIcon} viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
            </svg>
            <span>Data Explorer</span>
          </button>
          
          <button
            className={`${styles.sidebarItem} ${activeTab === 'alert' ? styles.active : ''}`}
            onClick={() => setActiveTab('alert')}
          >
            <svg className={styles.sidebarIcon} viewBox="0 0 24 24">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
            </svg>
            <span>Alerts</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Filters */}
        <div className={styles.filters}>
          <select
            value={filters.project}
            onChange={(e) => setFilters({...filters, project: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">All Projects</option>
            {stats?.projects?.map(project => (
              <option key={project} value={project}>{project}</option>
            ))}
          </select>
          
          <select
            value={filters.model}
            onChange={(e) => setFilters({...filters, model: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">All Models</option>
            {stats?.models?.map(model => (
              <option key={model} value={model}>{model}</option>
            ))}
          </select>
          
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="all">All time</option>
          </select>
        </div>

        {/* Content based on active tab */}
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            {activeTab === 'home' && <HomeTab stats={stats} data={apiData} />}
            {activeTab === 'gauge' && <GaugeTab/>}
            {activeTab === 'data' && <DataTab data={apiData} />}
            {activeTab === 'alert' && <AlertTab />}
          </>
        )}
      </div>
    </div>
  );
}

// Tab components
function HomeTab({ stats, data }) {
  return (
    <div className={styles.tabContent}>
      <h2>API Usage Overview</h2>
      
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <h3>Total Calls</h3>
          <p>{stats?.totalCalls || 0}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Avg Response Time</h3>
          <p>{stats?.avgResponseTime ? stats.avgResponseTime.toFixed(2) + 'ms' : 'N/A'}</p>
        </div>
        <div className={styles.statCard}>
          <h3>Success Rate</h3>
          <p>{stats?.successRate ? stats.successRate.toFixed(2) + '%' : 'N/A'}</p>
        </div>
      </div>
      
      {/* Simple chart placeholder - you can replace with a real chart library */}
 <div className={styles.chartsContainer}>
        <DailyColumnChart data={data} />
        <ProcessingTimeChart data={data} />
      </div>
    </div>
  );
}




//export { DataTab };


function AlertTab() {
  const [alerts, setAlerts] = useState([]);
  const [newAlert, setNewAlert] = useState({
    metric: 'response_status',
    condition: '>',
    value: '400',
    email: true
  });

  // Load saved alerts
  useEffect(() => {
    // This would load from Supabase
    const savedAlerts = JSON.parse(localStorage.getItem('apiAlerts') || '[]');
    setAlerts(savedAlerts);
  }, []);

  const saveAlert = () => {
    const updatedAlerts = [...alerts, newAlert];
    setAlerts(updatedAlerts);
    localStorage.setItem('apiAlerts', JSON.stringify(updatedAlerts));
    setNewAlert({
      metric: 'response_status',
      condition: '>',
      value: '400',
      email: true
    });
  };

  return (
    <div className={styles.tabContent}>
      <h2>Alert Settings</h2>
      
      <div className={styles.alertForm}>
        <select
          value={newAlert.metric}
          onChange={(e) => setNewAlert({...newAlert, metric: e.target.value})}
          className={styles.alertInput}
        >
          <option value="response_status">Response Status</option>
          <option value="processing_time_ms">Processing Time (ms)</option>
        </select>
        
        <select
          value={newAlert.condition}
          onChange={(e) => setNewAlert({...newAlert, condition: e.target.value})}
          className={styles.alertInput}
        >
          <option value=">">Greater Than</option>
          <option value="<">Less Than</option>
          <option value="==">Equals</option>
        </select>
        
        <input
          type="text"
          value={newAlert.value}
          onChange={(e) => setNewAlert({...newAlert, value: e.target.value})}
          className={styles.alertInput}
          placeholder="Value"
        />
        
        <label className={styles.alertCheckbox}>
          <input
            type="checkbox"
            checked={newAlert.email}
            onChange={(e) => setNewAlert({...newAlert, email: e.target.checked})}
          />
          Send Email Alert
        </label>
        
        <button onClick={saveAlert} className={styles.alertButton}>
          Add Alert
        </button>
      </div>
      
      <div className={styles.alertList}>
        <h3>Active Alerts</h3>
        {alerts.length === 0 ? (
          <p>No alerts configured</p>
        ) : (
          <ul>
            {alerts.map((alert, i) => (
              <li key={i} className={styles.alertItem}>
                {`If ${alert.metric} ${alert.condition} ${alert.value}, notify me via ${alert.email ? 'email' : 'dashboard'}`}
                <button 
                  onClick={() => {
                    const updated = alerts.filter((_, idx) => idx !== i);
                    setAlerts(updated);
                    localStorage.setItem('apiAlerts', JSON.stringify(updated));
                  }}
                  className={styles.alertDelete}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}