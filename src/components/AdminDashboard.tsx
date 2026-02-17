import { useState, useEffect } from 'react';
import type { DashboardStats } from '../types';
import styles from './AdminDashboard.module.css';

interface AdminDashboardProps {
  onClose: () => void;
}

const API_URL = 'http://localhost:8080/api';

function AdminDashboard({ onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_URL}/dashboard`);
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className={styles.loading}>Loading dashboard...</div>;
  if (error) return <div className={styles.error}>Error: {error}</div>;
  if (!stats) return <div className={styles.error}>No data available</div>;

  return (
    <div className={styles['dashboard-container']}>
      <header className={styles['dashboard-header']}>
        <h1 className={styles['dashboard-title']}>Admin Dashboard</h1>
        <button className={styles['close-btn']} onClick={onClose}>Close Panel</button>
      </header>

      <div className={styles['stats-grid']}>
        <div className={styles['stat-card']}>
          <span className={styles['stat-label']}>Total Orders</span>
          <span className={styles['stat-value']}>{stats.totalOrders}</span>
        </div>
        <div className={styles['stat-card']}>
          <span className={styles['stat-label']}>Total Revenue</span>
          <span className={styles['stat-value']}>${stats.totalRevenue.toFixed(2)}</span>
        </div>
        <div className={styles['stat-card']}>
          <span className={styles['stat-label']}>Low Stock Items</span>
          <span className={styles['stat-value']}>{stats.lowStockItems ? stats.lowStockItems.length : 0}</span>
        </div>
      </div>

      <section className={styles['inventory-section']}>
        <h2 className={styles['section-title']}>📦 Full Inventory</h2>
        {stats.inventory && stats.inventory.length > 0 ? (
          <table className={styles['inventory-table']}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.inventory.map(item => {
                const isLowStock = item.stockQuantity !== undefined && 
                                 item.lowStockThreshold !== undefined && 
                                 item.stockQuantity <= item.lowStockThreshold;
                
                return (
                  <tr key={item.id} style={{ backgroundColor: isLowStock ? '#fff5f5' : 'inherit' }}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>{item.category}</td>
                    <td>${item.price.toFixed(2)}</td>
                    <td>{item.stockQuantity}</td>
                    <td>{item.lowStockThreshold}</td>
                    <td>
                      {isLowStock ? (
                        <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Low Stock</span>
                      ) : (
                        <span style={{ color: '#28a745' }}>OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p>No inventory data available.</p>
        )}
      </section>

      <section className={styles['inventory-section']}>
        <h2 className={styles['section-title']}>⚠️ Low Stock Alerts</h2>
        {stats.lowStockItems && stats.lowStockItems.length > 0 ? (
          <table className={styles['inventory-table']}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Current Stock</th>
                <th>Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.lowStockItems.map(item => (
                <tr key={item.id} className={styles['low-stock']}>
                  <td>{item.id}</td>
                  <td>{item.name}</td>
                  <td>{item.stockQuantity}</td>
                  <td>{item.lowStockThreshold}</td>
                  <td>Low Stock</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No low stock alerts. Inventory is healthy.</p>
        )}
      </section>

      <section className={styles['sales-section']}>
        <h2 className={styles['section-title']}>Daily Sales (Last 7 Days)</h2>
        {stats.dailyStats && stats.dailyStats.length > 0 ? (
          <table className={styles['sales-table']}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {stats.dailyStats.map(day => (
                <tr key={day.date}>
                  <td>{new Date(day.date).toLocaleDateString()}</td>
                  <td>{day.totalOrders}</td>
                  <td>${day.totalRevenue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No sales data for the last 7 days.</p>
        )}
      </section>
    </div>
  );
}

export default AdminDashboard;
