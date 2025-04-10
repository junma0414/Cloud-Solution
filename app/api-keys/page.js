// app/api-keys/page.js
'use client'; // Required since we're using hooks
import ApiKeyConsole from '../components/ApiKeyConsole.jsx';
import { supabase } from '../lib/supabase/client';
import { useEffect } from 'react';

export default function ApiKeysPage() {
  // Verify authentication state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) window.location.href = '/login';
    });
  }, []);

  return (
    <main className="api-key-container">
      <ApiKeyConsole />
    </main>
  );
}