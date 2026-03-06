import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { QRCodeSVG } from 'qrcode.react';
import { Printer } from 'lucide-react';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

interface ReceiptData {
  invoiceNo: string;
  date: string;
  cashier: string;
  customer: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMethod: string;
  storeName?: string;
  storePhone?: string;
  storeAddress?: string;
}

interface ReceiptPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptData | null;
}

const ReceiptPreview = ({ open, onOpenChange, receipt }: ReceiptPreviewProps) => {
  if (!receipt) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html><head><title>Receipt</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 80mm; padding: 4mm; font-size: 12px; color: #000; }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 4px 0; }
        .row { display: flex; justify-content: space-between; }
        .small { font-size: 10px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 1px 0; font-size: 11px; }
        .total-row { font-size: 16px; font-weight: bold; }
      </style></head><body>
        <div class="center bold" style="font-size:16px">${receipt.storeName || 'BHAEES POS'}</div>
        <div class="center small">${receipt.storeAddress || 'Muscat, Oman'}</div>
        <div class="center small">${receipt.storePhone || '+968 9867 5132'}</div>
        <div class="line"></div>
        <div class="row"><span>Invoice:</span><span class="bold">${receipt.invoiceNo}</span></div>
        <div class="row"><span>Date:</span><span>${receipt.date}</span></div>
        <div class="row"><span>Cashier:</span><span>${receipt.cashier}</span></div>
        <div class="row"><span>Customer:</span><span>${receipt.customer}</span></div>
        <div class="line"></div>
        <table>
          <tr class="bold"><td>Item</td><td class="right">Qty</td><td class="right">Price</td><td class="right">Total</td></tr>
          ${receipt.items.map(i => `
            <tr><td>${i.name.substring(0, 20)}</td><td class="right">${i.quantity}</td><td class="right">${i.price.toFixed(3)}</td><td class="right">${i.total.toFixed(3)}</td></tr>
            ${i.discount > 0 ? `<tr><td colspan="4" class="small" style="color:#666">  Disc: -${i.discount}%</td></tr>` : ''}
          `).join('')}
        </table>
        <div class="line"></div>
        <div class="row"><span>Subtotal:</span><span>OMR ${receipt.subtotal.toFixed(3)}</span></div>
        ${receipt.discount > 0 ? `<div class="row"><span>Discount:</span><span>-OMR ${receipt.discount.toFixed(3)}</span></div>` : ''}
        <div class="row"><span>VAT (5%):</span><span>OMR ${receipt.vat.toFixed(3)}</span></div>
        <div class="line"></div>
        <div class="row total-row"><span>TOTAL:</span><span>OMR ${receipt.total.toFixed(3)}</span></div>
        <div class="line"></div>
        <div class="row small"><span>Payment:</span><span>${receipt.paymentMethod}</span></div>
        <div class="line"></div>
        <div class="center small" style="margin-top:8px">Thank you for shopping with us!</div>
        <div class="center small" dir="rtl">شكرا لتسوقكم معنا</div>
        <script>window.print();window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-4 h-4" /> Receipt Preview
          </DialogTitle>
        </DialogHeader>
        
        {/* Thermal receipt simulation */}
        <div className="bg-foreground text-background rounded-lg p-4 font-mono text-[11px] leading-relaxed space-y-1">
          <div className="text-center font-bold text-sm">{receipt.storeName || 'BHAEES POS'}</div>
          <div className="text-center text-[9px] opacity-70">{receipt.storeAddress || 'Muscat, Oman'}</div>
          <div className="text-center text-[9px] opacity-70">{receipt.storePhone || '+968 9867 5132'}</div>
          
          <div className="border-t border-dashed border-background/30 my-2" />
          
          <div className="flex justify-between"><span>Invoice:</span><span className="font-bold">{receipt.invoiceNo}</span></div>
          <div className="flex justify-between"><span>Date:</span><span>{receipt.date}</span></div>
          <div className="flex justify-between"><span>Cashier:</span><span>{receipt.cashier}</span></div>
          <div className="flex justify-between"><span>Customer:</span><span>{receipt.customer}</span></div>
          
          <div className="border-t border-dashed border-background/30 my-2" />
          
          <table className="w-full">
            <thead>
              <tr className="font-bold">
                <td>Item</td>
                <td className="text-right">Qty</td>
                <td className="text-right">Total</td>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item, i) => (
                <tr key={i}>
                  <td className="truncate max-w-[120px]">{item.name}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">{item.total.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="border-t border-dashed border-background/30 my-2" />
          
          <div className="flex justify-between"><span>Subtotal:</span><span>OMR {receipt.subtotal.toFixed(3)}</span></div>
          {receipt.discount > 0 && (
            <div className="flex justify-between"><span>Discount:</span><span>-OMR {receipt.discount.toFixed(3)}</span></div>
          )}
          <div className="flex justify-between"><span>VAT (5%):</span><span>OMR {receipt.vat.toFixed(3)}</span></div>
          
          <div className="border-t border-dashed border-background/30 my-2" />
          
          <div className="flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>OMR {receipt.total.toFixed(3)}</span>
          </div>
          
          <div className="border-t border-dashed border-background/30 my-2" />
          
          <div className="flex justify-between"><span>Payment:</span><span>{receipt.paymentMethod}</span></div>
          
          <div className="flex justify-center my-3">
            <QRCodeSVG
              value={JSON.stringify({ seller: receipt.storeName || 'BHAEES POS', vat: 'OM1234567890', invoice: receipt.invoiceNo, total: receipt.total.toFixed(3), date: receipt.date })}
              size={80}
              bgColor="hsl(45, 20%, 95%)"
              fgColor="hsl(0, 0%, 5%)"
            />
          </div>
          
          <div className="text-center text-[9px] opacity-70">Thank you for shopping with us!</div>
          <div className="text-center text-[9px] opacity-70" dir="rtl">شكرا لتسوقكم معنا</div>
        </div>
        
        <button
          onClick={handlePrint}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Printer className="w-4 h-4" /> Print Receipt
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptPreview;
export type { ReceiptData };
