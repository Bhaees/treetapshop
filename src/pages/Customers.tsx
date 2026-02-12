import { useState } from 'react';
import { Search, Plus, Edit, Trash2, User, Phone, Mail, MapPin } from 'lucide-react';
import { customers as initialCustomers, type Customer } from '@/data/mockData';
import { toast } from 'sonner';

const Customers = () => {
  const [customersList] = useState<Customer[]>(initialCustomers);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = customersList.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.phone.includes(searchQuery)
  );

  const totalBalance = customersList.reduce((sum, c) => sum + c.balance, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-sm text-muted-foreground">{customersList.length} customers · Outstanding Balance: AED {totalBalance.toFixed(2)}</p>
        </div>
        <button onClick={() => toast.info('Add customer form coming soon')} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-card border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(customer => (
          <div key={customer.id} className="bg-card rounded-xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow animate-fade-in">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">{customer.name}</h3>
                  <p className="text-xs text-muted-foreground">Since {new Date(customer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"><Edit className="w-4 h-4" /></button>
                <button className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{customer.phone}</div>
              {customer.email && <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{customer.email}</div>}
              {customer.address && <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />{customer.address}</div>}
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Total Purchases</p>
                <p className="text-sm font-semibold text-card-foreground">AED {customer.totalPurchases.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Balance</p>
                <p className={`text-sm font-semibold ${customer.balance > 0 ? 'text-destructive' : 'text-success'}`}>
                  AED {customer.balance.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">No customers found</div>
      )}
    </div>
  );
};

export default Customers;
