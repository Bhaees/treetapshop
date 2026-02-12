import { useState, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, X, User, Percent, Receipt, Package, ShoppingCart } from 'lucide-react';
import { products, categories, type Product, type CartItem, customers } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const POS = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Walk-in Customer');
  const [cartDiscount, setCartDiscount] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
      const matchesCategory = activeCategory === 'All Items' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error('Not enough stock');
          return prev;
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1, discount: 0 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.product.stock) {
          toast.error('Not enough stock');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCartDiscount(0);
    setSelectedCustomer('Walk-in Customer');
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = (subtotal * cartDiscount) / 100;
  const taxAmount = (subtotal - discountAmount) * 0.05;
  const total = subtotal - discountAmount + taxAmount;

  const handleCheckout = (method: string) => {
    toast.success(`Payment of AED ${total.toFixed(2)} received via ${method}`, {
      description: `Invoice generated for ${selectedCustomer}`,
    });
    clearCart();
    setShowCheckout(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Product Selection */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Search Bar */}
        <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 py-3 border-b border-border bg-card overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  activeCategory === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary text-secondary-foreground hover:bg-muted'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-4 pos-scrollbar">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {filteredProducts.map(product => (
              <motion.button
                key={product.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => addToCart(product)}
                className="bg-card rounded-xl border border-border p-3 text-left hover:border-primary/50 hover:shadow-md transition-all group"
              >
                <div className="w-full aspect-square rounded-lg bg-muted flex items-center justify-center mb-2">
                  <Package className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <p className="text-xs font-medium text-card-foreground line-clamp-2 leading-tight">{product.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-primary">AED {product.price.toFixed(2)}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', product.stock <= product.minStock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
                    {product.stock} in stock
                  </span>
                </div>
              </motion.button>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No products found</div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-[380px] border-l border-border bg-card flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-card-foreground">Current Sale</h2>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-destructive hover:underline">Clear All</button>
            )}
          </div>
          <button
            onClick={() => setShowCustomerPicker(!showCustomerPicker)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-background border border-input text-sm text-foreground hover:bg-muted transition-colors"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{selectedCustomer}</span>
          </button>
          <AnimatePresence>
            {showCustomerPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-2"
              >
                <div className="bg-background rounded-lg border border-input p-2 space-y-1 max-h-32 overflow-y-auto pos-scrollbar">
                  <button onClick={() => { setSelectedCustomer('Walk-in Customer'); setShowCustomerPicker(false); }} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors text-foreground">Walk-in Customer</button>
                  {customers.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCustomer(c.name); setShowCustomerPicker(false); }} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted transition-colors text-foreground">{c.name} — {c.phone}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 pos-scrollbar">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Add products to start a sale</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground">AED {item.product.price.toFixed(2)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors">
                    <Minus className="w-3 h-3 text-foreground" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold text-foreground">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 rounded bg-muted flex items-center justify-center hover:bg-border transition-colors">
                    <Plus className="w-3 h-3 text-foreground" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-foreground">AED {(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onClick={() => removeFromCart(item.product.id)} className="text-destructive/60 hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="border-t border-border p-4 space-y-3">
            {/* Discount */}
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                placeholder="Discount %"
                value={cartDiscount || ''}
                onChange={(e) => setCartDiscount(Number(e.target.value))}
                className="flex-1 px-2 py-1.5 rounded bg-background border border-input text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                min={0}
                max={100}
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span>AED {subtotal.toFixed(2)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount ({cartDiscount}%)</span>
                  <span>-AED {discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>VAT (5%)</span>
                <span>AED {taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-card-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span>AED {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button onClick={() => handleCheckout('Cash')} className="flex flex-col items-center gap-1 py-3 rounded-lg bg-success text-success-foreground hover:opacity-90 transition-opacity">
                <Banknote className="w-5 h-5" />
                <span className="text-[10px] font-medium">Cash</span>
              </button>
              <button onClick={() => handleCheckout('Card')} className="flex flex-col items-center gap-1 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                <CreditCard className="w-5 h-5" />
                <span className="text-[10px] font-medium">Card</span>
              </button>
              <button onClick={() => handleCheckout('Digital')} className="flex flex-col items-center gap-1 py-3 rounded-lg bg-info text-info-foreground hover:opacity-90 transition-opacity">
                <Smartphone className="w-5 h-5" />
                <span className="text-[10px] font-medium">Digital</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;
