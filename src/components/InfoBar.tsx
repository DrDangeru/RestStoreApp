import React, { useState, useEffect } from 'react';
import type { InfoBarProps } from '../types';
import styles from './InfoBar.module.css';

const DEFAULT_CONFIG = {
  message: "Connecting to deals...",
  backgroundColor: "linear-gradient(90deg, #ff4b2b 0%, #ff416c 100%)",
  textColor: "white",
};

const InfoBar: React.FC<InfoBarProps> = ({ 
  message: initialMessage = DEFAULT_CONFIG.message,
  backgroundColor,
  textColor,
}) => {
  const [promoMessage, setPromoMessage] = useState(initialMessage);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8080/api/promos');

    eventSource.onmessage = (event) => {
      // Fade out
      setFade(true);
      
      // Wait for fade out, then update text and fade in
      setTimeout(() => {
        setPromoMessage(event.data);
        setFade(false);
      }, 500); // 500ms should match CSS transition duration
    };

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const style = {
    ...(backgroundColor && { background: backgroundColor }),
    ...(textColor && { color: textColor }),
  } as React.CSSProperties;

  return (
    <div className={styles['info-bar']} style={style}>
      <div className={`${styles['promo-text']} ${fade ? styles['fade-out'] : styles['fade-in']}`}>
        {promoMessage}
      </div>
    </div>
  );
};

export default InfoBar;
