'use client';
import { useState, useEffect, Suspense } from 'react';
import { supabase } from '../lib/supabase/client';
import styles from './Dashboard.module.css';
import { HiHome, HiTrendingUp, HiExclamationCircle,HiChat } from 'react-icons/hi';
import { HiCog, HiDatabase, HiLightningBolt, HiSquare } from 'react-icons/hi';

import AnalysisTab from './AnalysisTab';
import OperationsTab from './OperationsTab';
//import FlowTab from './FlowTab';

//import FlowTabWithSuspense  from './FlowTab';
import DonutChart from './widgets/DonutChart';
import LineChart from './widgets/LineChart';

import { useSearchParams } from 'next/navigation';

import dynamic from 'next/dynamic';

const FlowTab = dynamic(() => import('./FlowTab'), {
  ssr: false,
  loading: () => <div className={styles.loading}>Loading Flow...</div>
});



// Move HomeTab component definition to the top level
function HomeTab({ homeData, loading }) {
  return (
    <div className={styles.tabContent}>
      <div className={styles.statsRow}>
        <div className={styles.chartContainer}>
          <h4 className={styles.chartTitle}>Total API Calls by Projects</h4>
         <DonutChart 
  data={(homeData.projectStats || []).map(p => ({
    name: p.project_name,
    value: p.total_calls
  }))}
  width={300}
  height={300}
/>
        </div>
        
        <div className={styles.chartContainer}>
          <h4 className={styles.chartTitle}>Total API Calls by Models</h4>
          <DonutChart 
            data={(homeData.modelStats || []).map(m => ({
              name: m.model_name,
              value: m.total_calls
            }))}
            width={300}
            height={300}
          />
        </div>
        
        <div className={styles.chartContainer}>
          <h4 className={styles.chartTitle}>API Call Completion Status</h4>
          <DonutChart 
            data={[
              { name: 'Completed', value: homeData.completionStats?.completed || 0 },
              { name: 'Not Completed', value: homeData.completionStats?.nonCompleted || 0 }
            ]}
            width={300}
            height={300}
          />
        </div>
      </div>
      
      <div className={styles.statsRow}>
        <div className={styles.fullWidthChart}>
          <h4>Daily API Calls (Last 30 Days)</h4>
         <LineChart
  data={(homeData.dailyCalls || []).map(d => ({
    date: d.date,  // fixed, use d.date not d.day
    value: d.value,
    text_type: d.text_type  // keep text_type!
  }))}
  height={280}
/>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
 // const searchParams = useSearchParams();
 // const [activeTab, setActiveTab] = useState('home');
  const [activeTab, setActiveTab] = useState('home');

{/*  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam.toLowerCase());
    }
  }, [searchParams]); */}

//parse url
 useEffect(() => {
    // Client-side URL parsing
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab') || 'home';
      setActiveTab(tab);
      
      // Clean up URL
      if (params.has('_rsc') || params.has('ts')) {
        params.delete('_rsc');
        params.delete('ts');
        window.history.replaceState({}, '', `?${params.toString()}`);
      }
    }
  }, []);

 // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams();
    newParams.set('tab', tab);
    
    // Preserve existing params (like project/session for flow tab)
    Object.entries(urlParams).forEach(([key, value]) => {
      if (key !== 'tab' && key !== '_rsc' && key !== 'ts') {
        newParams.set(key, value);
      }
    });

    window.history.pushState({}, '', `?${newParams.toString()}`);
  };



// Persist tab changes
useEffect(() => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('activeTab', activeTab);
  }
}, [activeTab]);


  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [homeData, setHomeData] = useState({
    projectStats: [],
    modelStats: [],
    completionStats: { completed: 0, nonCompleted: 0 },
    dailyCalls: []
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) throw new Error('No authenticated user');

        if (activeTab === 'home') await fetchHomeData();
      } catch (err) {
        console.error('Data fetch error:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab]);

 // In your fetchHomeData function:
const fetchHomeData = async () => {
  try {
    const [
      { data: projectStats = [] },
      { data: modelStats = [] },
      { data: dailyCalls = [] }
    ] = await Promise.all([
      supabase.from('v_project_stats').select('*'),
      supabase.from('v_model_stats').select('*'),
      supabase.from('v_daily_calls').select('*')
    ]);

// First: group by 'day'
const dayTotals = {};

dailyCalls.forEach(d => {
  if (!dayTotals[d.day]) {
    dayTotals[d.day] = { completed: 0, nonCompleted: 0 };
  }
  dayTotals[d.day].completed += d.completed_calls || 0;
  dayTotals[d.day].nonCompleted += d.non_completed_calls || 0;
});

// Now sum the day's totals
const totalCompleted = Object.values(dayTotals).reduce((sum, day) => sum + day.completed, 0);
const totalNonCompleted = Object.values(dayTotals).reduce((sum, day) => sum + day.nonCompleted, 0);


    // Transform dailyCalls to match the expected format
    const transformedDailyCalls = dailyCalls.map(d => ({
      date: d.day,
      value: d.total_calls,
      completed: d.completed_calls,
      nonCompleted: d.non_completed_calls,
      text_type: d.text_type || 'default' // Ensure text_type has a value
    }));

   // const totalCompleted = dailyCalls.reduce((sum, day) => sum + (day.completed_calls || 0), 0);
    //const totalNonCompleted = dailyCalls.reduce((sum, day) => sum + (day.non_completed_calls || 0), 0);

    setHomeData({
      projectStats,
      modelStats,
      completionStats: {
        completed: totalCompleted,
        nonCompleted: totalNonCompleted
      },
      dailyCalls: transformedDailyCalls
    });
  } catch (err) {
    console.error('Home data error:', err);
    setHomeData({
      projectStats: [],
      modelStats: [],
      completionStats: { completed: 0, nonCompleted: 0 },
      dailyCalls: []
    });
  }
};

  return (
    <div className={styles.dashboard}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>GRC Dashboard</h3>
        </div>
        
        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.sidebarItem} ${activeTab === 'home' ? styles.active : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <HiHome className={styles.sidebarIcon} />
            <span>Home</span>
          </button>
          
          <button
            className={`${styles.sidebarItem} ${activeTab === 'analysis' ? styles.active : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <HiTrendingUp className={styles.sidebarIcon} />
            <span>Analysis</span>
          </button>
          
       

         <button
  className={`${styles.sidebarItem} ${activeTab === 'flow' ? styles.active : ''}`}
  onClick={() => setActiveTab('flow')}
>
  <HiChat className={styles.sidebarIcon} /> {/* New icon */}
  <span>Flow</span>
</button>

   <button
            className={`${styles.sidebarItem} ${activeTab === 'risk' ? styles.active : ''}`}
            onClick={() => setActiveTab('risk')}
          >
            <HiExclamationCircle className={styles.sidebarIcon} />
            <span>Risk Monitoring</span>
          </button>


<button
  className={`${styles.sidebarItem} ${activeTab === 'operations' ? styles.active : ''}`}
  onClick={() => setActiveTab('operations')}
>
  <HiCog className={styles.sidebarIcon} />
  <span>Operations</span>
</button>

        </nav>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <>
            {activeTab === 'home' && <HomeTab homeData={homeData} loading={loading} />}
            {activeTab === 'analysis' && <AnalysisTab />}
           
           {activeTab === 'flow' && (
              <Suspense fallback={<div className={styles.loading}>Loading Flow...</div>}>
                <FlowTab />
              </Suspense>
            )}
 {activeTab === 'risk' && <div className={styles.tabContent}>Risk Monitoring (Coming Soon)</div>}
{activeTab === 'operations' && <OperationsTab />}
          </>
        )}
      </div>
    </div>
  );
}