import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import type { Order, OrderItem } from '../types';
import styles from './UserProfile.module.css';

interface UserProfileProps {
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, logout, token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/orders/user/${user!.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Take only last 3 orders
          setOrders(data ? data.slice(0, 3) : []);
        }
      } catch (error) {
        console.error("Failed to fetch orders", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && token) {
      fetchOrders();
    }
  }, [user, token]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!user) return null;

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content']}>
        <button className={styles['close-btn']} onClick={onClose}>&times;</button>
        
        <div className={styles['profile-header']}>
          <div className={styles['avatar']}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className={styles['user-name']}>{user.name}</h2>
          <span className={styles['user-role']}>{user.role}</span>
        </div>

        <div className={styles['info-section']}>
          <div className={styles['info-row']}>
            <span className={styles['label']}>Email:</span>
            <span className={styles['value']}>{user.email}</span>
          </div>
          <div className={styles['info-row']}>
            <span className={styles['label']}>Phone:</span>
            <span className={styles['value']}>{user.phone || 'N/A'}</span>
          </div>
        </div>

        <div className={styles['orders-section']}>
          <h3>Last 3 Orders</h3>
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length > 0 ? (
            <div className={styles['orders-list']}>
              {orders.map((order: Order) => (
                <div key={order.id} className={styles['order-card']}>
                  <div className={styles['order-header']}>
                    <span className={styles['order-date']}>
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className={styles['order-status']}>{order.status}</span>
                  </div>
                  <div className={styles['order-items']}>
                    {order.items.map((item: OrderItem, idx: number) => (
                      <span key={idx} className={styles['item-preview']}>
                         {item.quantity}x Product#{item.productId}
                      </span>
                    ))}
                  </div>
                  <div className={styles['order-total']}>
                    Total: ${order.totalPrice.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles['no-orders']}>No previous orders found.</p>
          )}
        </div>

        <button onClick={handleLogout} className={styles['logout-btn']}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default UserProfile;
