import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface RefundDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
}

const RefundDialog = ({ open, onOpenChange, sale }: RefundDialogProps) => {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [refundReason, setRefundReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');

  if (!sale) return null;
  const items = sale.transaction_items || [];

  const toggleItem = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: maxQty };
    });
  };

  const updateRefundQty = (itemId: string, qty: number) => {
    setSelectedItems(prev => ({ ...prev, [itemId]: Math.max(0, qty) }));
  };

  const refundTotal = refundType === 'full'
    ? Number(sale.total)
    : items.reduce((sum: number, item: any) => {
        const qty = selectedItems[item.id] || 0;
        return sum + (Number(item.unit_price) * qty);
      }, 0);

  const handleRefund = async () => {
    if (refundType === 'partial' && Object.keys(selectedItems).length === 0) {
      toast.error('Select items to refund');
      return;
    }
    setProcessing(true);

    try {
      // Update transaction status
      const isFullRefund = refundType === 'full' || 
        items.every((item: any) => (selectedItems[item.id] || 0) >= Number(item.quantity));

      await supabase.from('transactions').update({
        status: isFullRefund ? 'refunded' : 'partially_refunded',
      }).eq('id', sale.id);

      // Restock items
      const itemsToRestock = refundType === 'full'
        ? items.map((i: any) => ({ productId: i.product_id, qty: Number(i.quantity) }))
        : Object.entries(selectedItems)
            .filter(([, qty]) => qty > 0)
            .map(([itemId, qty]) => {
              const item = items.find((i: any) => i.id === itemId);
              return { productId: item?.product_id, qty };
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

      toast.success(`Refund of OMR ${refundTotal.toFixed(3)} processed`, {
        description: isFullRefund ? 'Full refund — stock restocked' : 'Partial refund — selected items restocked',
      });

      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      onOpenChange(false);
      setSelectedItems({});
      setRefundReason('');
    } catch (err: any) {
      toast.error('Refund failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <RotateCcw className="w-4 h-4" /> Process Refund
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Invoice: <span className="font-mono text-primary">{sale.invoice_no}</span> · Total: OMR {Number(sale.total).toFixed(3)}
          </div>

          {/* Refund type */}
          <div className="flex gap-2">
            <button
              onClick={() => setRefundType('full')}
              className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                refundType === 'full' ? 'bg-destructive/20 text-destructive border-destructive/30' : 'bg-muted/20 text-muted-foreground border-border'
              )}
            >
              Full Refund
            </button>
            <button
              onClick={() => setRefundType('partial')}
              className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                refundType === 'partial' ? 'bg-warning/20 text-warning border-warning/30' : 'bg-muted/20 text-muted-foreground border-border'
              )}
            >
              Partial Refund
            </button>
          </div>

          {/* Item selection for partial */}
          {refundType === 'partial' && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {items.map((item: any) => (
                <div
                  key={item.id}
                  className={cn('flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors',
                    selectedItems[item.id] ? 'border-destructive/30 bg-destructive/5' : 'border-border hover:bg-muted/20'
                  )}
                  onClick={() => toggleItem(item.id, Number(item.quantity))}
                >
                  <input
                    type="checkbox"
                    checked={!!selectedItems[item.id]}
                    readOnly
                    className="accent-destructive"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{item.product_name}</p>
                    <p className="text-[10px] text-muted-foreground">OMR {Number(item.unit_price).toFixed(3)} × {Number(item.quantity)}</p>
                  </div>
                  {selectedItems[item.id] !== undefined && (
                    <input
                      type="number"
                      min={0}
                      max={Number(item.quantity)}
                      value={selectedItems[item.id]}
                      onChange={e => { e.stopPropagation(); updateRefundQty(item.id, Number(e.target.value)); }}
                      onClick={e => e.stopPropagation()}
                      className="w-14 text-center text-xs border border-input rounded px-1 py-0.5 bg-background text-foreground"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Reason (optional)</label>
            <input
              value={refundReason}
              onChange={e => setRefundReason(e.target.value)}
              placeholder="e.g. Damaged product, wrong item..."
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Refund amount */}
          <div className="text-center py-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-destructive">Refund Amount</p>
            <p className="text-xl font-bold text-destructive">OMR {refundTotal.toFixed(3)}</p>
          </div>

          <button
            onClick={handleRefund}
            disabled={processing || refundTotal <= 0}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            <Check className="w-4 h-4" /> {processing ? 'Processing...' : 'Confirm Refund'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RefundDialog;
