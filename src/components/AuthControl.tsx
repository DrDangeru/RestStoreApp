import { useState, useImperativeHandle, forwardRef } from 'react';
import { useAuth } from '../context/AuthContext';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import styles from './AuthControl.module.css';

interface AuthControlProps {
  onAdminClick: () => void;
  hideButton?: boolean;
}

export interface AuthControlHandle {
  openLogin: () => void;
}

const AuthControl = forwardRef<AuthControlHandle, AuthControlProps>(({ onAdminClick, hideButton = false }, ref) => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);

  useImperativeHandle(ref, () => ({
    openLogin: () => {
      setShowAuthModal(true);
    }
  }));

  const handleGearClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else if (user.role === 'admin') {
      onAdminClick();
    } else {
      setShowUserProfile(true);
    }
  };

  return (
    <>
      {!hideButton && (
        <button 
          className={styles['admin-toggle']}
          onClick={handleGearClick}
          style={{ position: 'absolute', top: '80px', right: '20px' }}
          aria-label="Account Settings"
        >
          ⚙️
        </button>
      )}

      {showAuthModal && (
        <AuthModal 
          onClose={() => setShowAuthModal(false)} 
          onSuccess={() => {
            setShowAuthModal(false);
          }} 
        />
      )}
      
      {showUserProfile && (
        <UserProfile onClose={() => setShowUserProfile(false)} />
      )}
    </>
  );
});

export default AuthControl;
