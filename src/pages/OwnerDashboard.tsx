import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, ShoppingCart, Users, TrendingUp, Lock, Unlock, 
  Activity, Eye, EyeOff, LogOut, Wifi, WifiOff, 
  AlertTriangle, Smartphone, BarChart3, Bell, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StatCard from '@/components/dashboard/StatCard';
import { useTransactions, useCustomers, useStaffAlerts } from '@/hooks/useSupabaseData';

const OwnerDashboard = () => {
  const { data: transactions = [] } = useTransactions();
  const { data: customers = [] } = useCustomers();
  const { data: staffAlerts = [] } = useStaffAlerts();
  const unreadAlerts = staffAlerts.filter(a => !a.is_read);

  const [isVaultLocked, setIsVaultLocked] = useState(true);
  const [pin, setPin] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [showVaultData, setShowVaultData] = useState(false);

  // Derived stats from live DB
  const totalSales = useMemo(() => transactions.reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const totalDebt = useMemo(() => customers.reduce((s, c) => s + Number(c.total_debt), 0), [customers]);
  const cashSales = useMemo(() => transactions.filter(t => t.payment_type === 'cash').reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const cardSales = useMemo(() => transactions.filter(t => t.payment_type === 'card').reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const creditSales = useMemo(() => transactions.filter(t => t.payment_type === 'credit').reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const digitalSales = useMemo(() => transactions.filter(t => t.payment_type === 'digital').reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const refundTotal = useMemo(() => transactions.filter(t => t.status === 'refunded').reduce((s, t) => s + Number(t.total), 0), [transactions]);

  // Live feed from recent transactions
  const liveFeed = useMemo(() => {
    return transactions.slice(0, 20).map(t => {
      const items = (t as any).transaction_items || [];
      const firstItem = items[0];
      return {
        id: t.invoice_no,
        item: firstItem ? firstItem.product_name : t.customer_name,
        amount: Number(t.total).toFixed(3),
        method: t.payment_type.charAt(0).toUpperCase() + t.payment_type.slice(1),
        time: new Date(t.created_at).toLocaleTimeString(),
        isNew: false,
      };
    });
  }, [transactions]);

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-heading text-foreground">
            <span className="text-primary text-glow">Owner</span> Dashboard
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
            {isOnline ? <Wifi className="w-3 h-3 text-success" /> : <WifiOff className="w-3 h-3 text-destructive" />}
            {isOnline ? 'Live Connected' : 'Offline Mode'}
            <span className="text-muted-foreground">•</span>
            <Smartphone className="w-3 h-3" /> Mobile View
          </p>
        </div>
        <button 
          onClick={() => setIsOnline(!isOnline)}
          className="p-2 rounded-lg glass-card text-muted-foreground hover:text-foreground transition-colors"
        >
          <Activity className="w-5 h-5" />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard title="Total Sales" value={`OMR ${totalSales.toFixed(2)}`} change={`${transactions.length} txns`} changeType="positive" icon={DollarSign} iconColor="gradient-cyan" />
        <StatCard title="Net Cash" value={`OMR ${cashSales.toFixed(2)}`} change="cash sales" changeType="positive" icon={ShoppingCart} iconColor="bg-success" />
        <StatCard title="Market Debt" value={`OMR ${totalDebt.toFixed(2)}`} change="total khat" changeType="negative" icon={Users} iconColor="bg-destructive" />
        <StatCard title="Refunds" value={`OMR ${refundTotal.toFixed(2)}`} change="total" changeType="negative" icon={TrendingUp} iconColor="bg-warning" />
      </div>

      {/* Live Transaction Feed */}
      <div className="glass-card rounded-xl p-4 glow-cyan">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary pulse-glow rounded-full" />
            Recent Transactions
          </h3>
          <span className="text-[10px] px-2 py-1 rounded-full bg-success/20 text-success font-medium">● LIVE</span>
        </div>
        <div className="space-y-2 max-h-[300px] overflow-y-auto pos-scrollbar">
          {liveFeed.length > 0 ? liveFeed.map((tx, i) => (
            <motion.div
              key={`${tx.id}-${i}`}
              initial={tx.isNew ? { opacity: 0, x: -20, backgroundColor: 'hsla(187, 100%, 50%, 0.1)' } : {}}
              animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors border-b border-border/30 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  tx.method === 'Cash' ? 'bg-success' : tx.method === 'Card' ? 'bg-primary' : 'bg-warning'
                )} />
                <div>
                  <p className="text-xs font-medium text-foreground">{tx.item}</p>
                  <p className="text-[10px] text-muted-foreground">{tx.time} • {tx.method}</p>
                </div>
              </div>
              <span className="text-xs font-bold text-primary">OMR {tx.amount}</span>
            </motion.div>
          )) : (
            <div className="text-center py-6 text-xs text-muted-foreground">No transactions yet</div>
          )}
        </div>
      </div>

      {/* The Vault - PIN Protected */}
      <div className="glass-card rounded-xl p-4 glow-cyan">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
            {isVaultLocked ? <Lock className="w-4 h-4 text-warning" /> : <Unlock className="w-4 h-4 text-success" />}
            The Vault
          </h3>
          {!isVaultLocked && (
            <div className="flex gap-2">
              <button onClick={() => setShowVaultData(!showVaultData)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground">
                {showVaultData ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => { setIsVaultLocked(true); setShowVaultData(false); }} className="p-1.5 rounded-lg hover:bg-destructive/20 text-destructive">
                <Lock className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isVaultLocked ? (
          <div className="text-center py-6">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-30" />
            <p className="text-xs text-muted-foreground mb-4">Enter PIN to access financial data</p>
            <div className="flex justify-center gap-2 mb-3">
              {[0, 1, 2, 3].map(i => (
                <div key={i} className={cn(
                  'w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg font-bold',
                  pin.length > i ? 'border-primary text-primary' : 'border-border text-transparent'
                )}>
                  {pin.length > i ? '•' : ''}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) => (
                key !== null ? (
                  <button
                    key={i}
                    onClick={() => {
                      if (key === 'del') {
                        setPin(prev => prev.slice(0, -1));
                      } else {
                        const newPin = pin + key;
                        setPin(newPin);
                        if (newPin.length === 4) {
                          setTimeout(() => {
                            if (newPin === '1234') {
                              setIsVaultLocked(false);
                              setShowVaultData(true);
                            }
                            setPin('');
                          }, 200);
                        }
                      }
                    }}
                    className="h-10 rounded-lg glass text-sm font-medium text-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    {key === 'del' ? '⌫' : key}
                  </button>
                ) : <div key={i} />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3">Default PIN: 1234</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Net Profit</p>
                <p className="text-lg font-bold font-heading text-success">
                  {showVaultData ? `OMR ${(totalSales - refundTotal).toFixed(2)}` : '•••••'}
                </p>
              </div>
              <div className="glass rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground mb-1">Cash in Drawer</p>
                <p className="text-lg font-bold font-heading text-primary text-glow">
                  {showVaultData ? `OMR ${cashSales.toFixed(2)}` : '•••••'}
                </p>
              </div>
            </div>
            <div className="glass rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground mb-1">Total Market Debt (Khat)</p>
              <p className="text-lg font-bold font-heading text-destructive">
                {showVaultData ? `OMR ${totalDebt.toFixed(2)}` : '•••••'}
              </p>
              <div className="w-full h-2 rounded-full bg-muted mt-2 overflow-hidden">
                <div className="h-full rounded-full debt-gauge-red" style={{ width: `${Math.min((totalDebt / 1000) * 100, 100)}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Staff Alerts */}
      <div className="glass-card rounded-xl p-4 glow-cyan">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold font-heading text-foreground flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            Staff Alerts
            {unreadAlerts.length > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/20 text-destructive font-bold animate-pulse">
                {unreadAlerts.length} new
              </span>
            )}
          </h3>
        </div>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pos-scrollbar">
          {staffAlerts.length > 0 ? staffAlerts.slice(0, 15).map((alert) => (
            <div
              key={alert.id}
              className={cn(
                'flex items-start gap-3 py-2 px-3 rounded-lg border-b border-border/30 last:border-0 transition-colors',
                !alert.is_read ? 'bg-destructive/5' : 'hover:bg-muted/30'
              )}
            >
              <Bell className={cn('w-3.5 h-3.5 mt-0.5 shrink-0', !alert.is_read ? 'text-destructive' : 'text-muted-foreground')} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground">
                  <span className="text-warning">{alert.staff_name}</span> — {alert.details}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {new Date(alert.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-xs text-muted-foreground">No alerts — staff is behaving 👍</div>
          )}
        </div>
      </div>

      {/* Remote Controls */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold font-heading text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-warning" />
          Remote Controls
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button className="glass rounded-lg p-3 text-center hover:bg-destructive/10 transition-colors group">
            <LogOut className="w-5 h-5 mx-auto mb-1 text-destructive group-hover:scale-110 transition-transform" />
            <p className="text-xs font-medium text-destructive">Kill Sessions</p>
            <p className="text-[10px] text-muted-foreground">Logout all cashiers</p>
          </button>
          <button className="glass rounded-lg p-3 text-center hover:bg-warning/10 transition-colors group">
            <Lock className="w-5 h-5 mx-auto mb-1 text-warning group-hover:scale-110 transition-transform" />
            <p className="text-xs font-medium text-warning">Lock Terminal</p>
            <p className="text-[10px] text-muted-foreground">Freeze POS access</p>
          </button>
        </div>
      </div>

      {/* Sales Breakdown */}
      <div className="glass-card rounded-xl p-4">
        <h3 className="text-sm font-semibold font-heading text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Sales Breakdown
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Cash', amount: cashSales },
            { label: 'Card', amount: cardSales },
            { label: 'Digital', amount: digitalSales },
            { label: 'Customer Credit', amount: creditSales },
          ].map(d => (
            <div key={d.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{d.label}</span>
              <span className="text-xs font-semibold text-foreground">OMR {d.amount.toFixed(2)}</span>
            </div>
          ))}
          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Grand Total</span>
            <span className="text-sm font-bold text-primary text-glow">OMR {totalSales.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
