import React from 'react';
import type { CartProps } from '../types';
import styles from './Cart.module.css';

const Cart: React.FC<CartProps & { onClose: () => void }> = ({ cartItems, onUpdateQuantity, onRemoveItem, onClose,
     onCheckout }) => {
    const total = cartItems.reduce((sum, item) => {
        const customizationsCost = item.customizations?.reduce((cSum, opt) => cSum + opt.price, 0) || 0;
        return sum + ((item.product.price + customizationsCost) * item.quantity);
    }, 0);

    return (
        <div className={styles['modal-overlay']} onClick={onClose}>
            <div className={`${styles['modal-content']} ${styles['cart-modal']}`} onClick={e => e.stopPropagation()}>
                <div className={styles['cart-header']}>
                    <h2 className={styles['modal-title']}>Your Cart</h2>
                    <button className={styles['modal-close']} onClick={onClose}><span>×</span></button>
                </div>

                <div className={styles['cart-items']}>
                    {cartItems.length === 0 ? (
                        <p className={styles['empty-cart-msg']}>Your cart is empty. Add some delicious food!</p>
                    ) : (
                        cartItems.map((item, index) => (
                            <div key={`${item.product.id}-${item.portionSize}-${index}`} className={styles['cart-item']}>
                                <div className={styles['cart-item-image']}>
                                    {item.product.image && <img src={item.product.image} alt={item.product.name} />}
                                </div>
                                <div className={styles['cart-item-details']}>
                                    <h3 className={styles['cart-item-name']}>{item.product.name}</h3>
                                    <p className={styles['cart-item-portion']}>Size: {item.portionSize}</p>
                                    {item.customizations && item.customizations.length > 0 && (
                                        <div className={styles['cart-item-customizations']}>
                                            {item.customizations.map(c => (
                                                <span key={c.id} className={styles['cart-custom-badge']}>
                                                    +{c.name} (${c.price})
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                    <p className={styles['cart-item-price']}>
                                        ${(item.product.price + (item.customizations?.reduce((sum, c) => sum + c.price, 0) || 0)).toFixed(2)}
                                    </p>
                                </div>
                                <div className={styles['cart-item-controls']}>
                                    <div className={styles['quantity-controls']}>
                                        <button 
                                            className={styles['qty-btn']}
                                            onClick={() => onUpdateQuantity(index, -1)}
                                            disabled={item.quantity <= 1}
                                        >-</button>
                                        <span className={styles['qty-display']}>{item.quantity}</span>
                                        <button 
                                            className={styles['qty-btn']}
                                            onClick={() => onUpdateQuantity(index, 1)}
                                        >+</button>
                                    </div>
                                    <button 
                                        className={styles['remove-btn']}
                                        onClick={() => onRemoveItem(index)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className={styles['cart-footer']}>
                    <div className={styles['cart-total']}>
                        <span>Total:</span>
                        <span className={styles['total-amount']}>${total.toFixed(2)}</span>
                    </div>
                    <button 
                        className={styles['checkout-btn']}
                        disabled={cartItems.length === 0}
                        onClick={onCheckout}
                    >
                        Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Cart;
