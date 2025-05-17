'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import styles from './Analysis.module.css';
import EnhancedDataTable from './widgets/AnalysisEnhancedDataTable';
import AnalysisNERBarChart from './widgets/AnalysisNERBarChart';
import AnalysisComboLineChart from './widgets/AnalysisComboLineChart';
import ReactMarkdown from 'react-markdown';
import { FiCopy, FiSave, FiRefreshCw, FiChevronRight  } from 'react-icons/fi';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';



function AnalysisTab() {
  const [dateRange, setDateRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driftData, setDriftData] = useState([]);
  const [nerData, setNerData] = useState([]);
  const [filteredTableData, setFilteredTableData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedNERWord, setSelectedNERWord] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null);
  const [promptText, setPromptText] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [hallucinationResult, setHallucinationResult] = useState(null);
  const [isCheckingHallucination, setIsCheckingHallucination] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const router = useRouter();

  const metrics = [
    { key: 'toxicity', name: 'Toxicity', color: '#ff6b6b', axis: 'y1'},
    { key: 'sw_ratio', name: 'Stopword Ratio', color: '#4ecdc4', axis: 'y1' },
    { key: 'obscene', name: 'Obscene', color: '#ff9f43', axis: 'y1'},
    { key: 'threat', name: 'Threat', color: '#ff4757', axis: 'y1'},
    { key: 'insult', name: 'Insult', color: '#2ed573', axis: 'y1' },
    { key: 'identity_hate', name: 'Identity Hate', color: '#a4b0be', axis: 'y1' },
    { key: 'readability', name: 'Readability', color: '#54a0ff', axis: 'y2' }
  ];

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

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  useEffect(() => {
    const fetchDriftData = async () => {
      try {
        setDriftData([]);
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
        setDriftData([]);
        console.error('Drift fetch error:', err);
        setError(err.message);
      }
    };

    fetchDriftData();
  }, [refreshTrigger]);

  useEffect(() => {
    const fetchNERSummary = async () => {
      try {
        setNerData([]);
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
        setNerData([]);
        console.error('NER summary fetch error:', err);
      }
    };

    fetchNERSummary();
  }, [refreshTrigger]);

  useEffect(() => {
    const fetchFilteredData = async () => {
      try {
        setFilteredTableData([]);
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
        setFilteredTableData([]);
        console.error('Filtered table fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredData();
  }, [activeFilter, selectedDate, selectedNERWord, refreshTrigger]);

  const handleDateClick = useCallback((date) => {
    const newSelectedDate = selectedDate === date ? null : date;
    setSelectedDate(newSelectedDate);
    
    if (activeFilter === 'date' && selectedDate === date) {
      setActiveFilter(null);
    } else {
      setActiveFilter('date');
      setSelectedNERWord(null);
    }
  }, [selectedDate, activeFilter]);

  const handleNERWordClick = useCallback((word) => {
    if (activeFilter === 'ner' && selectedNERWord === word) {
      setActiveFilter(null);
      setSelectedNERWord(null);
    } else {
      setActiveFilter('ner');
      setSelectedNERWord(word);
      setSelectedDate(null);
    }
  }, [activeFilter, selectedNERWord]);

const handleRowSelect = (row) => {
  // Clear everything if no row or same row is clicked
  if (!row || (selectedRow && selectedRow.id === row.id)) {
    setSelectedRow(null);
    setPromptText('');
    return;
  }

  // Set the new selected row
  setSelectedRow(row);
  
  // Clear previous text
  setPromptText('');

  // If the selected row is a response, try to find its matching prompt
  if (row.text_type === 'response') {
    const matchingPrompt = filteredTableData.find(
      item => item.session_id === row.session_id && 
              item.session_dialog_id === row.session_dialog_id && 
              item.text_type === 'prompt' &&
              new Date(item.requested_at) < new Date(row.requested_at)
    );
    if (matchingPrompt) {
      setPromptText(matchingPrompt.input_text);
    }
  }
};

  const handleHallucinationCheck = async () => {
    if (!selectedRow) {
      setError('Please select a prompt or response from the table');
      return;
    }

    let prompt, response;
    if (selectedRow.text_type === 'prompt') {
      prompt = selectedRow.input_text;
      response = promptText;
    } else {
      prompt = promptText;
      response = selectedRow.input_text;
    }

    if (!prompt || !response) {
      setError('Both prompt and response are required');
      return;
    }

    try {
      setIsCheckingHallucination(true);
      setError(null);

      const API_URL = process.env.NODE_ENV === 'development' 
        ? 'http://localhost:8000/api/v1/hallucination' 
:`${window.location.origin}/api/v1/hallucination`   ;   
// : '/api/v1/hallucination';

      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        "X-Internal-Token": process.env.NEXT_PUBLIC_INTERNAL_TOKEN
        },
        body: JSON.stringify({ prompt, response })
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        if (text.startsWith('<!DOCTYPE html>')) {
          throw new Error('Server returned HTML error page');
        }
        throw new Error(text || 'Invalid response format');
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Analysis failed');

      setHallucinationResult(result);
    } catch (err) {
      setError(`Analysis error: ${err.message}`);
      console.error('Hallucination check failed:', err);
    } finally {
      setIsCheckingHallucination(false);
    }
  };

const handleViewFlow = () => {
  if (!selectedRow) {
    setError('Please select a row to view its flow');
    return;
  }

  // Force full page navigation with all parameters
  window.location.href = `/dashboard?tab=flow&project=${encodeURIComponent(selectedRow.project_name)}&session=${encodeURIComponent(selectedRow.session_id)}`;
};



  const handleCopyResult = () => {
    if (hallucinationResult) {
      const textToCopy = hallucinationResult.success 
        ? hallucinationResult.analysis 
        : `Error: ${hallucinationResult.error}`;
      navigator.clipboard.writeText(textToCopy).then(() => {
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
      });
    }
  };

  const handleSaveResult = async () => {
    if (!hallucinationResult || !selectedRow || !promptText) {
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
          prompt: selectedRow.text_type === 'prompt' ? selectedRow.input_text : promptText,
          response: selectedRow.text_type === 'response' ? selectedRow.input_text : promptText,
          analysis: hallucinationResult.analysis,
          metadata: {
            model: selectedRow.model_name || 'unknown',
            date: new Date().toISOString()
          }
        });

      if (error) throw error;
      
      const notice = document.createElement('div');
      notice.textContent = '✓ Saved!';
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
    } catch (err) {
      setError(`Failed to save: ${err.message}`);
      console.error('Save error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.tabContent}>
      <div className={styles.filters}>
        <select 
          value={dateRange} 
          onChange={(e) => setDateRange(e.target.value)} 
          className={styles.filterSelect}
        >
          <option value="3d">Last 3 days</option>
          <option value="7d">Last 7 days</option>
          <option value="15d">Last 15 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
        
        <button 
          onClick={handleRefresh}
          className={styles.refreshButton}
          title="Refresh data"
        >
          <FiRefreshCw size={16} className={loading ? styles.refreshing : ''} />
        </button>
      </div>

      <div className={styles.chartRow}>
        <h4>Text Drift Metrics</h4>
        <h5>Day Vs Drifts & Readability</h5>
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
 <br/>
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
      <div className={styles.statsRow}>
        <div className={styles.fullWidthChart}>
          <h4>Request Explorer</h4>
          {loading ? (
            <div className={styles.loading}>Loading request data...</div>
          ) : filteredTableData.length > 0 ? (
            <EnhancedDataTable
              data={filteredTableData.slice(0, 100).map((item, index) => ({
                sequence: index + 1,
                ...item
              }))}
              columns={[
                { header: '#no', accessor: 'sequence', width: 60, align: 'center' },
                { header: 'ID', accessor: 'id' },
                { header: 'User ID', accessor: 'user_id' },
                { header: 'Request at', accessor: 'requested_at' },
                { header: 'Respond at', accessor: 'responded_at' },
                { header: 'Type', accessor: 'text_type' },
                { header: 'Chat ID', accessor: 'session_id'},
                { header: 'Chat Dialog ID', accessor: 'session_dialog_id' },
                { header: 'Chat Dialog TS', accessor: 'session_dialog_dt' },
                { header: 'Project', accessor: 'project_name' },
                { header: 'Model', accessor: 'model_name' },
                { header: 'Header', accessor: 'headers' },
                { header: 'Request Body', accessor: 'request_body' },
                { header: 'Text', accessor: 'input_text', truncate: true },
                { header: 'Response Body', accessor: 'response_body' }
              ]}
              onSelectInputText={handleRowSelect}
              selectedRowId={selectedRow?.id}
            />
          ) : (
            <div className={styles.emptyState}>
              No Data found for selected filters
            </div>
          )}
        </div>
      </div>
 <br/>
      <div className={styles.statsRow}>
        <div className={styles.fullWidthChart}>
          <h4>Hallucination Check</h4>
          
  <div className={styles.promptResponseContainer}>
  <div className={styles.promptResponseItem}>
    <h5>Prompt</h5>
    {selectedRow?.text_type === 'prompt' ? (
      <div className={styles.textContent}>
        {selectedRow.input_text}
      </div>
    ) : (
      <textarea
        className={styles.hallucinationTextArea}
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder={selectedRow?.text_type === 'response' ? "Enter the model's paring prompt" : "Select a prompt"}
        rows={5}
      />
    )}
  </div>

  <div className={styles.promptResponseArrow}>
    <FiChevronRight size={48} color="#4CAF50" />
  </div>

  <div className={styles.promptResponseItem}>
    <h5>Response</h5>
    {selectedRow?.text_type === 'response' ? (
      <div className={styles.textContent}>
        {selectedRow.input_text}
      </div>
    ) : (
      <textarea
        className={styles.hallucinationTextArea}
        value={selectedRow?.text_type === 'prompt' ? promptText : ''}
        onChange={(e) => setPromptText(e.target.value)}
        placeholder={selectedRow?.text_type === 'prompt' ? "Enter the model's paring response" : "Select a response"}
        rows={5}
      />
    )}
  </div>
</div>


          </div>
<br/>

          <button
            className={styles.analyzeButton}
            onClick={handleHallucinationCheck}
            disabled={
              !selectedRow || 
              !promptText.trim() || 
              isCheckingHallucination
            }
          >
            {isCheckingHallucination ? 'Checking...' : 'Check for Hallucinations'}
          </button>

          <button
              className={styles.viewFlowButton}
              onClick={handleViewFlow}
              disabled={!selectedRow}
            >
              View Flow
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
      {/* 🔥 put error handling here, inside this <div> */}
    {error && <div className={styles.error}>{error}</div>}
  

   
    </div>
  );
}

export default AnalysisTab;