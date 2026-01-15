import { useState, useEffect } from 'react'
import type { Feedback as FeedbackType, Product } from '../types'
import styles from './Feedback.module.css'
import { env } from '../env.ts'

const API_URL = env.REACT_APP_API_URL

export default function Feedback({ onBack }: { onBack: () => void }) {
  const [feedback, setFeedback] = useState<FeedbackType>({
    name: '',
    email: '',
    rating: 0,
    comment: '',
    productId: undefined,
    productName: ''
  })
  const [hoveredStar, setHoveredStar] = useState(0)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [products, setProducts] = useState<Product[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  // Fetch products for the dropdown
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data)
        }
      } catch (err) {
        console.error('Error fetching products:', err)
      } finally {
        setLoadingProducts(false)
      }
    }
    fetchProducts()
  }, [])

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitStatus('submitting')
    
    try {
      const response = await fetch(`${API_URL}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      })
      
      if (!response.ok) {
        throw new Error('Failed to submit feedback')
      }
      
      setSubmitStatus('success')
      // Reset form after 2 seconds
      setTimeout(() => {
        setFeedback({ name: '', email: '', rating: 0, comment: '',
             productId: undefined, productName: '' })
        setSubmitStatus('idle')
      }, 2000)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 3000)
    }
  }

  const StarRating = () => {
    return (
      <div className={styles['star-rating']}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`${styles['star-btn']} ${
              star <= (hoveredStar || feedback.rating) ? styles.active : ''
            }`}
            onClick={() => setFeedback({ ...feedback, rating: star })}
            onMouseEnter={() => setHoveredStar(star)}
            onMouseLeave={() => setHoveredStar(0)}
          >
            ⭐
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className={`${styles['category-page']} ${styles['eastern-theme']}`}>
      <header className={styles['category-header']}>
        <h1 className={styles['category-title']}>💬 Feedback</h1>
        <button className={styles['back-btn']} onClick={onBack}>
          Back →
        </button>
      </header>
      
      <div className={styles['feedback-container']}>
        <div className={styles['feedback-card']}>
          <div className={styles['feedback-icon']}>💬</div>
          <h2 className={styles['feedback-subtitle']}>We'd love to hear from you!</h2>
          <p className={styles['feedback-description']}>
            Your feedback helps us improve our service and provide you with the best experience.
          </p>
          
          <form onSubmit={handleFeedbackSubmit} className={styles['feedback-form']}>
            <div className={styles['form-group']}>
              <label htmlFor="product" className={styles['form-label']}>Which dish are you reviewing? (Optional)</label>
              <select
                id="product"
                className={styles['form-select']}
                value={feedback.productId || ''}
                onChange={(e) => {
                  const productId = e.target.value ? parseInt(e.target.value) : undefined
                  const product = products.find(p => p.id === productId)
                  setFeedback({ 
                    ...feedback, 
                    productId, 
                    productName: product?.name || '' 
                  })
                }}
                disabled={loadingProducts}
              >
                <option value="">General Feedback (No specific dish)</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {product.category === 'eastern' ? '🥢 Eastern' : '🍔 Western'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles['form-group']}>
              <label htmlFor="name" className={styles['form-label']}>Name *</label>
              <input
                type="text"
                id="name"
                className={styles['form-input']}
                value={feedback.name}
                onChange={(e) => setFeedback({ ...feedback, name: e.target.value })}
                required
                placeholder="Enter your name"
              />
            </div>
            
            <div className={styles['form-group']}>
              <label htmlFor="email" className={styles['form-label']}>Email *</label>
              <input
                type="email"
                id="email"
                className={styles['form-input']}
                value={feedback.email}
                onChange={(e) => setFeedback({ ...feedback, email: e.target.value })}
                required
                placeholder="Enter your email"
              />
            </div>
            
            <div className={styles['form-group']}>
              <label className={styles['form-label']}>Rating *</label>
              <StarRating />
              {feedback.rating === 0 && submitStatus === 'idle' && (
                <p className={styles['rating-hint']}>Please select a rating</p>
              )}
            </div>
            
            <div className={styles['form-group']}>
              <label htmlFor="comment" className={styles['form-label']}>Your Feedback *</label>
              <textarea
                id="comment"
                className={styles['form-textarea']}
                value={feedback.comment}
                onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
                required
                placeholder="Tell us about your experience..."
                rows={5}
              />
            </div>
            
            <button 
              type="submit" 
              className={styles['submit-feedback-btn']}
              disabled={submitStatus === 'submitting' || feedback.rating === 0}
            >
              {submitStatus === 'submitting' && 'Submitting...'}
              {submitStatus === 'success' && '✓ Submitted!'}
              {submitStatus === 'error' && 'Error - Try Again'}
              {submitStatus === 'idle' && 'Submit Feedback'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
