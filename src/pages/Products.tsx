import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Package, Filter, Download, Upload } from 'lucide-react';
import { products as initialProducts, categories, type Product } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const Products = () => {
  const [productsList] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('All Items');
  const [showAddModal, setShowAddModal] = useState(false);

  const filtered = productsList.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery) || p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = filterCategory === 'All Items' || p.category === filterCategory;
    return matchSearch && matchCat;
  });

  const lowStock = productsList.filter(p => p.stock <= p.minStock).length;
  const totalValue = productsList.reduce((sum, p) => sum + (p.price * p.stock), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">{productsList.length} products · {lowStock} low stock · Total Value: AED {totalValue.toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={() => toast.info('Add product form coming soon')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, barcode, or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-card border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
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
                <tr key={product.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-foreground">{product.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{product.sku}</td>
                  <td className="p-4 text-muted-foreground font-mono text-xs">{product.barcode}</td>
                  <td className="p-4"><span className="px-2 py-1 rounded-full bg-secondary text-secondary-foreground text-xs">{product.category}</span></td>
                  <td className="p-4 text-right text-muted-foreground">AED {product.cost.toFixed(2)}</td>
                  <td className="p-4 text-right font-medium text-foreground">AED {product.price.toFixed(2)}</td>
                  <td className="p-4 text-right">
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', product.stock <= product.minStock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
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
