import { useState } from 'react'
import type { 
  Product, 
  CartItem, 
  CustomizationOption 
} from '../types'
import SpecialsBanner from './SpecialsBanner'
import Cart from './Cart'
import styles from '../App.module.css'

interface WesternCategoryProps {
  products: Product[]
  cartItems: CartItem[]
  onBackToHome: () => void
  onAddToCart: (
    product: Product, 
    portion: string, 
    customizations: CustomizationOption[]
  ) => void
  onUpdateQuantity: (index: number, change: number) => void
  onRemoveItem: (index: number) => void
  onCheckout: () => void
}

function WesternCategory({
  products,
  cartItems,
  onBackToHome,
  onAddToCart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: WesternCategoryProps) {
  const [selectedProduct, setSelectedProduct] = 
    useState<Product | null>(null)
  const [portionSize, setPortionSize] = useState<string>('Medium')
  const [selectedCustomizations, setSelectedCustomizations] = 
    useState<CustomizationOption[]>([])
  const [showCart, setShowCart] = useState(false)

  const westernProducts = products.filter(p => p.category === 'western')

  return (
    <div 
      className={`${styles['category-page']} 
        ${styles['western-theme']}`}
    >
      <SpecialsBanner />
      <header className={styles['category-header']}>
        <h1 className={styles['category-title']}>
          🍔 Western Foods
        </h1>
        <button 
          className={styles['cart-toggle-btn']} 
          onClick={() => setShowCart(true)}
        >
          🛒 Cart ({cartItems.reduce(
            (sum, item) => sum + item.quantity, 0
          )})
        </button>
        <button 
          className={styles['back-btn']} 
          onClick={onBackToHome}
        >
          Back →
        </button>
      </header>
      
      <div className={styles['products-grid']}>
        {westernProducts.map(product => (
          <div 
            key={product.id} 
            className={styles['product-card']}
            onClick={() => {
              setSelectedProduct(product)
              setPortionSize('Medium')
            }}
          >
            {product.image && (
              <div className={styles['product-image']}>
                <img src={product.image} alt={product.name} />
                {product.imageAttribution && (
                  <div className={styles['card-attribution']}>
                    Photo: <a 
                      href={product.imageAttribution.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      onClick={(e) => e.stopPropagation()}
                    >
                      {product.imageAttribution.photographer}
                    </a>
                  </div>
                )}
              </div>
            )}
            <div className={styles['product-info']}>
              <h3 className={styles['product-name']}>
                {product.name}
              </h3>
              <p className={styles['product-description']}>
                {product.description}
              </p>
              <p className={styles['product-price']}>
                ${product.price.toFixed(2)}
              </p>
            </div>
            <div className={styles['product-card-actions']}>
              <button 
                className={styles['customize-btn']} 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedProduct(product);
                  setPortionSize('Medium');
                  setSelectedCustomizations([]);
                }}
              >
                Customize
              </button>
              <button 
                className={styles['add-to-cart-btn']} 
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToCart(product, 'Medium', []);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {showCart && (
        <Cart 
          cartItems={cartItems}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
          onClose={() => setShowCart(false)}
          onCheckout={onCheckout}
        />
      )}
      
      {selectedProduct && (
        <div 
          className={styles['modal-overlay']} 
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className={styles['modal-content']} 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className={styles['modal-close']} 
              onClick={() => setSelectedProduct(null)}
            >
              <span>×</span>
            </button>
            
            {selectedProduct.image && (
              <div className={styles['modal-image']}>
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                />
                {selectedProduct.imageAttribution && (
                  <div className={styles['image-attribution']}>
                    Photo by <a 
                      href={selectedProduct.imageAttribution.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {selectedProduct.imageAttribution.photographer}
                    </a> on {selectedProduct.imageAttribution.source}
                  </div>
                )}
              </div>
            )}
            
            <div className={styles['modal-header']}>
              <div className={styles['header-left']}>
                <h2 className={styles['modal-title']}>
                  {selectedProduct.name}
                </h2>
                <p className={styles['modal-price']}>
                  ${(selectedProduct.price + 
                    selectedCustomizations.reduce(
                      (sum, opt) => sum + opt.price, 0
                    )).toFixed(2)}
                </p>
              </div>
              
              <div className={styles['header-controls']}>
                <div className={styles['portion-selector']}>
                  <label 
                    htmlFor="portion-size" 
                    className={styles['portion-label']}
                  >
                    Portion Size: 
                  </label>
                  <select 
                    id="portion-size" 
                    value={portionSize} 
                    onChange={(e) => setPortionSize(e.target.value)}
                    className={styles['portion-select']}
                  >
                    <option value="Small">Small</option>
                    <option value="Medium">Medium</option>
                    <option value="Big">Big</option>
                  </select>
                </div>

                <div className={styles['customization-selector']}>
                  <label className={styles['portion-label']}>
                    Customizations: 
                  </label>
                  <div className={styles['customization-options']}>
                    <label className={styles['custom-option']}>
                      <input 
                        type="checkbox" 
                        checked={selectedCustomizations.some(
                          c => c.id === 'extra-spicy'
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomizations(prev => [
                              ...prev, 
                              { 
                                id: 'extra-spicy', 
                                name: 'Extra Spicy', 
                                price: 1 
                              }
                            ])
                          } else {
                            setSelectedCustomizations(prev => 
                              prev.filter(
                                c => c.id !== 'extra-spicy'
                              )
                            )
                          }
                        }}
                      /> Extra Spicy (+$1)
                    </label>
                    <label className={styles['custom-option']}>
                      <input 
                        type="checkbox" 
                        checked={selectedCustomizations.some(
                          c => c.id === 'extra-cheese'
                        )}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedCustomizations(prev => [
                              ...prev, 
                              { 
                                id: 'extra-cheese', 
                                name: 'Extra Cheese', 
                                price: 3 
                              }
                            ])
                          } else {
                            setSelectedCustomizations(prev => 
                              prev.filter(
                                c => c.id !== 'extra-cheese'
                              )
                            )
                          }
                        }}
                      /> Extra Cheese (+$3)
                    </label>
                  </div>
                </div>

                <button 
                  className={styles['modal-add-to-cart-btn']} 
                  onClick={() => {
                    onAddToCart(
                      selectedProduct, 
                      portionSize, 
                      selectedCustomizations
                    );
                    setSelectedProduct(null);
                    setSelectedCustomizations([]);
                  }}
                >
                  Add to Cart
                </button>
              </div>
            </div>
            
            <div className={styles['modal-body']}>
              {selectedProduct.detailedDescription && (
                <div className={styles['detailed-description']}>
                  {selectedProduct.detailedDescription.split('\n')
                    .map((line, i) => (
                      <p 
                        key={i} 
                        className={styles['description-paragraph']}
                      >
                        {line || <br />}
                      </p>
                    ))}
                </div>
              )}
              
              <div className={styles['reviews-section']}>
                <h3 className={styles['reviews-title']}>
                  Customer Reviews
                </h3>
                {selectedProduct.reviews && 
                  selectedProduct.reviews.length > 0 ? (
                  <div className={styles['reviews-list']}>
                    {selectedProduct.reviews.map(review => (
                      <div 
                        key={review.id} 
                        className={styles['review-card']}
                      >
                        <div className={styles['review-header']}>
                          <span className={styles['review-user']}>
                            {review.userName}
                          </span>
                          <span className={styles['review-rating']}>
                            {'⭐'.repeat(review.rating)}
                          </span>
                        </div>
                        <p className={styles['review-comment']}>
                          {review.comment}
                        </p>
                        <span className={styles['review-date']}>
                          {new Date(review.date)
                            .toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles['no-reviews']}>
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WesternCategory
