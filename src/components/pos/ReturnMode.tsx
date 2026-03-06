import { useState, useCallback } from 'react';
import { Search, RotateCcw, Check, X, Package, ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ReceiptPreview, { type ReceiptData } from './ReceiptPreview';

interface ReturnModeProps {
  open: boolean;
  onClose: () => void;
  cashierName: string;
}

interface TransactionItem {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  cost: number;
  discount: number;
  total: number;
  barcode: string | null;
}

interface Transaction {
  id: string;
  invoice_no: string;
  customer_name: string;
  cashier: string | null;
  payment_type: string;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  status: string;
  created_at: string;
  transaction_items: TransactionItem[];
}

const ReturnMode = ({ open, onClose, cashierName }: ReturnModeProps) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundTransaction, setFoundTransaction] = useState<Transaction | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [returnReason, setReturnReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [returnComplete, setReturnComplete] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const searchInvoice = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    setFoundTransaction(null);
    setSelectedItems({});

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*, transaction_items(*)')
        .or(`invoice_no.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast.error('No transaction found with that invoice number');
        setSearching(false);
        return;
      }
      if (data.status === 'refunded') {
        toast.error('This transaction has already been fully refunded');
        setSearching(false);
        return;
      }

      setFoundTransaction({
        ...data,
        subtotal: Number(data.subtotal),
        discount: Number(data.discount),
        vat: Number(data.vat),
        total: Number(data.total),
        transaction_items: (data.transaction_items || []).map((i: any) => ({
          ...i,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
          cost: Number(i.cost),
          discount: Number(i.discount),
          total: Number(i.total),
        })),
      });
    } catch (err: any) {
      toast.error('Search failed: ' + err.message);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId] !== undefined) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  const updateReturnQty = (itemId: string, qty: number) => {
    const item = foundTransaction?.transaction_items.find(i => i.id === itemId);
    const max = item?.quantity || 1;
    setSelectedItems(prev => ({ ...prev, [itemId]: Math.max(0, Math.min(qty, max)) }));
  };

  const selectAll = () => {
    if (!foundTransaction) return;
    const all: Record<string, number> = {};
    foundTransaction.transaction_items.forEach(i => { all[i.id] = i.quantity; });
    setSelectedItems(all);
  };

  const refundTotal = foundTransaction
    ? foundTransaction.transaction_items.reduce((sum, item) => {
        const qty = selectedItems[item.id] || 0;
        return sum + (item.unit_price * qty);
      }, 0)
    : 0;

  const handleProcessReturn = async () => {
    if (!foundTransaction || Object.keys(selectedItems).length === 0) {
      toast.error('Select items to return');
      return;
    }
    setProcessing(true);

    try {
      const items = foundTransaction.transaction_items;
      const isFullRefund = items.every(item => (selectedItems[item.id] || 0) >= item.quantity);

      // Update transaction status
      await supabase.from('transactions').update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
      }).eq('id', foundTransaction.id);

      // Restock items
      const itemsToRestock = Object.entries(selectedItems)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, qty]) => {
          const item = items.find(i => i.id === itemId);
          return { productId: item?.product_id, qty, name: item?.product_name || '' };
        });

      for (const { productId, qty } of itemsToRestock) {
        if (productId) {
          const { data: product } = await supabase
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();
          if (product) {
            await supabase
              .from('products')
              .update({ stock: product.stock + qty })
              .eq('id', productId);
          }
        }
      }

      // Build return receipt
      const returnReceiptData: ReceiptData = {
        invoiceNo: `RTN-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toLocaleString(),
        cashier: cashierName,
        customer: foundTransaction.customer_name,
        items: itemsToRestock.map(i => {
          const origItem = items.find(it => it.product_id === i.productId || it.product_name === i.name);
          return {
            name: `↩ ${i.name}`,
            quantity: i.qty,
            price: origItem?.unit_price || 0,
            discount: 0,
            total: -(origItem?.unit_price || 0) * i.qty,
          };
        }),
        subtotal: -refundTotal,
        discount: 0,
        vat: -(refundTotal * 0.05),
        total: -(refundTotal * 1.05),
        paymentMethod: `Refund (${foundTransaction.payment_type})`,
      };
      setReceiptData(returnReceiptData);

      toast.success(`Return of OMR ${refundTotal.toFixed(3)} processed`, {
        description: isFullRefund
          ? `Full refund — ${itemsToRestock.length} item(s) restocked`
          : `Partial refund — ${itemsToRestock.length} item(s) restocked`,
      });

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setReturnComplete(true);
      setShowReceipt(true);
    } catch (err: any) {
      toast.error('Return failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const resetAll = () => {
    setSearchQuery('');
    setFoundTransaction(null);
    setSelectedItems({});
    setReturnReason('');
    setReturnComplete(false);
    setReceiptData(null);
  };

  if (!open) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/30 transition-colors text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-bold font-heading text-foreground">Return / Refund Mode</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-destructive/20 text-destructive text-xs font-bold uppercase tracking-wider animate-pulse">
              Return Mode Active
            </span>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-destructive/20 transition-colors text-destructive">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Search Invoice */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">Search Original Invoice</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter invoice number (e.g. INV-ABC123)..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && searchInvoice()}
                    className="w-full pl-10 pr-4 py-3 rounded-lg glass border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-destructive/50"
                    autoFocus
                  />
                </div>
                <button
                  onClick={searchInvoice}
                  disabled={searching || !searchQuery.trim()}
                  className="px-5 py-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                  {searching ? 'Searching...' : 'Find'}
                </button>
              </div>
            </div>

            {/* Found Transaction */}
            <AnimatePresence mode="wait">
              {foundTransaction && !returnComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  {/* Transaction Summary */}
                  <div className="glass-card rounded-xl p-4 space-y-2 border border-border/50">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary font-mono">{foundTransaction.invoice_no}</span>
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium',
                        foundTransaction.status === 'paid' && 'bg-success/20 text-success',
                        foundTransaction.status === 'partially_refunded' && 'bg-warning/20 text-warning',
                      )}>
                        {foundTransaction.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-muted-foreground">
                      <div>Customer: <span className="text-foreground">{foundTransaction.customer_name}</span></div>
                      <div>Date: <span className="text-foreground">{new Date(foundTransaction.created_at).toLocaleDateString()}</span></div>
                      <div>Payment: <span className="text-foreground capitalize">{foundTransaction.payment_type}</span></div>
                      <div>Total: <span className="text-gold font-semibold">OMR {foundTransaction.total.toFixed(3)}</span></div>
                    </div>
                  </div>

                  {/* Select Items to Return */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-foreground">Select Items to Return</label>
                      <button onClick={selectAll} className="text-xs text-primary hover:underline">Select All</button>
                    </div>
                    <div className="space-y-2">
                      {foundTransaction.transaction_items.map(item => {
                        const isSelected = selectedItems[item.id] !== undefined;
                        const returnQty = selectedItems[item.id] || 0;
                        return (
                          <motion.div
                            key={item.id}
                            layout
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                              isSelected
                                ? 'border-destructive/40 bg-destructive/5 ring-1 ring-destructive/20'
                                : 'border-border/50 glass hover:bg-muted/20'
                            )}
                            onClick={() => toggleItem(item.id, item.quantity)}
                          >
                            <div className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0',
                              isSelected ? 'border-destructive bg-destructive text-destructive-foreground' : 'border-muted-foreground/30'
                            )}>
                              {isSelected && <Check className="w-3 h-3" />}
                            </div>
                            <Package className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                OMR {item.unit_price.toFixed(3)} × {item.quantity} = OMR {item.total.toFixed(3)}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                <label className="text-[10px] text-muted-foreground">Qty:</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={item.quantity}
                                  value={returnQty}
                                  onChange={e => updateReturnQty(item.id, Number(e.target.value))}
                                  className="w-14 text-center text-xs border border-destructive/30 rounded px-1.5 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-destructive/50"
                                />
                                <span className="text-[10px] text-muted-foreground">/ {item.quantity}</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reason */}
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Return Reason (optional)</label>
                    <input
                      value={returnReason}
                      onChange={e => setReturnReason(e.target.value)}
                      placeholder="e.g. Damaged, wrong item, customer changed mind..."
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  {/* Refund Amount */}
                  {Object.keys(selectedItems).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4 rounded-xl bg-destructive/10 border border-destructive/20"
                    >
                      <p className="text-xs text-destructive font-medium">Refund Amount</p>
                      <p className="text-3xl font-bold text-destructive mt-1">OMR {refundTotal.toFixed(3)}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {Object.keys(selectedItems).length} item(s) · Stock will be restocked automatically
                      </p>
                    </motion.div>
                  )}

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-warning">
                      This action cannot be undone. The refund will be recorded and stock will be restocked.
                    </p>
                  </div>

                  {/* Process Button */}
                  <button
                    onClick={handleProcessReturn}
                    disabled={processing || refundTotal <= 0}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {processing ? 'Processing Return...' : `Process Return — OMR ${refundTotal.toFixed(3)}`}
                  </button>
                </motion.div>
              )}

              {/* Return Complete */}
              {returnComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12 space-y-4"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto"
                  >
                    <Check className="w-8 h-8 text-success" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-foreground">Return Processed Successfully</h3>
                  <p className="text-sm text-muted-foreground">OMR {refundTotal.toFixed(3)} refunded · Stock restocked</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      onClick={() => setShowReceipt(true)}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      View Return Receipt
                    </button>
                    <button
                      onClick={resetAll}
                      className="px-4 py-2 rounded-lg glass border border-input text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
                    >
                      Process Another Return
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 rounded-lg glass border border-input text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Back to POS
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Return Receipt */}
      <ReceiptPreview open={showReceipt} onOpenChange={setShowReceipt} receipt={receiptData} />
    </>
  );
};

export default ReturnMode;
