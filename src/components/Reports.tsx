import React, { useEffect, useState } from 'react';
import type { SalesReport } from '../types';
import styles from './Reports.module.css';

export const Reports: React.FC = () => {
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'topItems'>('daily');

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/reports/sales', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      setReport(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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
    <div className={styles.reportsContainer}>
      <h2 className={styles.title}>Sales & Performance Reports</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'daily' ? styles.active : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          Daily Sales (Last 30 Days)
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'monthly' ? styles.active : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          Monthly Sales (Last 12 Months)
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'topItems' ? styles.active : ''}`}
          onClick={() => setActiveTab('topItems')}
        >
          Top Selling Items
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'daily' && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Total Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.dailySales?.map((stat) => (
                  <tr key={stat.date}>
                    <td>{new Date(stat.date).toLocaleDateString()}</td>
                    <td>{stat.totalOrders}</td>
                    <td>${stat.totalRevenue.toFixed(2)}</td>
                  </tr>
                ))}
                {!report.dailySales?.length && (
                  <tr>
                    <td colSpan={3} className={styles.empty}>No daily sales data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'monthly' && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Orders</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.monthlySales?.map((stat) => (
                  <tr key={stat.month}>
                    <td>{stat.month}</td>
                    <td>{stat.totalOrders}</td>
                    <td>${stat.totalRevenue.toFixed(2)}</td>
                  </tr>
                ))}
                {!report.monthlySales?.length && (
                  <tr>
                    <td colSpan={3} className={styles.empty}>No monthly sales data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'topItems' && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Item Name</th>
                  <th>Category</th>
                  <th>Quantity Sold</th>
                  <th>Total Revenue</th>
                </tr>
              </thead>
              <tbody>
                {report.topItems?.map((item) => (
                  <tr key={item.productId}>
                    <td>{item.productName}</td>
                    <td className={styles.capitalize}>{item.category}</td>
                    <td>{item.quantitySold}</td>
                    <td>${item.totalRevenue.toFixed(2)}</td>
                  </tr>
                ))}
                {!report.topItems?.length && (
                  <tr>
                    <td colSpan={4} className={styles.empty}>No item sales data available</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
