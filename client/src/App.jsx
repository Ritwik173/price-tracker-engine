import { useState, useEffect } from 'react';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { Activity, Plus, Search } from 'lucide-react';
import Dashboard from './components/Dashboard';
import AddProductForm from './components/AddProductForm';

const API_URL = 'http://localhost:3001/api';

function App() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/products`);
      setProducts(response.data);
    } catch (error) {
      toast.error('Failed to load products. Is the server running?');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleProductAdded = (newProduct) => {
    setProducts([newProduct, ...products]);
    setShowAddForm(false);
    toast.success('Product added successfully!');
  };

  const handleProductDeleted = (productId) => {
    setProducts(products.filter(p => p.id !== productId));
    toast.success('Product removed');
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.platform.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.1)'
        }
      }} />
      
      <header className="header">
        <div className="container header-content">
          <div className="logo">
            <Activity color="#60a5fa" size={28} />
            <span>Price Tracker</span>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                placeholder="Search products..." 
                className="input-field"
                style={{ paddingLeft: '35px', width: '250px', background: 'rgba(255,255,255,0.05)', height: '40px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={18} />
              Track Product
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        {showAddForm ? (
          <div className="animate-fade-in">
            <AddProductForm 
              onClose={() => setShowAddForm(false)} 
              onSuccess={handleProductAdded}
              apiUrl={API_URL}
            />
          </div>
        ) : (
          <div className="animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <div>
                <h2>Your Watchlist</h2>
                <p>Tracking {products.length} products automatically.</p>
              </div>
            </div>
            
            <Dashboard 
              products={filteredProducts} 
              isLoading={isLoading} 
              onDelete={handleProductDeleted}
              apiUrl={API_URL}
            />
          </div>
        )}
      </main>
    </>
  );
}

export default App;
