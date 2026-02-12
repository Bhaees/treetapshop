import { useState, useRef } from 'react';
import { Search, Plus, Edit, Trash2, Package, Download, Upload, Loader2 } from 'lucide-react';
import { useProducts, useCategories } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { useQueryClient } from '@tanstack/react-query';

const Products = () => {
  const { data: productsList = [], isLoading } = useProducts();
  const categories = useCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Items');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data);
      let totalInserted = 0;

      for (const sheetName of wb.SheetNames) {
        const ws = wb.Sheets[sheetName];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        if (rows.length < 2) continue;

        // Find header row
        const header = rows[0] as string[];
        const nameIdx = header.findIndex(h => h && h.toString().toLowerCase().includes('product'));
        const valueIdx = header.findIndex(h => h && h.toString().toLowerCase().includes('stock value'));
        const stockIdx = header.findIndex(h => h && h.toString().toLowerCase().includes('in stock'));

        if (nameIdx === -1 || stockIdx === -1) continue;

        // Build markdown table for the edge function
        const lines = ['|Product name|Total stock value|In Stock|'];
        lines.push('|-|-|-|');

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          const name = row[nameIdx]?.toString()?.trim();
          if (!name) continue;
          const val = Number(row[valueIdx >= 0 ? valueIdx : 1]) || 0;
          const stock = Number(row[stockIdx]) || 0;
          lines.push(`|${name.replace(/\|/g, '/')}|${val}|${stock}|`);
        }

        // Send in chunks of 500 lines
        const CHUNK = 500;
        const dataLines = lines.slice(2); // exclude header + separator
        const headerLines = lines.slice(0, 2).join('\n');

        for (let i = 0; i < dataLines.length; i += CHUNK) {
          const chunk = dataLines.slice(i, i + CHUNK);
          const markdown = headerLines + '\n' + chunk.join('\n');

          const { data: result, error } = await supabase.functions.invoke('import-products', {
            body: { markdown },
          });

          if (error) {
            console.error('Import chunk error:', error);
            toast.error(`Import error at batch ${Math.floor(i / CHUNK) + 1}`);
          } else {
            totalInserted += result.inserted || 0;
            toast.info(`Imported ${totalInserted} products so far...`);
          }
        }
      }

      toast.success(`Import complete! ${totalInserted} products added.`);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    } catch (err: any) {
      console.error('Import failed:', err);
      toast.error('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const filtered = productsList.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || (p.barcode && p.barcode.includes(searchQuery)) || (p.sku && p.sku.toLowerCase().includes(q)) || (p.name_ar && p.name_ar.includes(searchQuery));
    const matchCat = filterCategory === 'All Items' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStock = productsList.filter(p => p.stock <= p.min_stock).length;
  const totalValue = productsList.reduce((sum, p) => sum + (p.price * p.stock), 0);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><p className="text-sm text-muted-foreground">Loading inventory...</p></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            <span className="text-primary text-glow">Inventory</span>
          </h1>
          <p className="text-sm text-muted-foreground">{productsList.length} products · {lowStock} low stock · Value: OMR {totalValue.toFixed(3)}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm font-medium text-foreground hover:bg-muted/30 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImport}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm font-medium text-foreground hover:bg-muted/30 transition-colors disabled:opacity-50"
          >
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Importing...' : 'Import'}
          </button>
          <button onClick={() => toast.info('Add product form coming soon')} className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-cyan text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, barcode, SKU / البحث..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="glass-card rounded-xl overflow-hidden glow-cyan">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/50 bg-muted/20">
                <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                <th className="text-left p-4 font-medium text-muted-foreground">SKU</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Barcode</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Cost</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Stock</th>
                <th className="text-center p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(product => (
                <tr key={product.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg glass flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{product.name}</span>
                        {product.name_ar && <p className="text-[10px] text-muted-foreground" dir="rtl">{product.name_ar}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{product.sku || '—'}</td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">{product.barcode || '—'}</td>
                  <td className="p-4"><Badge variant="outline" className="text-xs border-border/50">{product.category}</Badge></td>
                  <td className="p-4 text-right text-muted-foreground">OMR {product.cost.toFixed(3)}</td>
                  <td className="p-4 text-right font-medium text-primary">OMR {product.price.toFixed(3)}</td>
                  <td className="p-4 text-right">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                      product.stock <= product.min_stock ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
                    )}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 200 && (
          <div className="flex items-center justify-center py-3 text-muted-foreground text-xs border-t border-border/30">
            Showing 200 of {filtered.length} products. Use search to find specific items.
          </div>
        )}
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No products found</div>
        )}
      </div>
    </div>
  );
};

export default Products;
