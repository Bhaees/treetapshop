import { DollarSign, ShoppingCart, Package, Users, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import StatCard from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { dailySalesData, monthlySalesData, topSellingProducts, sales, products, customers } from '@/data/mockData';

const COLORS = ['hsl(217, 91%, 50%)', 'hsl(160, 84%, 39%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(270, 70%, 55%)'];

const categoryData = [
  { name: 'Beverages', value: 35 },
  { name: 'Snacks', value: 25 },
  { name: 'Dairy', value: 20 },
  { name: 'Household', value: 12 },
  { name: 'Other', value: 8 },
];

const Dashboard = () => {
  const todaySales = 2100;
  const totalOrders = sales.length;
  const totalProducts = products.length;
  const totalCustomers = customers.length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back! Here's your store overview.</p>
        </div>
        <div className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Sales" value={`AED ${todaySales.toLocaleString()}`} change="+12.5% vs yesterday" changeType="positive" icon={DollarSign} iconColor="bg-primary" />
        <StatCard title="Total Orders" value={totalOrders.toString()} change="+8 today" changeType="positive" icon={ShoppingCart} iconColor="bg-success" />
        <StatCard title="Products" value={totalProducts.toString()} change="3 low stock" changeType="negative" icon={Package} iconColor="bg-warning" />
        <StatCard title="Customers" value={totalCustomers.toString()} change="+2 new this week" changeType="positive" icon={Users} iconColor="bg-info" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Weekly Sales */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Weekly Sales</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 91%)', fontSize: '12px' }}
                formatter={(value: number) => [`AED ${value}`, 'Sales']}
              />
              <Bar dataKey="sales" fill="hsl(217, 91%, 50%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sales by Category */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Sales by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {categoryData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [`${value}%`, 'Share']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {categoryData.map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                  <span className="text-muted-foreground">{cat.name}</span>
                </div>
                <span className="font-medium text-card-foreground">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Selling Products */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topSellingProducts.map((product, i) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-sm text-card-foreground">{product.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-card-foreground">AED {product.revenue}</p>
                  <p className="text-xs text-muted-foreground">{product.sold} sold</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Recent Sales</h3>
          <div className="space-y-3">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div>
                  <p className="text-sm font-medium text-card-foreground">{sale.invoiceNo}</p>
                  <p className="text-xs text-muted-foreground">{sale.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-card-foreground">AED {sale.total.toFixed(2)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    sale.status === 'completed' ? 'bg-success/10 text-success' :
                    sale.status === 'refunded' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {sale.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
