import React from 'react';
import styles from './SpecialsBanner.module.css';

interface SpecialsBannerProps {
  message?: string;
  backgroundColor?: string;
  textColor?: string;
  speed?: number; // seconds for animation duration
}

const DEFAULT_CONFIG = {
  message: "Just till Tuesday - 20% off Kimchi - try now 🥳",
  backgroundColor: "linear-gradient(90deg, #ff4b2b 0%, #ff416c 100%)",
  textColor: "white",
  speed: 40
};

const SpecialsBanner: React.FC<SpecialsBannerProps> = ({ 
  message = DEFAULT_CONFIG.message,
  backgroundColor,
  textColor,
  speed = DEFAULT_CONFIG.speed
}) => {
  const style = {
    ...(backgroundColor && { background: backgroundColor }),
    ...(textColor && { color: textColor }),
  } as React.CSSProperties;

  const marqueeStyle = {
    animationDuration: `${speed}s`
  } as React.CSSProperties;

  return (
    <div className={styles['specials-banner']} style={style}>
      <div className={styles['marquee-track']} style={marqueeStyle}>
        <div className={styles.marquee}>
          <span>{message}</span>
          <span>{message}</span>
          <span>{message}</span>
          <span>{message}</span>
        </div>
        <div className={styles.marquee}>
          <span>{message}</span>
          <span>{message}</span>
          <span>{message}</span>
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
};

export default SpecialsBanner;
