import { useState, useEffect } from 'react'
import type { Product, ProductCategory, CartItem, CustomizationOption } from './types'
import Feedback from './components/Feedback'
import EasternCategory from './components/EasternCategory'
import WesternCategory from './components/WesternCategory'
import SpecialsBanner from './components/SpecialsBanner'
import AdminDashboard from './components/AdminDashboard'
import styles from './App.module.css'

const API_URL = 'http://localhost:8080/api'

function App() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Cart Handlers
  const addToCart = (product: Product, portion: string = 'Medium', 
    customizations: CustomizationOption[] = []) => {
    setCartItems(prev => {
      const existingItemIndex = prev.findIndex(
        item => 
          item.product.id === product.id && 
          item.portionSize === portion &&
          JSON.stringify(item.customizations || []) === 
            JSON.stringify(customizations)
      )

      if (existingItemIndex >= 0) {
        const newItems = [...prev]
        newItems[existingItemIndex].quantity += 1
        return newItems
      }

      return [...prev, { 
        product, quantity: 1, portionSize: portion, customizations 
      }]
    })
  }

  const updateQuantity = (index: number, change: number) => {
    setCartItems(prev => {
      const newItems = [...prev]
      newItems[index].quantity += change
      if (newItems[index].quantity <= 0) {
        newItems.splice(index, 1)
      }
      return newItems
    })
  }

  const removeFromCart = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index))
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setLoading(true);
    try {
      const totalPrice = cartItems.reduce((sum, item) => {
        const customizationsCost = item.customizations?.reduce((cSum, opt) => cSum + opt.price, 0) || 0;
        return sum + ((item.product.price + customizationsCost) * item.quantity);
      }, 0);

      const orderData = {
        userId: 1, // Mock user ID for now
        items: cartItems.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          portionSize: item.portionSize,
          customizations: item.customizations || []
        })),
        totalPrice: totalPrice,
        status: 'pending'
      };

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Checkout failed');
      }

      // Success
      alert('Order placed successfully! Enjoy your meal. 😋');
      setCartItems([]);
      setSelectedCategory(null); // Go back to home
      
      // Refresh products to show updated stock if we were to re-fetch
      // For now, just letting the user navigate normally will eventually trigger re-fetch or we could force it.
      
    } catch (err) {
      alert(`Checkout failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.error('Checkout error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Fetch products from Go API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_URL}/products`)
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        setProducts(data || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch products')
        console.error('Error fetching products:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const handleCategorySelect = (category: ProductCategory) => {
    setSelectedCategory(category)
  }

  const handleBackToHome = () => {
    setSelectedCategory(null)
    setShowFeedback(false)
  }

  // const filteredProducts = selectedCategory 
  //   ? products.filter(p => p.category === selectedCategory)
  //   : []   This is inside individual category components!

  // Feedback page
  if (showFeedback) {
    return <Feedback onBack={handleBackToHome} />
  }

  // Admin Dashboard
  if (showAdmin) {
    return <AdminDashboard onClose={() => setShowAdmin(false)} />
  }

  // Landing page
  if (!selectedCategory) {
    return (
      <div className={styles['landing-page']}>
        <SpecialsBanner />
        <button 
          className={styles['admin-toggle']}
          onClick={() => setShowAdmin(true)}
          style={{ position: 'absolute', top: '80px', right: '20px' }}
        >
          ⚙️
        </button>
        <div className={styles['landing-content']}>
          <h1 className={styles['landing-title']}>What do you feel like eating?</h1>
          {loading && <p className={styles['loading-msg']}>Loading menu...</p>}
          {error && (
            <div className={styles['error-container']}>
              <p>Error: {error}</p>
              <p className={styles['error-hint']}>Make sure the Go backend is running on port 8080</p>
            </div>
          )}
          <div className={styles['category-buttons']}>
            <button 
              className={`${styles['category-btn']} ${styles['eastern-btn']}`}
              onClick={() => handleCategorySelect('eastern')}
              disabled={loading || !!error}
            >
              <span className={styles['category-icon']}>🥢</span>
              <span className={styles['category-name']}>Eastern Eats</span>
            </button>
            <button 
              className={`${styles['category-btn']} ${styles['western-btn']}`}
              onClick={() => handleCategorySelect('western')}
              disabled={loading || !!error}
            >
              <span className={styles['category-icon']}>🍔</span>
              <span className={styles['category-name']}>Western Foods</span>
            </button>
            <button 
              className={`${styles['category-btn']} ${styles['feedback-btn']}`}
              onClick={() => setShowFeedback(true)}
            >
              <span className={styles['category-icon']}>💬</span>
              <span className={styles['category-name']}>Feedback</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (selectedCategory === 'eastern') {
    return (
      <EasternCategory 
        products={products}
        cartItems={cartItems}
        onBackToHome={handleBackToHome}
        onAddToCart={addToCart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />
    )
  }

  if (selectedCategory === 'western') {
    return (
      <WesternCategory 
        products={products}
        cartItems={cartItems}
        onBackToHome={handleBackToHome}
        onAddToCart={addToCart}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />
    )
  }

  return null
}

export default App
