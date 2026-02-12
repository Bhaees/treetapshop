import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Package, Download, Upload, AlertTriangle, Calendar } from 'lucide-react';
import { products as initialProducts, categories, type Product } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

const Products = () => {
  const [productsList] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Items');

  // Bilingual search
  const filtered = productsList.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.barcode.includes(searchQuery) || p.sku.toLowerCase().includes(q) || (p.nameAr && p.nameAr.includes(searchQuery));
    const matchCat = filterCategory === 'All Items' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStock = productsList.filter(p => p.stock <= p.minStock).length;
  const totalValue = productsList.reduce((sum, p) => sum + (p.price * p.stock), 0);

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
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass text-sm font-medium text-foreground hover:bg-muted/30 transition-colors">
            <Upload className="w-4 h-4" /> Import
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
              {filtered.map(product => (
                <tr key={product.id} className="border-b border-border/30 hover:bg-muted/10 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg glass flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium text-foreground">{product.name}</span>
                        {product.nameAr && <p className="text-[10px] text-muted-foreground" dir="rtl">{product.nameAr}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{product.sku}</td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">{product.barcode}</td>
                  <td className="p-4"><Badge variant="outline" className="text-xs border-border/50">{product.category}</Badge></td>
                  <td className="p-4 text-right text-muted-foreground">OMR {product.cost.toFixed(3)}</td>
                  <td className="p-4 text-right font-medium text-primary">OMR {product.price.toFixed(3)}</td>
                  <td className="p-4 text-right">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium',
                      product.stock <= product.minStock ? 'bg-destructive/20 text-destructive' : 'bg-success/20 text-success'
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
        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No products found</div>
        )}
      </div>
    </div>
  );
};

export default Products;
