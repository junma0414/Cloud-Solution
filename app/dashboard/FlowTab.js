'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { supabase } from '../lib/supabase/client';
import styles from './Flow.module.css';
import { useRouter, useSearchParams } from 'next/navigation';



const FlowTab = () => {
  // State initialization
  const [projects, setProjects] = useState([]);
  const [sessionIds, setSessionIds] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDetails, setMessageDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');

  const chatContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);

  // Get URL parameters safely
  const getUrlParams = () => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
      project: params.get('project') || '',
      session: params.get('session') || '',
      tab: params.get('tab') || 'flow'
    };
  };

  // Scroll position management
  const saveScrollPosition = () => {
    if (chatContainerRef.current) {
      scrollPositionRef.current = chatContainerRef.current.scrollTop;
    }
  };

  const restoreScrollPosition = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  };

  // Initialize from URL parameters
  useEffect(() => {
    const { project, session } = getUrlParams();
    setSelectedProject(project);
    setSelectedSessionId(session);
    setLoading(false);
  }, []);

  // Load projects list
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('grc_service')
          .select('project_name');
        
        if (error) throw error;
        
        const uniqueProjects = [...new Set(data.map(item => item.project_name))];
        setProjects(uniqueProjects);
      } catch (err) {
        setError('Error fetching projects');
      }
    };
    
    fetchProjects();
  }, []);

  // Load sessions when project changes
  useEffect(() => {
    if (!selectedProject) return;

    const fetchSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('grc_service')
          .select('session_id')
          .eq('project_name', selectedProject);
        
        if (error) throw error;
        
        const uniqueSessions = [...new Set(data.map(item => item.session_id))];
        setSessionIds(uniqueSessions);
      } catch (err) {
        setError('Error fetching sessions');
      }
    };
    
    fetchSessions();
  }, [selectedProject]);

  // Load chat history when both project and session are selected
  useEffect(() => {
    if (!selectedProject || !selectedSessionId) return;

    const fetchChatHistory = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('grc_service')
          .select('*')
          .eq('project_name', selectedProject)
          .eq('session_id', selectedSessionId)
          .order('session_dialog_dt', { ascending: true });
        
        if (error) throw error;
        setChatHistory(data);
      } catch (err) {
        setError('Failed to load chat history');
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, [selectedProject, selectedSessionId]);

  const handleProjectChange = (project) => {
    const params = new URLSearchParams();
    params.set('project', project);
    window.history.pushState({}, '', `?${params.toString()}`);
    setSelectedProject(project);
    setSelectedSessionId('');
  };

  const handleSessionChange = (session) => {
    const params = new URLSearchParams();
    params.set('project', selectedProject);
    params.set('session', session);
    window.history.pushState({}, '', `?${params.toString()}`);
    setSelectedSessionId(session);
  };

  const handleViewClick = async () => {
    if (!selectedProject || !selectedSessionId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('grc_service')
        .select('*')
        .eq('project_name', selectedProject)
        .eq('session_id', selectedSessionId)
        .order('session_dialog_dt', { ascending: true });
      
      if (error) throw error;
      setChatHistory(data);
    } catch (err) {
      setError('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    if (selectedMessage?.id === message.id) return;
    
    saveScrollPosition();
    setLoading(true);
    
    try {
      const { data: messageData, error: messageError } = await supabase
        .from('grc_service')
        .select('*')
        .eq('id', message.id)
        .single();

      if (messageError) throw messageError;

      const { data: promptData } = await supabase
        .from('grc_service')
        .select('id', { count: 'exact' })
        .eq('project_name', selectedProject)
        .eq('session_id', selectedSessionId)
        .eq('text_type', 'prompt');

      const { data: responseData } = await supabase
        .from('grc_service')
        .select('id', { count: 'exact' })
        .eq('project_name', selectedProject)
        .eq('session_id', selectedSessionId)
        .eq('text_type', 'response');

      setMessageDetails(messageData);
      setStats({
        prompt_count: promptData?.length || 0,
        response_count: responseData?.length || 0
      });
      setSelectedMessage(message);
      
      // Restore scroll position after state updates
      requestAnimationFrame(() => {
        restoreScrollPosition();
      });
    } catch (err) {
      setError('Failed to load message details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatHistory.length > 0 && chatContainerRef.current) {
      const container = chatContainerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 100;
      
      if (isNearBottom) {
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;
        });
      }
    }
  }, [chatHistory]);

  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (error) return <div className={styles.error}>{error}</div>;




  return (
    <div className={styles.flowTabContainer}>
      <div className={styles.filterSection}>
       <select
  value={selectedProject}
  onChange={(e) => handleProjectChange(e.target.value)}
  className={styles.filterDropdown}
>
  <option value="">Select Project</option>
  {projects.map((project, index) => (
    <option key={index} value={project}>
      {project}
    </option>
  ))}
</select>

{selectedProject && (
  <select
    value={selectedSessionId}
    onChange={(e) => handleSessionChange(e.target.value)}
    className={styles.filterDropdown}
  >
    <option value="">Select Session ID</option>
    {sessionIds.map((session, index) => (
      <option key={index} value={session}>
        {session}
      </option>
    ))}
  </select>
)}

        <button
          onClick={handleViewClick}
          className={styles.viewButton}
          disabled={!selectedProject || !selectedSessionId}
        >
          View
        </button>
      </div>

      <div className={styles.chatLayout}>
        <div 
          className={styles.chatHistoryContainer}
          ref={chatContainerRef}
        >
          {loading ? (
            <div className={styles.loading}>Loading chat history...</div>
          ) : chatHistory.length > 0 ? (
            chatHistory.map((chat, index) => (
              <div 
                key={index}
                className={`${styles.messageContainer} ${
                  selectedMessage?.id === chat.id ? styles.selectedMessage : ''
                }`}
                onClick={() => handleMessageClick(chat)}
              >
                {index === 0 && (
                  <div className={styles.historyMarker}>Start of Chat</div>
                )}

                <div
                  className={`${styles.chatMessage} ${
                    chat.text_type === 'response' ? styles.assistant : styles.client
                  }`}
                >
                  <div className={styles.chatAvatar}>
                    <img
                      src={
                        chat.text_type === 'response'
                          ? '/assistant_avatar.png'
                          : '/client_avatar.png'
                      }
                      alt={chat.text_type === 'response' ? 'Assistant' : 'Client'}
                    />
                    <span className={styles.timestamp}>
                      {chat.session_dialog_dt
                        ? new Date(chat.session_dialog_dt).toLocaleString()
                        : ''}
                    </span>
                  </div>
                  <div className={styles.chatMessageContent}>
                    <p>{chat.input_text}</p>
                  </div>
                </div>

                {index === chatHistory.length - 1 && (
                  <div className={styles.historyMarker}>End of Chat</div>
                )}
              </div>
            ))
          ) : (
            <div className={styles.noChatHistory}>No chats found.</div>
          )}
        </div>

        <div className={styles.detailsPanel}>
          {loading ? (
            <div className={styles.loading}>Loading details...</div>
          ) : messageDetails ? (
            <div className={styles.detailsContent}>
              <h3>Message Details</h3>
              
              <div className={styles.detailSection}>
                <h4>Session Dialog ID:</h4>
                <pre>{JSON.stringify(messageDetails.session_dialog_id, null, 2)}</pre>
              </div>

              <div className={styles.detailSection}>
                <h4>Model:</h4>
                <pre>{JSON.stringify(messageDetails.model_name, null, 2)}</pre>
              </div>

              <div className={styles.detailSection}>
                <h4>Request Header:</h4>
                <pre>{JSON.stringify(messageDetails.headers, null, 2)}</pre>
              </div>

              <div className={styles.detailSection}>
                <h4>Endpoint:</h4>
                <pre>{JSON.stringify(messageDetails.endpoint, null, 2)}</pre>
              </div>

              <div className={styles.detailSection}>
                <h4>Request Body:</h4>
                <pre>{JSON.stringify(messageDetails.request_body, null, 2)}</pre>
              </div>

              <div className={styles.detailSection}>
                <h4>Response Body:</h4>
                <pre>{JSON.stringify(messageDetails.response_body, null, 2)}</pre>
              </div>

            {stats && ( 
              <div className={styles.statsSection}>
                  <h3>Session Statistics</h3>
                  <div className={styles.statItem}>
                    <span>Total Prompts:</span>
                    <span>{stats.prompt_count}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span>Total Responses:</span>
                    <span>{stats.response_count}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.noSelection}>
              Select a message to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowTab;