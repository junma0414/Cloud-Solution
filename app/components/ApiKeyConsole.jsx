'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';

export default function ApiKeyConsole() {
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
const [newKeyName, setNewKeyName] = useState(''); // Add this line

  // SVG Icon Components
  const PencilIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  );

  const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setApiKeys(data.map(key => ({
        ...key,
        maskedKey: key.key.substring(0, 8) + '*'.repeat(12) + key.key.substring(key.key.length - 4),
        createdAt: new Date(key.created_at).toISOString().split('T')[0],
        lastUsed: key.last_used ? new Date(key.last_used).toISOString().split('T')[0] : 'Never used'
      })));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  const revokeKey = async (keyId) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', keyId);
      
      if (error) throw error;
      await fetchApiKeys();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateKeyName = async (keyId, newName) => {
    if (!newName.trim()) {
      setError('Please enter a valid name');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ name: newName })
        .eq('id', keyId);
      
      if (error) throw error;
      await fetchApiKeys();
      setEditingKey(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      setError('Please enter a valid name');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');
      
      const newKey = `sk_${crypto.randomUUID().replace(/-/g, '')}`;
      
      const { error } = await supabase
        .from('api_keys')
        .insert({
          user_id: user.id,
          name: newKeyName,
          key: newKey
        });
      
      if (error) throw error;
      
      //alert(`Your new API key is: ${newKey}\n\nPlease save it securely as it won't be shown again.`);/*}
     // Replace the alert with a modal that includes copy functionality
      setShowCreateModal(false);
      const shouldCopy = confirm(`Your new API key is:\n\n${newKey}\n\nClick OK to copy to clipboard.`);
      if (shouldCopy) {
        navigator.clipboard.writeText(newKey)
          .then(() => alert('API key copied to clipboard!'))
          .catch(() => alert('Failed to copy. Please manually copy the key.'));
      }
      
      await fetchApiKeys();
      setNewKeyName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
   
 
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">API Key Management</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-gray-600 mb-4">
          Below are all your API keys. Keys are only visible during creation - please save them securely.
          Never share your API keys or expose them in browser/client-side code.
        </p>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Key</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Last Used</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map((key) => (
                <tr key={key.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    {editingKey === key.id ? (
                      <input
                        type="text"
                        defaultValue={key.name}
                        onBlur={(e) => updateKeyName(key.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') updateKeyName(key.id, e.target.value);
                          if (e.key === 'Escape') setEditingKey(null);
                        }}
                        className="border rounded px-2 py-1 w-full"
                        autoFocus
                      />
                    ) : (
                      key.name
                    )}
                  </td>
                  <td className="p-3 font-mono text-sm">{key.maskedKey}</td>
                  <td className="p-3">{key.createdAt}</td>
                  <td className="p-3"> {key.lastUsed === 'Never used' ? (
                      <span className="text-gray-400">Never used</span>
                    ) : (
                      <span >
                        {key.lastUsed}
                      </span>
                    )}</td>
                  <td className="p-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingKey(key.id)}
                        className="text-blue-500 hover:text-blue-700 p-1 rounded hover:bg-blue-50"
                        title="Edit name"
                        disabled={loading}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        onClick={() => revokeKey(key.id)}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                        title="Revoke key"
                        disabled={loading}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={() => setShowCreateModal(true)}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
        disabled={loading}
      >
        {loading ? 'Loading...' : 'Create New API Key'}
      </button>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Create API Key</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter API key name"
	value={newKeyName} // Add this
                  onChange={(e) => setNewKeyName(e.target.value)} // Add this
                  disabled={loading}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={createApiKey} // Add this
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={loading}
                >
                       {loading ? 'Creating...' : 'Create'} {/* Update this */}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}