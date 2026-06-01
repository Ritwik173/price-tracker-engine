import React from 'react';
import ProductCard from './ProductCard';
import { PackageOpen } from 'lucide-react';

export default function Dashboard({ products, isLoading, onDelete, apiUrl }) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh', flexDirection: 'column', gap: '1rem' }}>
        <div className="loading-spinner"></div>
        <p>Loading your watchlist...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem' }}>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--accent-color)' }}>
          <PackageOpen size={40} />
        </div>
        <h3 style={{ marginBottom: '0.5rem' }}>Your watchlist is empty</h3>
        <p style={{ maxWidth: '400px', margin: '0 auto' }}>
          Start tracking products from Amazon or Flipkart to get notified when prices drop.
        </p>
      </div>
    );
  }

  return (
    <div className="grid-cards">
      {products.map(product => (
        <ProductCard 
          key={product.id} 
          product={product} 
          onDelete={onDelete}
          apiUrl={apiUrl}
        />
      ))}
    </div>
  );
}
