import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ExternalLink, Trash2, TrendingDown, Target, Bell, LineChart as ChartIcon } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProductCard({ product, onDelete, apiUrl }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [history, setHistory] = useState([]);
  const [showChart, setShowChart] = useState(false);
  const alerts = product.alerts || [];

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to stop tracking this product?')) return;
    
    try {
      setIsDeleting(true);
      await axios.delete(`${apiUrl}/products/${product.id}`);
      onDelete(product.id);
    } catch (error) {
      toast.error('Failed to delete product');
      setIsDeleting(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${apiUrl}/products/${product.id}`);
      const formattedHistory = res.data.priceHistory.map(pt => ({
        date: new Date(pt.scrapedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        price: pt.price
      }));
      setHistory(formattedHistory);
      setShowChart(!showChart);
    } catch (error) {
      toast.error('Could not load price history');
    }
  };

  const getCurrencySymbol = (cur) => {
    switch(cur) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': return '₹';
      case 'AUD': return 'A$';
      default: return cur ? cur + ' ' : '₹';
    }
  };

  const curSymbol = getCurrencySymbol(product.currency);

  // Calculate stats
  const dropPercentage = product.highestPrice && product.currentPrice < product.highestPrice
    ? Math.round(((product.highestPrice - product.currentPrice) / product.highestPrice) * 100)
    : 0;

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span className={`badge ${product.platform === 'amazon' ? 'badge-amazon' : 'badge-flipkart'}`}>
          {product.platform}
        </span>
        <button className="btn-icon" onClick={handleDelete} disabled={isDeleting} style={{ color: 'var(--danger-color)' }}>
          <Trash2 size={18} />
        </button>
      </div>

      {/* Product Info */}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <span style={{ fontSize: '2rem' }}>📦</span>
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.25rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </h3>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {curSymbol}{product.currentPrice?.toLocaleString('en-US') || '---'}
            {dropPercentage > 0 && (
              <span style={{ fontSize: '0.8rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center' }}>
                <TrendingDown size={14} /> {dropPercentage}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Target Price */}
      <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Target size={16} color="var(--warning-color)" />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Target:</span>
          <strong style={{ fontSize: '1rem' }}>
            {product.targetPrice ? `${curSymbol}${product.targetPrice.toLocaleString('en-US')}` : 'Not set'}
          </strong>
        </div>
        <a href={product.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
          View <ExternalLink size={14} />
        </a>
      </div>

      {/* Chart Toggle */}
      <button className="btn btn-secondary" onClick={fetchHistory} style={{ width: '100%', justifyContent: 'center' }}>
        <ChartIcon size={16} /> {showChart ? 'Hide History' : 'View Price History'}
      </button>

      {/* Chart Area */}
      {showChart && history.length > 0 && (
        <div className="animate-fade-in" style={{ height: '150px', marginTop: '0.5rem', marginLeft: '-15px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickMargin={5} />
              <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} width={45} tickFormatter={(val) => `${curSymbol}${val}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                itemStyle={{ color: '#60a5fa' }}
              />
              <Line type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Alerts Config */}
      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Bell size={14} color="var(--text-secondary)" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alerts Configured</span>
        </div>
        
        {alerts.length > 0 ? (
          alerts.map(alert => (
            <div key={alert.id} style={{ fontSize: '0.85rem', color: 'var(--success-color)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.25rem' }}>
              ✓ {alert.type} active for {alert.destination}
            </div>
          ))
        ) : (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No alerts configured.</div>
        )}
      </div>

    </div>
  );
}
