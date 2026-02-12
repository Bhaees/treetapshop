import { DollarSign, ShoppingCart, Package, Users, TrendingUp } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useProducts, useCustomers, useTransactions } from '@/hooks/useSupabaseData';
import { useMemo } from 'react';

const COLORS = ['hsl(187, 100%, 50%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(270, 70%, 55%)'];

const Dashboard = () => {
  const { data: products = [] } = useProducts();
  const { data: customers = [] } = useCustomers();
  const { data: transactions = [] } = useTransactions();

  const totalSales = useMemo(() => transactions.reduce((s, t) => s + Number(t.total), 0), [transactions]);
  const totalDebt = useMemo(() => customers.reduce((s, c) => s + Number(c.total_debt), 0), [customers]);
  const lowStock = products.filter(p => p.stock <= p.min_stock).length;

  // Category breakdown
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach(p => map.set(p.category, (map.get(p.category) || 0) + p.stock));
    const total = Array.from(map.values()).reduce((a, b) => a + b, 0) || 1;
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({ name, value: Math.round((value / total) * 100) }));
  }, [products]);

  // Recent sales (last 5)
  const recentSales = transactions.slice(0, 5);

  // Daily sales data (last 7 days)
  const dailySalesData = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (6 - i));
      const dayStr = days[d.getDay()];
      const dayTxns = transactions.filter(t => {
        const td = new Date(t.created_at);
        return td.toDateString() === d.toDateString();
      });
      return { day: dayStr, sales: dayTxns.reduce((s, t) => s + Number(t.total), 0), orders: dayTxns.length };
    });
  }, [transactions]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-foreground">
            <span className="text-primary text-glow">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's your store overview.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Sales" value={`OMR ${totalSales.toFixed(2)}`} change={`${transactions.length} transactions`} changeType="positive" icon={DollarSign} iconColor="gradient-cyan" />
        <StatCard title="Transactions" value={transactions.length.toString()} change="all time" changeType="positive" icon={ShoppingCart} iconColor="bg-success" />
        <StatCard title="Products" value={products.length.toString()} change={`${lowStock} low stock`} changeType="negative" icon={Package} iconColor="bg-warning" />
        <StatCard title="Market Debt" value={`OMR ${totalDebt.toFixed(2)}`} change="outstanding khat" changeType="negative" icon={Users} iconColor="bg-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass-card rounded-xl p-5 glow-cyan">
          <h3 className="text-base font-semibold font-heading text-foreground mb-4">Weekly Sales</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsla(0, 0%, 100%, 0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(0, 0%, 55%)' }} stroke="hsla(0, 0%, 100%, 0.1)" />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(0, 0%, 55%)' }} stroke="hsla(0, 0%, 100%, 0.1)" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsla(0, 0%, 100%, 0.1)', background: 'hsl(0, 0%, 8%)', color: 'hsl(180, 100%, 95%)', fontSize: '12px' }} />
              <Bar dataKey="sales" fill="hsl(187, 100%, 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-base font-semibold font-heading text-foreground mb-4">Stock by Category</h3>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                    {categoryData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'hsl(0, 0%, 8%)', border: '1px solid hsla(0, 0%, 100%, 0.1)', borderRadius: '8px', color: 'hsl(180, 100%, 95%)', fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {categoryData.map((cat, i) => (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-muted-foreground">{cat.name}</span>
                    </div>
                    <span className="font-medium text-foreground">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data yet</div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-base font-semibold font-heading text-foreground mb-4">Recent Sales</h3>
        {recentSales.length > 0 ? (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{sale.invoice_no}</p>
                  <p className="text-xs text-muted-foreground">{sale.customer_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">OMR {Number(sale.total).toFixed(2)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    sale.status === 'paid' ? 'bg-success/20 text-success' :
                    sale.status === 'refunded' ? 'bg-destructive/20 text-destructive' :
                    'bg-warning/20 text-warning'
                  }`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">No sales yet — make your first sale from the POS!</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
