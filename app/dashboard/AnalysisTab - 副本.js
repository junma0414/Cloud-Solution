'use client';
import { useState, useEffect,useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import styles from './Analysis.module.css';
import EnhancedDataTable from './widgets/AnalysisEnhancedDataTable';
import AnalysisNERBarChart from './widgets/AnalysisNERBarChart';
import AnalysisComboLineChart from './widgets/AnalysisComboLineChart';
//import ReactMarkdown from 'react-markdown';
//import remarkGfm from 'remark-gfm';

import ReactMarkdown from 'react-markdown';

import { FiCopy, FiSave } from 'react-icons/fi';



function AnalysisTab() {
  const [dateRange, setDateRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driftData, setDriftData] = useState([]);
  const [nerData, setNerData] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNERWord, setSelectedNERWord] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [showExplainabilityDialog, setShowExplainabilityDialog] = useState(false);
  const [explainabilityData, setExplainabilityData] = useState(null);

const [selectedInputText, setSelectedInputText] = useState('');
  const [hallucinationResult, setHallucinationResult] = useState(null);
  const [isCheckingHallucination, setIsCheckingHallucination] = useState(false);

//const [selectedNERWord, setSelectedNERWord] = useState(null);



//const [selectedDate, setSelectedDate] = useState(null); // Add this state


  const metrics = [
    { key: 'toxicity', name: 'Toxicity', color: '#ff6b6b', axis: 'y1'},
    { key: 'sw_ratio', name: 'Stopword Ratio', color: '#4ecdc4', axis: 'y1' },
    { key: 'obscene', name: 'Obscene', color: '#ff9f43', axis: 'y1'},
    { key: 'threat', name: 'Threat', color: '#ff4757', axis: 'y1'},
    { key: 'insult', name: 'Insult', color: '#2ed573', axis: 'y1' },
    { key: 'identity_hate', name: 'Identity Hate', color: '#a4b0be', axis: 'y1' },
    { key: 'readability', name: 'Readability', color: '#54a0ff', axis: 'y2' }
  ];

const [selectedChart, setSelectedChart] = useState(null);

// Add these handlers
const handleChartClick = (chartName) => {
  setSelectedChart(selectedChart === chartName ? null : chartName);
};

// Add this utility function
const getChartClass = (chartName) => {
  return `${styles.chartContainer} ${selectedChart === chartName ? styles.selectedChart : ''}`;
};

  const getFromDate = () => {
    const fromDate = new Date();
    fromDate.setUTCHours(0, 0, 0, 0);
    switch (dateRange) {
      case '3d': fromDate.setDate(fromDate.getDate() - 2); break;
      case '7d': fromDate.setDate(fromDate.getDate() - 6); break;
      case '15d': fromDate.setDate(fromDate.getDate() - 14); break;
      case '30d': fromDate.setDate(fromDate.getDate() - 29); break;
      case '90d': fromDate.setDate(fromDate.getDate() - 89); break;
      default: fromDate.setDate(fromDate.getDate() - 7);
    }
    return fromDate;
  };
  
useEffect(() => {
  // Clear ALL cached data when filters change
  setDriftData([]);
  setNerData([]);
  setFilteredTableData([]);
  setSelectedDate(null);
  setSelectedNERWord(null);
  setActiveFilter(null);
  setHallucinationResult(null); // Also clear hallucination results
  setSelectedInputText(''); // Clear selected text
  setPromptText(''); // Clear prompt text
  
  // Error state should also be reset
  setError(null);
}, [dateRange]); 


  useEffect(() => {
    const fetchDriftData = async () => {
      try {
      setDriftData([]);  //clear cache
        const fromDate = getFromDate();
        const { data, error } = await supabase
          .from('v_dashboard_drift')
          .select('*')
          .gte('requested_at', fromDate.toISOString())
          .order('requested_at', { ascending: true });

        if (error) throw error;

        const processedData = data.reduce((acc, item) => {
          const date = new Date(item.requested_at).toISOString().split('T')[0];
          const existing = acc.find(d => d.date === date);
          if (existing) {
            metrics.forEach(metric => {
              existing[metric.key].push(parseFloat(item[metric.key]) || 0);
            });
          } else {
        
            const newEntry = { date };
            metrics.forEach(metric => {
              newEntry[metric.key] = [parseFloat(item[metric.key]) || 0];
            });
            acc.push(newEntry);
          }
          return acc;
        }, []).map(day => {
          const averagedDay = { date: day.date };
          metrics.forEach(metric => {
            averagedDay[metric.key] = day[metric.key].reduce((a, b) => a + b, 0) / day[metric.key].length;
          });
          return averagedDay;
        });

        setDriftData(processedData);
      } catch (err) {
       setDriftData([]); // Clear on error
        console.error('Drift fetch error:', err);
        setError(err.message);
      }
    };

    fetchDriftData();
  }, [dateRange]);

  useEffect(() => {
    const fetchNERSummary = async () => {
      try {
 setNerData([]); // Clear before fetching
        const fromDate = getFromDate();
        const { data, error } = await supabase
          .from('v_dashboard_ner')
          .select('word, count, entity_group')
          .gte('requested_at', fromDate.toISOString());

        if (error) throw error;

        const wordMap = {};
        for (const row of data) {
          if (!row.word) continue;
          if (!wordMap[row.word]) {
            wordMap[row.word] = { word: row.word, count: 0, entity_group: row.entity_group };
          }
          wordMap[row.word].count += parseFloat(row.count);
        }

        setNerData(Object.values(wordMap));
      } catch (err) {
 setNerData([]); // Clear before fetching
        console.error('NER summary fetch error:', err);
      }
    };

    fetchNERSummary();
  }, [dateRange]);

  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
setFilteredTableData([]); // Clear before fetching
        const fromDate = getFromDate();
        setLoading(true);

        if (activeFilter === 'ner' && selectedNERWord) {
          const { data: nerMatches, error: nerError } = await supabase
            .from('v_dashboard_ner')
            .select('id')
            .eq('word', selectedNERWord)
            .gte('requested_at', fromDate.toISOString());

          if (nerError) throw nerError;
          const requestIds = [...new Set(nerMatches.map(row => row.id))];

          if (requestIds.length === 0) {
            setFilteredTableData([]);
            return;
          }

          const { data, error } = await supabase
            .from('grc_service')
            .select('*')
            .eq('del_flag', 0)
            .in('id', requestIds);

          if (error) throw error;
          setFilteredTableData(data);

        } else if (activeFilter === 'date' && selectedDate) {

	const startOfDay = new Date(selectedDate);
	startOfDay.setUTCHours(0, 0, 0, 0);
	const endOfDay = new Date(selectedDate);
	endOfDay.setUTCHours(23, 59, 59, 999);
       
   const { data, error } = await supabase
            .from('grc_service')
            .select('*')
            .eq('del_flag', 0)
	.gte('requested_at', startOfDay.toISOString())
  	.lte('requested_at', endOfDay.toISOString());

//            .gte('requested_at', fromDate.toISOString())
  //          .like('requested_at', `${selectedDate}%`);

          if (error) throw error;
          setFilteredTableData(data);

        } else {
          const { data, error } = await supabase
            .from('grc_service')
            .select('*')
            .eq('del_flag', 0)
            .gte('requested_at', fromDate.toISOString());

          if (error) throw error;
          setFilteredTableData(data);
        }
      } catch (err) {
setFilteredTableData([]); // Clear before fetching
        console.error('Filtered table fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [activeFilter, selectedDate, selectedNERWord, dateRange]);

 // ✅ Full implementation of filter toggle and reset logic

 const handleDateClick = useCallback((date) => {
    const newSelectedDate = selectedDate === date ? null : date;
    setSelectedDate(newSelectedDate);
    
    if (activeFilter === 'date' && selectedDate === date) {
      setActiveFilter(null);
    } else {
      setActiveFilter('date');
      setSelectedNERWord(null);
    }
    
    console.log('Date clicked:', date);
  }, [selectedDate, activeFilter]); // Add dependencies here


const handleNERWordClick = useCallback((word) => {
  // Toggle off if same NER word clicked again
  if (activeFilter === 'ner' && selectedNERWord === word) {
    setActiveFilter(null);
    setSelectedNERWord(null);
  } else {
    setActiveFilter('ner');
    setSelectedNERWord(word);
    setSelectedDate(null);
  }
}, [activeFilter, selectedNERWord]); // Add dependencies here


const handleHallucinationCheck = async () => {
  if (!selectedInputText || !promptText.trim()) {
    setError('Please select an input text and provide a response');
    return;
  }

  try {
    setIsCheckingHallucination(true);
    setError(null);

const API_URL = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:8000/api/v1/hallucination' 
      : '/api/v1/hallucination';    

    const response = await fetch(API_URL , {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        prompt: promptText,
        response: selectedInputText
      })
    });

    // Check for HTML error responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      if (text.startsWith('<!DOCTYPE html>')) {
        throw new Error('Server returned HTML error page');
      }
      throw new Error(text || 'Invalid response format');
    }

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Analysis failed');
    }

    setHallucinationResult(result);
    setShowExplainabilityDialog(true);
  } catch (err) {
    setError(`Analysis error: ${err.message}`);
    console.error('Hallucination check failed:', err);
  } finally {
    setIsCheckingHallucination(false);
  }
};

function showAction(text) {
  const notice = document.createElement('div');
  notice.textContent = text;
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
//navigator.clipboard.writeText(text).then(() => showAction('✓ Copied!'));

const handleCopyResult = () => {
    if (hallucinationResult) {
      const textToCopy = hallucinationResult.success 
        ? hallucinationResult.analysis 
        : `Error: ${hallucinationResult.error}`;
      navigator.clipboard.writeText(textToCopy).then(() =>  showAction('✓ Copied!'));
      // You might want to add a toast notification here
     // alert('Copied to clipboard!');
    }
  };

  const handleSaveResult = async () => {
    if (!hallucinationResult || !selectedInputText || !promptText) {
      setError('No result to save');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('saved_hallucination_checks')
        .insert({
          user_id: user?.id,
          prompt: promptText,
          response: selectedInputText,
          analysis: hallucinationResult.analysis,
          metadata: {
            model: filteredTableData.find(item => item.input_text === selectedInputText)?.model_name || 'unknown',
            date: new Date().toISOString()
          }
        });

      if (error) throw error;
showAction('✓ Saved!');
      //alert('Analysis saved successfully!');
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };



// HTML


  return (
    <div className={styles.tabContent}>
      <div className={styles.filters}>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className={styles.filterSelect}>
          <option value="3d">Last 3 days</option>
          <option value="7d">Last 7 days</option>
          <option value="15d">Last 15 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Drift Metrics Chart - Updated */}
      <div className={styles.chartRow}>
        <h4>Text Drift Metrics</h4>
        <h5>Day Vs Drifts & Readability</h5>
 <div className={getChartClass('drift')} onClick={() => handleChartClick('drift')}>
        <div className={styles.fullWidthChartContainer} style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '900px' }}>
            {loading ? (
              <div className={styles.loading}>Loading drift data...</div>
            ) : driftData.length > 0 ? (
              <AnalysisComboLineChart
                key={`chart-${dateRange}`}
                data={driftData}
                metrics={metrics.map(metric =>
                  metric.key === 'readability' ? { ...metric, chartType: 'bar' } : metric
                )}
                axisTitles={{ y1: 'Drift(0-1)', y2: 'Readability' }}
                onDateClick={handleDateClick}
                selectedDate={selectedDate}
	setSelectedDate={setSelectedDate}
                height={320}
              />
            ) : (
              <div className={styles.emptyState}>
                No data available for selected period
              </div>
            )}
          </div>
        </div>
      </div>
</div>


      {/* NER Chart - Updated */}
      <div className={styles.chartRow}>
        <h4>NER Entity Frequency</h4>
        <div className={styles.fullWidthChartContainer}>
          {loading ? (
            <div className={styles.loading}>Loading NER data...</div>
          ) : nerData.length > 0 ? (
            <AnalysisNERBarChart
               data={nerData}
  height={300}
  onBarClick={handleNERWordClick}
  selectedWord={selectedNERWord} 
            />
          ) : (
            <div className={styles.emptyState}>
              No data available for selected period
            </div>
          )}
        </div>
      </div>


      <br/>

      {/* Request Explorer - Updated */}
     
         <div className={styles.statsRow}>
        <div className={styles.fullWidthChart}>
          <h4>Request Explorer</h4>
          {loading ? (
            <div className={styles.loading}>Loading request data...</div>
          ) : filteredTableData.length > 0 ? (
                 <EnhancedDataTable
        data={filteredTableData.slice(0, 100).map((item, index) => ({
          // Add sequence number as the first property
          sequence: index + 1,
          ...item
        }))}
        columns={[
          { 
            header: '#no', 
            accessor: 'sequence',
            width: 60, // Optional: set fixed width for sequence column
            align: 'center' // Optional: center align the numbers
          },
          { header: 'ID', accessor: 'id' },
          { header: 'User ID', accessor: 'user_id' },
          { header: 'Request at', accessor: 'requested_at' },
          { header: 'Respond at', accessor: 'responded_at' },
          { header: 'Project', accessor: 'project_name' },
          { header: 'Model', accessor: 'model_name' },
          { header: 'Header', accessor: 'headers' },
          { header: 'Request Body', accessor: 'request_body' },
          { header: 'Text', accessor: 'input_text', truncate: true },
          { header: 'Response Body', accessor: 'response_body' }
        ]}
        onSelectInputText={(inputText) => {
          console.log('Selected Input Text:', inputText);
          setSelectedInputText(inputText);
          setPromptText('');
          setHallucinationResult(null);
        }}
      />
    ) : (
      <div className={styles.emptyState}>
        No Data found for selected filters
      </div>

          )}
       </div>
</div>


<br/>
      {/* Hallucination Check Section - Updated */}
      <div className={styles.statsRow}>
        <div className={styles.fullWidthChart}>
          <h4>Hallucination Check</h4>
          
          {selectedInputText && (
            <div className={styles.textSection}>
              <h5>Model Response:</h5>
              <div className={styles.textContent}>
                {selectedInputText}
              </div>
            </div>
          )}

          <div className={styles.textSection}>
            <h5>Model Prompt:</h5>
            <textarea
              className={styles.hallucinationTextArea}
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Paste the model's prompt here..."
              rows={5}
            />
          </div>
          
          <button
            className={styles.analyzeButton}
            onClick={handleHallucinationCheck}
            disabled={!selectedInputText || !promptText.trim() || isCheckingHallucination}
          >
            {isCheckingHallucination ? 'Checking...' : 'Check for Hallucinations'}
          </button>

        {hallucinationResult && (
    <div className={styles.resultsSection}>
      <div className={styles.resultsHeader}>
        <h4>Hallucination Benchmark:</h4>
        <div className={styles.resultActions}>
          <button 
            onClick={handleCopyResult}
            className={styles.iconButton}
            title="Copy results"
          >
            <FiCopy />
          </button>
          <button 
            onClick={handleSaveResult}
            className={styles.iconButton}
            title="Save analysis"
            disabled={loading}
          >
            <FiSave />
          </button>
        </div>
      </div>
      <div className={styles.markdownResult}>
        <ReactMarkdown>
          {hallucinationResult.success 
            ? hallucinationResult.analysis 
            : `**Error:** ${hallucinationResult.error}`}
        </ReactMarkdown>
      </div>
    </div>
  )}
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}

export default AnalysisTab;

