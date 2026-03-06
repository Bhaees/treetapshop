import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { FileText } from 'lucide-react';

interface InvoiceDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
}

const InvoiceDetail = ({ open, onOpenChange, sale }: InvoiceDetailProps) => {
  if (!sale) return null;
  const items = sale.transaction_items || [];
  const itemCount = items.reduce((s: number, i: any) => s + Number(i.quantity), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            Invoice {sale.invoice_no}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Date</p>
              <p className="font-medium text-foreground">{new Date(sale.created_at).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Customer</p>
              <p className="font-medium text-foreground">{sale.customer_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Payment</p>
              <Badge variant="outline" className="text-xs capitalize">{sale.payment_type}</Badge>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Status</p>
              <Badge className={cn('text-xs',
                sale.status === 'paid' && 'bg-success/20 text-success border-success/30',
                sale.status === 'refunded' && 'bg-destructive/20 text-destructive border-destructive/30',
                sale.status === 'credit' && 'bg-warning/20 text-warning border-warning/30',
              )} variant="outline">
                {sale.status}
              </Badge>
            </div>
            {sale.cashier && (
              <div>
                <p className="text-muted-foreground text-xs">Cashier</p>
                <p className="font-medium text-foreground">{sale.cashier}</p>
              </div>
            )}
          </div>

          {/* Line items */}
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/20 border-b border-border">
                  <th className="text-left p-3 text-xs font-medium text-muted-foreground">Item</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Qty</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Price</th>
                  <th className="text-right p-3 text-xs font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: any) => (
                  <tr key={item.id} className="border-b border-border/30">
                    <td className="p-3">
                      <p className="font-medium text-foreground">{item.product_name}</p>
                      {item.barcode && <p className="text-[10px] text-muted-foreground font-mono">{item.barcode}</p>}
                    </td>
                    <td className="p-3 text-right text-muted-foreground">{Number(item.quantity)}</td>
                    <td className="p-3 text-right text-muted-foreground">OMR {Number(item.unit_price).toFixed(3)}</td>
                    <td className="p-3 text-right font-medium text-foreground">OMR {Number(item.total).toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal ({itemCount} items)</span>
              <span>OMR {Number(sale.subtotal).toFixed(3)}</span>
            </div>
            {Number(sale.discount) > 0 && (
              <div className="flex justify-between text-success">
                <span>Discount</span>
                <span>-OMR {Number(sale.discount).toFixed(3)}</span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>VAT (5%)</span>
              <span>OMR {Number(sale.vat).toFixed(3)}</span>
            </div>
            <div className="flex justify-between font-bold text-foreground text-base pt-2 border-t border-border">
              <span>Total</span>
              <span className="text-primary">OMR {Number(sale.total).toFixed(3)}</span>
            </div>
          </div>

          {/* QR */}
          <div className="flex justify-center">
            <QRCodeSVG
              value={JSON.stringify({ seller: 'BHAEES POS', vat: 'OM1234567890', invoice: sale.invoice_no, total: Number(sale.total).toFixed(3) })}
              size={80}
              bgColor="hsl(45, 20%, 95%)"
              fgColor="hsl(0, 0%, 5%)"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceDetail;
