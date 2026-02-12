import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, User, Percent, Package, ShoppingCart, BookOpen, Printer, DoorOpen, Wifi, WifiOff, HardDrive, LogOut } from 'lucide-react';
import { useProducts, useCustomers, useCategories } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { saveOfflineTransaction, getOfflineTransactionCount, startBackgroundSync } from '@/lib/offlineDb';
import type { Tables } from '@/integrations/supabase/types';
import PinLogin, { type StaffSession } from '@/components/pos/PinLogin';
import CameraScanner from '@/components/pos/CameraScanner';
import { supabase } from '@/integrations/supabase/client';

type DbProduct = Tables<'products'>;
type DbCustomer = Tables<'customers'>;

interface CartItem {
  product: DbProduct;
  quantity: number;
  discount: number;
}

const POS = () => {
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  const { data: dbProducts = [], isLoading: productsLoading } = useProducts();
  const { data: dbCustomers = [] } = useCustomers();
  const categories = useCategories();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Items');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('Walk-in Customer');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [cartDiscount, setCartDiscount] = useState(0);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showKhat, setShowKhat] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [lastInvoice, setLastInvoice] = useState('');
  const [online, setOnline] = useState(navigator.onLine);
  const [pendingSync, setPendingSync] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  // Online/offline status
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  // Background sync engine
  useEffect(() => {
    const stop = startBackgroundSync(15000);
    return stop;
  }, []);

  // Check pending sync count periodically
  useEffect(() => {
    const check = async () => {
      const count = await getOfflineTransactionCount();
      setPendingSync(count);
    };
    check();
    const id = setInterval(check, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { searchRef.current?.focus(); }, []);

  // Bilingual fuzzy search
  const filteredProducts = useMemo(() => {
    return dbProducts.filter(p => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(q) || 
        (p.barcode && p.barcode.includes(searchQuery)) ||
        (p.name_ar && p.name_ar.includes(searchQuery));
      const matchesCategory = activeCategory === 'All Items' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory, dbProducts]);

  const addToCart = useCallback((product: DbProduct) => {
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
  }, []);

  // Barcode scanner: Enter key instantly adds exact barcode match
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;
      
      const exactMatch = dbProducts.find(p => p.barcode === query);
      if (exactMatch) {
        addToCart(exactMatch);
        setSearchQuery('');
        toast.success(`✓ Scanned: ${exactMatch.name}`, { duration: 1500 });
        return;
      }
      
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearchQuery('');
        toast.success(`✓ Added: ${filteredProducts[0].name}`, { duration: 1500 });
        return;
      }
      
      if (filteredProducts.length === 0) {
        toast.error('No product found for this barcode/search');
      }
    }
  }, [searchQuery, filteredProducts, addToCart, dbProducts]);

  // Camera scan handler — matches barcode or prompts to add new product
  const handleCameraScan = useCallback((barcode: string) => {
    const match = dbProducts.find(p => p.barcode === barcode);
    if (match) {
      addToCart(match);
      toast.success(`✓ Scanned: ${match.name}`, { duration: 1500 });
    } else {
      // Product not found — offer to create
      toast(`Barcode "${barcode}" not found`, {
        description: 'Would you like to add a new product with this barcode?',
        action: {
          label: 'Add Product',
          onClick: () => {
            // Quick-add: create a placeholder product
            supabase
              .from('products')
              .insert({
                name: `New Product (${barcode})`,
                barcode: barcode,
                price: 0,
                cost: 0,
                stock: 0,
                category: 'Uncategorized',
                unit: 'piece',
              })
              .then(({ error }) => {
                if (error) {
                  toast.error('Failed to add product');
                } else {
                  toast.success(`Product created with barcode ${barcode}. Edit it in Products page.`);
                }
              });
          },
        },
        duration: 8000,
      });
    }
  }, [dbProducts, addToCart]);

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        if (newQty > item.product.stock) { toast.error('Not enough stock'); return item; }
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    if (isStaffOnly) {
      toast.error('Staff cannot remove items. Ask a manager to approve.'); 
      return;
    }
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };
  const clearCart = () => { setCart([]); setCartDiscount(0); setSelectedCustomer('Walk-in Customer'); setSelectedCustomerId(null); };

  const subtotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const discountAmount = (subtotal * cartDiscount) / 100;
  const taxAmount = (subtotal - discountAmount) * 0.05;
  const total = subtotal - discountAmount + taxAmount;

  // Hardware placeholders
  const kickDrawer = () => {
    toast.success('🔓 Cash drawer opened', {
      description: 'ESC/POS command 0x1B 0x70 sent to Epson TM-T88VII',
      duration: 2000,
    });
  };

  const printReceipt = () => {
    toast.success('🖨️ Receipt printing...', {
      description: 'Sending to thermal printer via LAN/USB',
      duration: 2000,
    });
  };

  const handleCheckout = async (method: string) => {
    const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}`;
    setLastInvoice(invoiceNo);

    // Save to IndexedDB (offline-first) — will sync to Supabase
    await saveOfflineTransaction({
      id: invoiceNo,
      cart: cart.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        quantity: i.quantity,
        unitPrice: i.product.price,
        cost: i.product.cost,
        total: i.product.price * i.quantity,
        barcode: i.product.barcode || undefined,
      })),
      customer: selectedCustomer,
      customerId: selectedCustomerId || undefined,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total,
      paymentMethod: method,
      invoiceNo,
      createdAt: new Date().toISOString(),
      synced: false,
    });

    if (method === 'Cash') kickDrawer();

    if (method === 'Credit') {
      toast.success(`Credit sale of OMR ${total.toFixed(3)} recorded for ${selectedCustomer}`, {
        description: `Added to Khat ledger • ${invoiceNo}`,
      });
    } else {
      toast.success(`Payment of OMR ${total.toFixed(3)} received via ${method}`, {
        description: `Invoice ${invoiceNo} for ${selectedCustomer}`,
      });
    }
    
    setShowQR(true);
    setTimeout(() => { clearCart(); setShowQR(false); }, 4000);
  };

  // Khat customers — those with debt
  const khatCustomers = dbCustomers.filter(c => c.total_debt > 0);

  // PIN gate
  if (!staffSession) {
    return <PinLogin onLogin={setStaffSession} />;
  }

  const isStaffOnly = staffSession.role === 'staff';
  const handleLogout = () => { setStaffSession(null); clearCart(); };

  if (productsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center space-y-3">
          <Package className="w-12 h-12 mx-auto text-primary animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Products */}
      <div className={cn("flex-1 flex flex-col min-w-0", showKhat && "hidden lg:flex")}>
        {/* Search Bar */}
        <div className="p-4 border-b border-border/50 glass-strong">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Scan barcode or search / البحث عن المنتجات... ⏎"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
            </div>
            <CameraScanner onScan={handleCameraScan} />
            <div className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg glass text-xs font-medium", online ? 'text-success' : 'text-warning')}>
              {online ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {online ? 'Online' : 'Offline'}
              {pendingSync > 0 && (
                <span className="ml-1 flex items-center gap-1 text-warning">
                  <HardDrive className="w-3 h-3" /> {pendingSync}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass text-xs font-medium text-foreground">
              <span className="text-primary">{staffSession.name}</span>
              <button onClick={handleLogout} className="text-muted-foreground hover:text-destructive transition-colors" title="Logout">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 py-3 border-b border-border/50 glass overflow-x-auto">
          <div className="flex gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all',
                  activeCategory === cat
                    ? 'gradient-cyan text-primary-foreground glow-cyan'
                    : 'glass text-secondary-foreground hover:text-foreground'
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
                className="glass-card rounded-xl p-3 text-left hover:glow-cyan transition-all group"
              >
                <div className="w-full aspect-square rounded-lg bg-muted/30 flex items-center justify-center mb-2 relative">
                  <Package className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  {product.stock <= product.min_stock && (
                    <span className="absolute top-1 right-1 text-[8px] px-1.5 py-0.5 rounded bg-destructive text-destructive-foreground font-bold">LOW</span>
                  )}
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-2 leading-tight">{product.name}</p>
                {product.name_ar && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1" dir="rtl">{product.name_ar}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm font-bold text-gold">OMR {product.price.toFixed(3)}</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded', product.stock <= product.min_stock ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success')}>
                    {product.stock}
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

      {/* Digital Khat Sidebar */}
      <AnimatePresence>
        {showKhat && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-l border-border/50 glass-strong flex flex-col overflow-hidden"
          >
            <div className="p-4 border-b border-border/50">
              <h3 className="text-sm font-bold font-heading text-foreground flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Digital Khat (Daftar)
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 pos-scrollbar">
              {khatCustomers.map(c => (
                <div key={c.id} className="glass rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-foreground capitalize">{c.name}</span>
                    <span className={cn(
                      'text-xs font-bold',
                      c.total_debt > 50 ? 'text-destructive' : c.total_debt > 5 ? 'text-warning' : 'text-success'
                    )}>
                      <span className="text-gold">OMR</span> {Number(c.total_debt).toFixed(2)}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className={cn(
                      'h-full rounded-full transition-all',
                      c.total_debt > 50 ? 'debt-gauge-red' : c.total_debt > 5 ? 'debt-gauge-yellow' : 'debt-gauge-green'
                    )} style={{ width: `${Math.min((Number(c.total_debt) / 400) * 100, 100)}%` }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{c.phone || '—'}</span>
                    {c.phone && (
                      <a 
                        href={`https://wa.me/${c.phone.replace('+', '')}?text=${encodeURIComponent(`Hi ${c.name}, this is a friendly reminder from BHAEES POS. Your outstanding balance is OMR ${Number(c.total_debt).toFixed(3)}. Thank you!`)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[10px] text-success hover:underline"
                      >
                        WhatsApp ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
              {khatCustomers.length === 0 && (
                <div className="text-center text-xs text-muted-foreground py-8">No outstanding debts</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right: Cart */}
      <div className="w-[380px] border-l border-border/50 glass-strong flex flex-col">
        {/* Cart Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold font-heading text-foreground">Current Sale</h2>
            <div className="flex items-center gap-2">
              <button onClick={kickDrawer} className="p-1.5 rounded-lg text-muted-foreground hover:text-success hover:bg-success/10 transition-colors" title="Open Cash Drawer (ESC/POS)">
                <DoorOpen className="w-4 h-4" />
              </button>
              <button onClick={printReceipt} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors" title="Print Receipt (Epson TM-T88VII)">
                <Printer className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setShowKhat(!showKhat)}
                className={cn('p-1.5 rounded-lg transition-colors', showKhat ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground')}
                title="Digital Khat"
              >
                <BookOpen className="w-4 h-4" />
              </button>
              {cart.length > 0 && (
                <button onClick={clearCart} className="text-xs text-destructive hover:underline">Clear</button>
              )}
            </div>
          </div>
          <button
            onClick={() => setShowCustomerPicker(!showCustomerPicker)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg glass border border-input text-sm text-foreground hover:bg-muted/30 transition-colors"
          >
            <User className="w-4 h-4 text-muted-foreground" />
            <span>{selectedCustomer}</span>
          </button>
          <AnimatePresence>
            {showCustomerPicker && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-2">
                <div className="glass rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto pos-scrollbar">
                  <button onClick={() => { setSelectedCustomer('Walk-in Customer'); setSelectedCustomerId(null); setShowCustomerPicker(false); }} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/50 transition-colors text-foreground">Walk-in Customer</button>
                  {dbCustomers.map(c => (
                    <button key={c.id} onClick={() => { setSelectedCustomer(c.name); setSelectedCustomerId(c.id); setShowCustomerPicker(false); }} className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-muted/50 transition-colors text-foreground">{c.name} — {c.phone || '—'}</button>
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
              <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Scan a barcode or tap a product</p>
            </div>
          ) : (
            cart.map(item => (
              <motion.div key={item.product.id} layout initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 p-3 rounded-lg glass">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{item.product.name}</p>
                  <p className="text-xs text-muted-foreground"><span className="text-gold">OMR</span> {item.product.price.toFixed(3)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => updateQuantity(item.product.id, -1)} className="w-6 h-6 rounded glass flex items-center justify-center hover:bg-primary/10 transition-colors">
                    <Minus className="w-3 h-3 text-foreground" />
                  </button>
                  <span className="w-7 text-center text-xs font-semibold text-foreground">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, 1)} className="w-6 h-6 rounded glass flex items-center justify-center hover:bg-primary/10 transition-colors">
                    <Plus className="w-3 h-3 text-foreground" />
                  </button>
                </div>
                <p className="text-xs font-bold text-gold w-16 text-right">OMR {(item.product.price * item.quantity).toFixed(3)}</p>
                <button onClick={() => removeFromCart(item.product.id)} className="text-destructive/60 hover:text-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </div>

        {/* QR Code Display */}
        <AnimatePresence>
          {showQR && lastInvoice && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="p-4 border-t border-border/50 text-center">
              <p className="text-xs text-muted-foreground mb-2">OTA-Compliant VAT Receipt QR</p>
              <div className="inline-block p-3 rounded-lg bg-foreground">
                <QRCodeSVG
                  value={JSON.stringify({ seller: 'BHAEES POS', vat: 'OM1234567890', invoice: lastInvoice, total: total.toFixed(3), date: new Date().toISOString() })}
                  size={120}
                  bgColor="hsl(180, 100%, 95%)"
                  fgColor="hsl(0, 0%, 2%)"
                />
              </div>
              <p className="text-[10px] text-primary mt-2 font-mono">{lastInvoice}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart Summary */}
        {cart.length > 0 && !showQR && (
          <div className="border-t border-border/50 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <input
                type="number"
                placeholder="Discount %"
                value={cartDiscount || ''}
                onChange={(e) => {
                  if (isStaffOnly) { toast.error('Staff cannot change discount'); return; }
                  setCartDiscount(Number(e.target.value));
                }}
                disabled={isStaffOnly}
                className="flex-1 px-2 py-1.5 rounded glass text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                min={0} max={100}
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span><span className="text-gold">OMR</span> {subtotal.toFixed(3)}</span>
              </div>
              {cartDiscount > 0 && (
                <div className="flex justify-between text-success">
                  <span>Discount ({cartDiscount}%)</span>
                  <span>-OMR {discountAmount.toFixed(3)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>VAT (5%)</span>
                <span>OMR {taxAmount.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-foreground pt-2 border-t border-border/50">
                <span>Total</span>
                <span className="text-gold text-glow">OMR {total.toFixed(3)}</span>
              </div>
            </div>

            {/* Payment Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => handleCheckout('Cash')} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-success text-success-foreground hover:opacity-90 transition-opacity font-medium text-xs">
                <Banknote className="w-4 h-4" /> Cash
              </button>
              <button onClick={() => handleCheckout('Card')} className="flex items-center justify-center gap-2 py-3 rounded-lg gradient-cyan text-primary-foreground hover:opacity-90 transition-opacity font-medium text-xs glow-cyan">
                <CreditCard className="w-4 h-4" /> Card
              </button>
              <button onClick={() => handleCheckout('Digital')} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-info text-info-foreground hover:opacity-90 transition-opacity font-medium text-xs">
                <Smartphone className="w-4 h-4" /> Digital
              </button>
              <button onClick={() => handleCheckout('Credit')} className="flex items-center justify-center gap-2 py-3 rounded-lg bg-warning text-warning-foreground hover:opacity-90 transition-opacity font-medium text-xs">
                <BookOpen className="w-4 h-4" /> Credit
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;
