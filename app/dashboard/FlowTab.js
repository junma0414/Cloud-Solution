'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase/client';
import styles from './Flow.module.css';
import { useRouter, useSearchParams } from 'next/navigation';

// Create a wrapper component that handles the suspense boundary
const FlowTabWithSuspense = () => {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading filters...</div>}>
      <FlowTab />
    </Suspense>
  );
};

const FlowTab = () => {
  const [projects, setProjects] = useState([]);
  const [sessionIds, setSessionIds] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDetails, setMessageDetails] = useState(null);
  const [stats, setStats] = useState(null);
  const router = useRouter();
  const chatContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const [selectedProject, setSelectedProject] = useState(
    searchParams.get('project') || ''
  );
  const [selectedSessionId, setSelectedSessionId] = useState(
    searchParams.get('session') || ''
  );

  // Save scroll position to ref
  const saveScrollPosition = useCallback(() => {
    if (chatContainerRef.current) {
      scrollPositionRef.current = chatContainerRef.current.scrollTop;
    }
  }, []);

  // Restore scroll position from ref
  const restoreScrollPosition = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = scrollPositionRef.current;
    }
  }, []);

  const handleProjectChange = (project) => {
    saveScrollPosition();
    router.push(`/dashboard?tab=flow&project=${encodeURIComponent(project)}`);
    setSelectedProject(project);
    setSelectedSessionId('');
    setSelectedMessage(null);
    setMessageDetails(null);
    setStats(null);
  };

  const handleSessionChange = (session) => {
    saveScrollPosition();
    router.push(`/dashboard?tab=flow&project=${encodeURIComponent(selectedProject)}&session=${encodeURIComponent(session)}`);
    setSelectedSessionId(session);
    setSelectedMessage(null);
    setMessageDetails(null);
    setStats(null);
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
      // Use requestAnimationFrame for better timing
      requestAnimationFrame(() => {
        restoreScrollPosition();
      });
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
      
      // Restore after state updates
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

  useEffect(() => {
    const project = searchParams.get('project');
    const session = searchParams.get('session');
    
    if (project !== selectedProject || session !== selectedSessionId) {
      saveScrollPosition();
      setSelectedProject(project || '');
      setSelectedSessionId(session || '');
    }
  }, [searchParams, selectedProject, selectedSessionId, saveScrollPosition]);

  useEffect(() => {
    if (selectedProject && selectedSessionId) {
      handleViewClick();
    }
  }, [selectedProject, selectedSessionId]);

  useEffect(() => {
    const fetchFilters = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('grc_service')
          .select('project_name');

        if (projectError) throw projectError;

        if (projectData) {
          const uniqueProjects = [...new Set(projectData.map(item => item.project_name))];
          setProjects(uniqueProjects);
        }
      } catch (err) {
        setError('Error fetching project data');
      } finally {
        setLoading(false);
      }
    };

    fetchFilters();
  }, []);

  useEffect(() => {
    const fetchSessionIds = async () => {
      if (!selectedProject) return;

      setLoading(true);
      setError(null);
      try {
        const { data: sessionData, error: sessionError } = await supabase
          .from('grc_service')
          .select('session_id')
          .eq('project_name', selectedProject);

        if (sessionError) throw sessionError;

        if (sessionData) {
          const uniqueSessionIds = [...new Set(sessionData.map(item => item.session_id))];
          setSessionIds(uniqueSessionIds);
        }
      } catch (err) {
        setError('Error fetching session data');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionIds();
  }, [selectedProject]);

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

export default FlowTabWithSuspense;