import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from 'recharts';
import { Calendar, Download, TrendingUp, DollarSign, ShoppingCart, Package } from 'lucide-react';
import { monthlySalesData, dailySalesData, topSellingProducts } from '@/data/mockData';
import StatCard from '@/components/dashboard/StatCard';

const profitData = [
  { month: 'Jan', revenue: 32500, cost: 22750, profit: 9750 },
  { month: 'Feb', revenue: 28900, cost: 20230, profit: 8670 },
  { month: 'Mar', revenue: 35200, cost: 24640, profit: 10560 },
  { month: 'Apr', revenue: 31800, cost: 22260, profit: 9540 },
  { month: 'May', revenue: 38500, cost: 26950, profit: 11550 },
  { month: 'Jun', revenue: 42100, cost: 29470, profit: 12630 },
];

const Reports = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Track your business performance</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium hover:bg-muted transition-colors">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Monthly Revenue" value="AED 52,100" change="+8.1% vs last month" changeType="positive" icon={DollarSign} iconColor="bg-primary" />
        <StatCard title="Monthly Profit" value="AED 15,630" change="+5.2% vs last month" changeType="positive" icon={TrendingUp} iconColor="bg-success" />
        <StatCard title="Avg. Order Value" value="AED 28.50" change="-2.1% vs last month" changeType="negative" icon={ShoppingCart} iconColor="bg-warning" />
        <StatCard title="Items Sold" value="1,827" change="+12.3% vs last month" changeType="positive" icon={Package} iconColor="bg-info" />
      </div>

      {/* Revenue & Profit Chart */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Revenue vs Profit</h3>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={profitData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
            <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 91%)', fontSize: '12px' }} />
            <Area type="monotone" dataKey="revenue" stackId="1" stroke="hsl(217, 91%, 50%)" fill="hsl(217, 91%, 50%)" fillOpacity={0.15} strokeWidth={2} />
            <Area type="monotone" dataKey="profit" stackId="2" stroke="hsl(160, 84%, 39%)" fill="hsl(160, 84%, 39%)" fillOpacity={0.15} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Sales Trend */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Monthly Sales Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 91%)', fontSize: '12px' }} formatter={(v: number) => [`AED ${v.toLocaleString()}`, 'Sales']} />
              <Line type="monotone" dataKey="sales" stroke="hsl(217, 91%, 50%)" strokeWidth={2.5} dot={{ fill: 'hsl(217, 91%, 50%)', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Orders */}
        <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
          <h3 className="text-base font-semibold text-card-foreground mb-4">Daily Orders This Week</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dailySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 46%)" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid hsl(220, 13%, 91%)', fontSize: '12px' }} />
              <Bar dataKey="orders" fill="hsl(160, 84%, 39%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="bg-card rounded-xl border border-border p-5 shadow-sm">
        <h3 className="text-base font-semibold text-card-foreground mb-4">Top Selling Products</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 font-medium text-muted-foreground">#</th>
              <th className="text-left py-3 font-medium text-muted-foreground">Product</th>
              <th className="text-right py-3 font-medium text-muted-foreground">Quantity Sold</th>
              <th className="text-right py-3 font-medium text-muted-foreground">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {topSellingProducts.map((p, i) => (
              <tr key={p.name} className="border-b border-border last:border-0">
                <td className="py-3"><span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span></td>
                <td className="py-3 font-medium text-foreground">{p.name}</td>
                <td className="py-3 text-right text-muted-foreground">{p.sold}</td>
                <td className="py-3 text-right font-semibold text-foreground">AED {p.revenue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
