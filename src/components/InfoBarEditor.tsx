import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import EmojiPicker from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';
import styles from './InfoBarEditor.module.css';

const API_URL = 'http://localhost:8080/api';

export const InfoBarEditor: React.FC = () => {
  const { token } = useAuth();
  const [promos, setPromos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPromo, setNewPromo] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const response = await fetch(`${API_URL}/promos/list`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch promos');
        
        const data = await response.json();
        setPromos(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPromos();
  }, [token]);

  const savePromos = async (updatedPromos: string[]) => {
    try {
      const response = await fetch(`${API_URL}/promos/list`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedPromos)
      });

      if (!response.ok) throw new Error('Failed to update promos');
      
      setPromos(updatedPromos);
    } catch (err) {
      alert(`Error updating promos: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleAddPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromo.trim()) return;
    
    const updated = [...promos, newPromo.trim()];
    savePromos(updated);
    setNewPromo('');
    setShowEmojiPicker(false);
  };

  const handleRemovePromo = (index: number) => {
    const updated = promos.filter((_, i) => i !== index);
    savePromos(updated);
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewPromo(prev => prev + emojiData.emoji);
  };

  if (loading) return <div className={styles.loading}>Loading promo editor...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.editorContainer}>
      <h2 className={styles.title}>Info Bar Editor</h2>
      <p className={styles.subtitle}>
        Manage the scrolling deals shown at the top of the store.
      </p>

      <form onSubmit={handleAddPromo} className={styles.addForm}>
        <div className={styles.inputWrapper}>
          <input 
            type="text" 
            value={newPromo}
            onChange={(e) => setNewPromo(e.target.value)}
            placeholder="Enter a new promotion message..."
            className={styles.input}
          />
          <div className={styles.emojiContainer} ref={pickerRef}>
            <button 
              type="button" 
              className={styles.emojiToggleBtn}
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              😀
            </button>
            {showEmojiPicker && (
              <div className={styles.emojiPickerWrapper}>
                <EmojiPicker onEmojiClick={onEmojiClick} width={300} height={400} />
              </div>
            )}
          </div>
        </div>
        <button type="submit" className={styles.addBtn} disabled={!newPromo.trim()}>
          Add Promo
        </button>
      </form>

      <div className={styles.promoList}>
        {promos.length === 0 ? (
          <p className={styles.empty}>No promos currently active.</p>
        ) : (
          promos.map((promo, index) => (
            <div key={index} className={styles.promoItem}>
              <span className={styles.promoText}>{promo}</span>
              <button 
                onClick={() => handleRemovePromo(index)}
                className={styles.removeBtn}
                title="Remove promotion"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
