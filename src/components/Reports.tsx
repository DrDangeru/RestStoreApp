import React, { useEffect, useState } from 'react';
import type { SalesReport } from '../types';
import { ChartView } from './ChartView';
import { env } from '../env';
import styles from './Reports.module.css';

const API_URL = env.REACT_APP_API_URL;// use env var

export const Reports: React.FC = () => {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'daily' | 'monthly'>('daily');

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/reports/sales`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales report');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  if (loading) return <div className={styles.loading}>Loading reports...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!report) return null;

  return (
    <div className={styles['reports-container']}>
      <div className={styles['reports-header']}>
        <h2>Sales Analytics</h2>
        <div className={styles['view-toggles']}>
          <button 
            className={`${styles['toggle-btn']} ${viewType === 'daily' ? styles.active : ''}`}
            onClick={() => setViewType('daily')}
          >
            Daily View
          </button>
          <button 
            className={`${styles['toggle-btn']} ${viewType === 'monthly' ? styles.active : ''}`}
            onClick={() => setViewType('monthly')}
          >
            Monthly View
          </button>
        </div>
      </div>

      <div className={styles['charts-grid']}>
        {viewType === 'daily' ? (
          <>
            <ChartView 
              data={report.dailySales || []}
              type="bar"
              title="Daily Revenue"
              dataKey="totalRevenue"
              timeKey="date"
            />
            <ChartView 
              data={report.dailySales || []}
              type="pie"
              title="Daily Orders Breakdown"
              dataKey="totalOrders"
              timeKey="date"
            />
          </>
        ) : (
          <>
            <ChartView 
              data={report.monthlySales || []}
              type="bar"
              title="Monthly Revenue"
              dataKey="totalRevenue"
              timeKey="month"
            />
            <ChartView 
              data={report.monthlySales || []}
              type="pie"
              title="Monthly Orders Breakdown"
              dataKey="totalOrders"
              timeKey="month"
            />
          </>
        )}
      </div>

      <div className={styles['top-items-section']}>
        <h3>Top Selling Items</h3>
        <div className={styles['items-grid']}>
          {report.topItems?.map(item => (
            <div key={item.productId} className={styles['top-item-card']}>
              <div className={styles['item-info']}>
                <span className={styles['item-name']}>{item.productName}</span>
                <span className={styles['item-category']}>{item.category}</span>
              </div>
              <div className={styles['item-stats']}>
                <div className={styles['stat']}>
                  <span className={styles['stat-label']}>Sold</span>
                  <span className={styles['stat-value']}>{item.quantitySold}</span>
                </div>
                <div className={styles['stat']}>
                  <span className={styles['stat-label']}>Revenue</span>
                  <span className={styles['stat-value']}>${item.totalRevenue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
