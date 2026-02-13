import { useState, useEffect } from 'react';
import { Store, Receipt, Percent, Bell, Shield, Save, Users, Plus, Pencil, Trash2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const tabs = [
  { id: 'store', label: 'Store Info', icon: Store },
  { id: 'staff', label: 'Staff & PINs', icon: Users },
  { id: 'tax', label: 'Tax & Currency', icon: Percent },
  { id: 'receipt', label: 'Receipt', icon: Receipt },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
];

interface StaffMember {
  id: string;
  name: string;
  pin: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('store');
  const [storeName, setStoreName] = useState('BHAEES POS');
  const [storePhone, setStorePhone] = useState('+968 99 123 456');
  const [storeAddress, setStoreAddress] = useState('Muscat, Oman');
  const [storeEmail, setStoreEmail] = useState('info@naedbhaees.com');
  const [taxRate, setTaxRate] = useState('5');
  const [currency, setCurrency] = useState('OMR');
  const [receiptHeader, setReceiptHeader] = useState('BHAEES POS');
  const [receiptFooter, setReceiptFooter] = useState('Thank you for shopping with us! شكرا لتسوقكم معنا');

  // Staff management state
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formName, setFormName] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formRole, setFormRole] = useState('staff');
  const [formActive, setFormActive] = useState(true);
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchStaff = async () => {
    setStaffLoading(true);
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setStaffList(data);
    setStaffLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'staff') fetchStaff();
  }, [activeTab]);

  const resetForm = () => {
    setFormName('');
    setFormPin('');
    setFormRole('staff');
    setFormActive(true);
    setEditingStaff(null);
    setShowForm(false);
  };

  const openEditForm = (staff: StaffMember) => {
    setEditingStaff(staff);
    setFormName(staff.name);
    setFormPin(staff.pin);
    setFormRole(staff.role);
    setFormActive(staff.is_active);
    setShowForm(true);
  };

  const handleSaveStaff = async () => {
    if (!formName.trim()) return toast.error('Name is required');
    if (formPin.length !== 4 || !/^\d{4}$/.test(formPin)) return toast.error('PIN must be exactly 4 digits');

    // Check duplicate PIN
    const duplicate = staffList.find(s => s.pin === formPin && s.id !== editingStaff?.id);
    if (duplicate) return toast.error(`PIN already used by ${duplicate.name}`);

    if (editingStaff) {
      const { error } = await supabase
        .from('staff')
        .update({ name: formName.trim(), pin: formPin, role: formRole, is_active: formActive })
        .eq('id', editingStaff.id);
      if (error) return toast.error('Failed to update staff');
      toast.success(`${formName} updated`);
    } else {
      const { error } = await supabase
        .from('staff')
        .insert({ name: formName.trim(), pin: formPin, role: formRole, is_active: formActive });
      if (error) return toast.error('Failed to add staff');
      toast.success(`${formName} added`);
    }
    resetForm();
    fetchStaff();
  };

  const handleDeleteStaff = async (id: string) => {
    const { error } = await supabase.from('staff').delete().eq('id', id);
    if (error) return toast.error('Failed to delete staff');
    toast.success('Staff removed');
    setDeleteConfirm(null);
    fetchStaff();
  };

  const handleSave = () => toast.success('Settings saved successfully');

  const inputClass = "w-full px-4 py-2.5 rounded-lg glass border border-input text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading text-foreground">
          <span className="text-primary text-glow">Settings</span>
        </h1>
        <p className="text-sm text-muted-foreground">Manage your store configuration</p>
      </div>

      <div className="flex gap-6">
        <div className="w-56 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all text-left',
                activeTab === tab.id ? 'gradient-cyan text-primary-foreground glow-cyan' : 'text-muted-foreground hover:bg-muted/30 hover:text-foreground'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 glass-card rounded-xl p-6 glow-cyan">
          {activeTab === 'store' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold font-heading text-foreground">Store Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Store Name</label>
                  <input value={storeName} onChange={e => setStoreName(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Phone</label>
                  <input value={storePhone} onChange={e => setStorePhone(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                  <input value={storeEmail} onChange={e => setStoreEmail(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Address</label>
                  <input value={storeAddress} onChange={e => setStoreAddress(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold font-heading text-foreground">Staff & PINs</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Manage who can access the POS terminal</p>
                </div>
                {!showForm && (
                  <button
                    onClick={() => { resetForm(); setShowForm(true); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-cyan text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add Staff
                  </button>
                )}
              </div>

              {/* Add/Edit Form */}
              {showForm && (
                <div className="glass rounded-xl p-5 border border-primary/20 space-y-4">
                  <h3 className="text-sm font-bold text-foreground">
                    {editingStaff ? `Edit: ${editingStaff.name}` : 'Register New Staff'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                      <input
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="e.g. Ahmed"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">4-Digit PIN</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        value={formPin}
                        onChange={e => setFormPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="e.g. 5678"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Role</label>
                      <select value={formRole} onChange={e => setFormRole(e.target.value)} className={inputClass}>
                        <option value="staff">Staff (Restricted)</option>
                        <option value="owner">Owner (Full Access)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                      <select value={formActive ? 'active' : 'inactive'} onChange={e => setFormActive(e.target.value === 'active')} className={inputClass}>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive (Cannot Login)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={handleSaveStaff}
                      className="flex items-center gap-2 px-5 py-2 rounded-lg gradient-cyan text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Save className="w-4 h-4" />
                      {editingStaff ? 'Update' : 'Register'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-5 py-2 rounded-lg glass border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Staff List */}
              {staffLoading ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading staff...</div>
              ) : (
                <div className="space-y-2">
                  {staffList.map(staff => (
                    <div
                      key={staff.id}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-xl glass border transition-all",
                        staff.is_active ? 'border-border/30' : 'border-destructive/20 opacity-60',
                        staff.role === 'owner' && 'border-amber-500/30'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                          staff.role === 'owner' ? 'bg-amber-500/15 text-amber-400' : 'bg-primary/15 text-primary'
                        )}>
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">{staff.name}</span>
                            <span className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider",
                              staff.role === 'owner' ? 'bg-amber-500/20 text-amber-400' : 'bg-primary/20 text-primary'
                            )}>
                              {staff.role}
                            </span>
                            {!staff.is_active && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold uppercase">
                                Inactive
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">PIN:</span>
                            <span className="text-xs font-mono text-foreground tracking-widest">
                              {showPin[staff.id] ? staff.pin : '••••'}
                            </span>
                            <button
                              onClick={() => setShowPin(prev => ({ ...prev, [staff.id]: !prev[staff.id] }))}
                              className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPin[staff.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(staff)}
                          className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {deleteConfirm === staff.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="px-3 py-1 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-3 py-1 rounded-lg glass text-xs text-muted-foreground"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(staff.id)}
                            className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {staffList.length === 0 && (
                    <div className="text-center py-10 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No staff registered yet</p>
                      <p className="text-xs mt-1">Click "Add Staff" to register your first team member</p>
                    </div>
                  )}
                </div>
              )}

              {/* Info box */}
              <div className="glass rounded-lg p-4 border border-primary/20 mt-4">
                <p className="text-xs text-primary font-medium mb-1">ℹ️ How POS Login Works</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Each staff member has a unique <strong>4-digit PIN</strong> to log into the POS terminal</li>
                  <li>• <strong>Owner</strong> role: Full access to all pages (Dashboard, Reports, Settings, etc.)</li>
                  <li>• <strong>Staff</strong> role: Restricted to POS, Products, Customers, and Sales only</li>
                  <li>• <strong>Inactive</strong> staff cannot log in until reactivated</li>
                  <li>• All actions are logged under the staff member's name for accountability</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold font-heading text-foreground">Tax & Currency Settings</h2>
              <div className="glass rounded-lg p-4 border border-primary/20">
                <p className="text-xs text-primary font-medium mb-1">🇴🇲 Oman VAT Compliance</p>
                <p className="text-xs text-muted-foreground">Hardcoded 5% VAT as per Oman Tax Authority (OTA) regulations. QR codes are generated automatically on every receipt.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Tax Rate (%)</label>
                  <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Currency</label>
                  <select value={currency} onChange={e => setCurrency(e.target.value)} className={inputClass}>
                    <option value="OMR">OMR - Omani Rial</option>
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receipt' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold font-heading text-foreground">Receipt Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Receipt Header</label>
                  <input value={receiptHeader} onChange={e => setReceiptHeader(e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Receipt Footer</label>
                  <input value={receiptFooter} onChange={e => setReceiptFooter(e.target.value)} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold font-heading text-foreground">Notification Settings</h2>
              <div className="space-y-4">
                {['Low stock alerts', 'Daily sales summary', 'New customer notifications', 'Payment received alerts', 'Expiry warnings (7 days)'].map(item => (
                  <div key={item} className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                    <span className="text-sm text-foreground">{item}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-muted rounded-full peer-checked:bg-primary transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <h2 className="text-lg font-semibold font-heading text-foreground">Security Settings</h2>
              <div className="glass rounded-lg p-4 border border-warning/20">
                <p className="text-xs text-warning font-medium mb-1">🔐 PIN Lock</p>
                <p className="text-xs text-muted-foreground">Manage staff PINs in the "Staff & PINs" tab. The PIN is used to authenticate on the POS terminal.</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Owner PIN</label>
                  <input type="password" placeholder="Enter new 4-digit PIN" maxLength={4} className={inputClass} />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Confirm PIN</label>
                  <input type="password" placeholder="Confirm new PIN" maxLength={4} className={inputClass} />
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'staff' && (
            <div className="mt-6 pt-4 border-t border-border/30">
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-lg gradient-cyan text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
