import { useState } from 'react';
import { Store, Receipt, Percent, Globe, Printer, Bell, Shield, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'store', label: 'Store Info', icon: Store },
  { id: 'tax', label: 'Tax & Currency', icon: Percent },
  { id: 'receipt', label: 'Receipt', icon: Receipt },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('store');
  const [storeName, setStoreName] = useState('NAED BHAEES');
  const [storePhone, setStorePhone] = useState('+971 50 123 4567');
  const [storeAddress, setStoreAddress] = useState('Dubai, UAE');
  const [storeEmail, setStoreEmail] = useState('info@naedbhaees.com');
  const [taxRate, setTaxRate] = useState('5');
  const [currency, setCurrency] = useState('AED');
  const [receiptHeader, setReceiptHeader] = useState('NAED BHAEES POS');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping with us!');

  const handleSave = () => {
    toast.success('Settings saved successfully');
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your store configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-56 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                activeTab === tab.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-card rounded-xl border border-border p-6 shadow-sm">
          {activeTab === 'store' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-card-foreground">Store Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Store Name</label>
                  <input value={storeName} onChange={e => setStoreName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Phone</label>
                  <input value={storePhone} onChange={e => setStorePhone(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Email</label>
                  <input value={storeEmail} onChange={e => setStoreEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Address</label>
                  <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-card-foreground">Tax & Currency Settings</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Tax Rate (%)</label>
                  <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-card-foreground">Receipt Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Receipt Header</label>
                  <input value={receiptHeader} onChange={e => setReceiptHeader(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Receipt Footer</label>
                  <input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-card-foreground">Notification Settings</h2>
              <div className="space-y-4">
                {['Low stock alerts', 'Daily sales summary', 'New customer notifications', 'Payment received alerts'].map(item => (
                  <div key={item} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <span className="text-sm text-card-foreground">{item}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-muted rounded-full peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-card after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold text-card-foreground">Security Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Current Password</label>
                  <input type="password" placeholder="Enter current password" className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">New Password</label>
                  <input type="password" placeholder="Enter new password" className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <div>
                  <label className="text-sm font-medium text-card-foreground mb-1.5 block">Confirm New Password</label>
                  <input type="password" placeholder="Confirm new password" className="w-full px-4 py-2.5 rounded-lg bg-background border border-input text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-border">
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
              <Save className="w-4 h-4" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
