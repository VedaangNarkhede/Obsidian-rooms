'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import styles from './Settings.module.css';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  
  // Deletion state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  // One-time key display state
  const [newRawKey, setNewRawKey] = useState<{name: string, key: string} | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyId(id);
    setTimeout(() => setCopiedKeyId(null), 2000);
  };

  const fetchApiKeys = async () => {
    const res = await fetch('/api/api-keys');
    const data = await res.json();
    if (data.apiKeys) setApiKeys(data.apiKeys);
    setLoading(false);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    
    const res = await fetch('/api/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    
    if (res.ok) {
      const data = await res.json();
      setNewRawKey({ name: data.apiKey.name, key: data.apiKey.rawKey });
      setNewName('');
      fetchApiKeys();
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm.toLowerCase() !== 'delete') return;
    
    const res = await fetch(`/api/api-keys/${id}`, {
      method: 'DELETE'
    });
    
    if (res.ok) {
      setDeletingId(null);
      setDeleteConfirm('');
      fetchApiKeys();
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Settings & API Keys</h1>
      <p className={styles.subtitle}>Manage your Obsidian Rooms API keys to sync your vaults.</p>

      <Modal 
        isOpen={!!newRawKey} 
        onClose={() => setNewRawKey(null)} 
        title="API Key Generated Successfully!"
      >
        <p style={{ color: '#abb2bf', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            Please copy your new API Key for <strong>{newRawKey?.name}</strong> now. <br/>
            <span style={{ color: '#e06c75' }}>You will not be able to see it again!</span>
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
            <code style={{ flex: 1, backgroundColor: '#1e1e1e', padding: '0.75rem', borderRadius: '4px', border: '1px solid #333', color: '#98c379', wordBreak: 'break-all' }}>
                {newRawKey?.key}
            </code>
            <button onClick={() => newRawKey && handleCopy(newRawKey.key, 'new')} className={styles.primaryButton}>
                {copiedKeyId === 'new' ? 'Copied!' : 'Copy Key'}
            </button>
        </div>
      </Modal>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your API Keys</h2>
        
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : (
          <div className={styles.keyList}>
            {apiKeys.length === 0 && <p className={styles.empty}>No API keys generated yet.</p>}
            
            {apiKeys.map(key => {
              return (
                <div key={key.id} className={styles.keyCard}>
                  <div className={styles.keyHeader}>
                    <h3>{key.name}</h3>
                    <span className={styles.date}>{new Date(key.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className={styles.keyValueContainer}>
                    <div className={styles.keyValue}>
                      <code>••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••</code>
                    </div>
                  </div>
                  
                  {deletingId === key.id ? (
                    <div className={styles.deleteConfirmArea}>
                      <p>Type <strong>delete</strong> to confirm:</p>
                      <input 
                        type="text" 
                        value={deleteConfirm} 
                        onChange={e => setDeleteConfirm(e.target.value)} 
                        placeholder="delete"
                        className={styles.input}
                      />
                      <div className={styles.actions}>
                        <button onClick={() => handleDelete(key.id)} disabled={deleteConfirm.toLowerCase() !== 'delete'} className={styles.dangerButton}>
                          Confirm Deletion
                        </button>
                        <button onClick={() => { setDeletingId(null); setDeleteConfirm(''); }} className={styles.secondaryButton}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setDeletingId(key.id)} className={styles.dangerButtonSmall}>
                      Delete Key
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Generate New Key</h2>
        <form onSubmit={handleGenerate} className={styles.generateForm}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Work Laptop, Home Desktop"
            className={styles.input}
            required
          />
          <button type="submit" className={styles.primaryButton}>Generate Key</button>
        </form>
      </div>
    </div>
  );
}
