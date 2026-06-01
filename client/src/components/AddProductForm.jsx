import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { Link, ArrowLeft, Loader2, Mail, MessageSquare, Phone } from 'lucide-react';

export default function AddProductForm({ onClose, onSuccess, apiUrl }) {
  const [url, setUrl] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [contactType, setContactType] = useState('EMAIL');
  const [destination, setDestination] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!url.includes('amazon') && !url.includes('amzn')) {
      toast.error('Please enter a valid Amazon URL');
      return;
    }

    if (!destination.trim()) {
      toast.error('Please enter an alert destination (Email or Phone Number)');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const response = await axios.post(`${apiUrl}/products`, {
        url,
        targetPrice: targetPrice ? parseFloat(targetPrice) : null,
        contactType,
        destination,
        currency
      });
      
      toast.success('Product tracked & alert configured!');
      onSuccess(response.data);
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('You are already tracking this product!');
      } else {
        toast.error(error.response?.data?.error || 'Failed to add product. Please check your URL.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrencySymbol = (cur) => {
    switch(cur) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': return '₹';
      case 'AUD': return 'A$';
      default: return cur;
    }
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '600px', margin: '2rem auto', padding: '2rem' }}>
      <button 
        className="btn-icon" 
        onClick={onClose}
        style={{ marginBottom: '1.5rem', alignSelf: 'flex-start' }}
      >
        <ArrowLeft size={20} /> <span style={{ marginLeft: '0.5rem' }}>Back to Dashboard</span>
      </button>

      <h2 style={{ marginBottom: '0.5rem' }}>Track a New Product</h2>
      <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
        Paste an Amazon URL, choose your display currency, and configure where you want price drop alerts sent.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        <div className="input-group">
          <label className="input-label" htmlFor="url">
            <Link size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
            Product URL *
          </label>
          <input
            id="url"
            type="url"
            className="input-field"
            placeholder="https://www.amazon.com/dp/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="input-group" style={{ flex: 1 }}>
            <label className="input-label" htmlFor="currency">
              Display Currency *
            </label>
            <select
              id="currency"
              className="input-field"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="INR">INR (₹) - Indian Rupee</option>
              <option value="USD">USD ($) - US Dollar</option>
              <option value="EUR">EUR (€) - Euro</option>
              <option value="GBP">GBP (£) - British Pound</option>
              <option value="AUD">AUD (A$) - Australian Dollar</option>
            </select>
          </div>

          <div className="input-group" style={{ flex: 2 }}>
            <label className="input-label" htmlFor="target">
              Target Price (Optional)
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                {getCurrencySymbol(currency)}
              </span>
              <input
                id="target"
                type="number"
                className="input-field"
                placeholder="e.g. 4999"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                style={{ paddingLeft: '2rem', width: '100%' }}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>

        <h3 style={{ fontSize: '1rem', marginBottom: '-0.5rem' }}>Alert Configuration</h3>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '250px' }}>
            <label className="input-label" htmlFor="destination">
              Email Address *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>
                <Mail size={16} />
              </span>
              <input
                id="destination"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="loading-spinner" style={{ border: 'none', width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} /> 
                Configuring...
              </>
            ) : (
              'Track Product & Set Alert'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
