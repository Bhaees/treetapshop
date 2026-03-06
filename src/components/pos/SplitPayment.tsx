import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Banknote, CreditCard, Smartphone, BookOpen, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentSplit {
  method: string;
  amount: number;
  icon: React.ReactNode;
}

interface SplitPaymentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirm: (splits: PaymentSplit[]) => void;
}

const METHODS = [
  { key: 'Cash', icon: <Banknote className="w-4 h-4" />, color: 'bg-success/20 text-success border-success/30' },
  { key: 'Card', icon: <CreditCard className="w-4 h-4" />, color: 'bg-primary/20 text-primary border-primary/30' },
  { key: 'Digital', icon: <Smartphone className="w-4 h-4" />, color: 'bg-info/20 text-info border-info/30' },
  { key: 'Credit', icon: <BookOpen className="w-4 h-4" />, color: 'bg-warning/20 text-warning border-warning/30' },
];

const SplitPayment = ({ open, onOpenChange, total, onConfirm }: SplitPaymentProps) => {
  const [splits, setSplits] = useState<Record<string, string>>({});

  const allocated = Object.values(splits).reduce((s, v) => s + (Number(v) || 0), 0);
  const remaining = total - allocated;
  const isValid = Math.abs(remaining) < 0.001 && Object.values(splits).some(v => Number(v) > 0);

  const handleConfirm = () => {
    const result: PaymentSplit[] = Object.entries(splits)
      .filter(([, v]) => Number(v) > 0)
      .map(([method, amount]) => ({
        method,
        amount: Number(amount),
        icon: METHODS.find(m => m.key === method)?.icon || null,
      }));
    onConfirm(result);
    setSplits({});
  };

  const autoFillRemaining = (method: string) => {
    if (remaining > 0) {
      setSplits(prev => ({ ...prev, [method]: (Number(prev[method] || 0) + remaining).toFixed(3) }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Split Payment</DialogTitle>
        </DialogHeader>
        
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">Total Amount</p>
          <p className="text-2xl font-bold text-foreground">OMR {total.toFixed(3)}</p>
        </div>

        <div className="space-y-3">
          {METHODS.map(m => (
            <div key={m.key} className={cn("flex items-center gap-3 p-3 rounded-lg border", m.color)}>
              {m.icon}
              <span className="text-sm font-medium flex-1">{m.key}</span>
              <input
                type="number"
                step="0.001"
                min="0"
                placeholder="0.000"
                value={splits[m.key] || ''}
                onChange={e => setSplits(prev => ({ ...prev, [m.key]: e.target.value }))}
                className="w-24 text-right px-2 py-1 rounded border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={() => autoFillRemaining(m.key)}
                className="text-[10px] px-2 py-1 rounded bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                title="Fill remaining"
              >
                Rest
              </button>
            </div>
          ))}
        </div>

        <div className={cn("text-center py-2 rounded-lg", remaining > 0.001 ? 'bg-warning/10 text-warning' : remaining < -0.001 ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
          <p className="text-xs">Remaining</p>
          <p className="text-lg font-bold">OMR {remaining.toFixed(3)}</p>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!isValid}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          <Check className="w-4 h-4" /> Confirm Split Payment
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default SplitPayment;
export type { PaymentSplit };
