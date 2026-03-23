import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { toast } from 'react-toastify';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Select, SelectItem, BarList, BadgeDelta } from '@tremor/react';
import { fetchDashboardStats, fetchStatsByMonth } from '../../api/dashboardApi';
import ExportReportDialog from './ExportReportDialog';

// ═══════════════════════════════════════════════════════════════════════
// 📊 ADMIN DASHBOARD — Organic Minimalism · Zero-Waste Analytics
// ═══════════════════════════════════════════════════════════════════════
//
// Mỗi section (biểu đồ, bảng) có bộ lọc tháng/năm RIÊNG LẺ.
// Khi thay đổi tháng/năm → gọi API /stats-by-month lấy data mới cho section đó.
// ═══════════════════════════════════════════════════════════════════════

// ─── CONSTANTS ──────────────────────────────────────────────────────────

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: `Tháng ${i + 1}`,
}));
const YEARS = ['2025', '2026'];
const DONUT_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

// ─── CARD ───────────────────────────────────────────────────────────────

const Card = ({ children, className = '' }) => (
  <div className={`rounded-xl border shadow-sm ${className.includes('bg-') ? '' : 'bg-white border-emerald-100/60'} ${className}`}>
    {children}
  </div>
);

// ─── KPI CARD ───────────────────────────────────────────────────────────

const KPICard = ({ title, value, icon, trend, trendLabel, accent = 'emerald' }) => {
  const accents = {
    emerald: { cardBg: 'bg-emerald-50/50', cardBorder: 'border-emerald-100/60', text: 'text-emerald-700/80', value: 'text-emerald-950', badgeInfo: 'text-emerald-600', iconBg: 'bg-emerald-100', iconBorder: 'border-emerald-200/50', iconColor: 'text-emerald-700', badgeClass: 'bg-emerald-100 text-emerald-700' },
    teal: { cardBg: 'bg-teal-50/50', cardBorder: 'border-teal-100/60', text: 'text-teal-700/80', value: 'text-teal-950', badgeInfo: 'text-teal-600', iconBg: 'bg-teal-100', iconBorder: 'border-teal-200/50', iconColor: 'text-teal-700', badgeClass: 'bg-teal-100 text-teal-700' },
    cyan: { cardBg: 'bg-cyan-50/50', cardBorder: 'border-cyan-100/60', text: 'text-cyan-700/80', value: 'text-cyan-950', badgeInfo: 'text-cyan-600', iconBg: 'bg-cyan-100', iconBorder: 'border-cyan-200/50', iconColor: 'text-cyan-700', badgeClass: 'bg-cyan-100 text-cyan-700' },
    green: { cardBg: 'bg-green-50/50', cardBorder: 'border-green-100/60', text: 'text-green-700/80', value: 'text-green-950', badgeInfo: 'text-green-600', iconBg: 'bg-green-100', iconBorder: 'border-green-200/50', iconColor: 'text-green-700', badgeClass: 'bg-green-100 text-green-700' },
  };
  const theme = accents[accent] || accents.emerald;

  return (
    <Card className={`p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group ${theme.cardBg} ${theme.cardBorder}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm font-medium ${theme.text}`}>{title}</p>
          <p className={`text-2xl font-bold mt-1 tracking-tight ${theme.value}`}>{value}</p>
          {trend !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${theme.badgeClass}`}>
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
              <span className={`text-xs ${theme.badgeInfo} opacity-80`}>{trendLabel}</span>
            </div>
          )}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-sm
                        ${theme.iconBg} border ${theme.iconBorder} ${theme.iconColor}
                        group-hover:scale-110 group-hover:rotate-6 transition-all duration-300`}>
          {icon}
        </div>
      </div>
    </Card>
  );
};

// ─── INLINE MONTH/YEAR FILTER ───────────────────────────────────────────

const InlineFilter = ({ month, year, onMonthChange, onYearChange }) => (
  <div className="flex items-center gap-1">
    <Select value={month} onValueChange={onMonthChange} placeholder="Tháng"
      className="!w-[119px] !min-w-0 [&>button]:!py-1 [&>button]:!px-2 [&>button]:!text-xs">
      {MONTHS.map((m) => (
        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
      ))}
    </Select>
    <Select value={year} onValueChange={onYearChange} placeholder="Năm"
      className="!w-[85px] !min-w-0 [&>button]:!py-1 [&>button]:!px-2 [&>button]:!text-xs">
      {YEARS.map((y) => (
        <SelectItem key={y} value={y}>{y}</SelectItem>
      ))}
    </Select>
  </div>
);

// ─── CARD HEADER ────────────────────────────────────────────────────────

const CardHeader = ({ title, month, year, onMonthChange, onYearChange, extra }) => (
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
    <h2 className="text-lg font-bold text-emerald-900">{title}</h2>
    <div className="flex items-center gap-2">
      {extra}
      <InlineFilter month={month} year={year} onMonthChange={onMonthChange} onYearChange={onYearChange} />
    </div>
  </div>
);

// ─── TOOLTIPS ───────────────────────────────────────────────────────────

const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-emerald-200/50 shadow-md p-3 min-w-[150px]">
      <p className="text-xs font-medium text-emerald-500/70 mb-1">{label}</p>
      <p className="text-base font-bold text-emerald-900">
        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
          .format(payload[0].value)}
      </p>
      {payload[0].payload?.orders && (
        <p className="text-xs text-emerald-500/50 mt-0.5">{payload[0].payload.orders} đơn hàng</p>
      )}
    </div>
  );
};

const PlasticTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl border border-emerald-200/50 shadow-md p-3 min-w-[140px]">
      <p className="text-xs font-medium text-emerald-500/70 mb-1">{label}</p>
      <p className="text-base font-bold text-emerald-800">{payload[0].value.toFixed(1)} kg</p>
      <p className="text-xs text-emerald-500/50 mt-0.5">Nhựa cắt giảm</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════
// CUSTOM HOOK: per-section filter with API fetching
// ═══════════════════════════════════════════════════════════════════════

const useFilteredSection = (sectionName, initialData) => {
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [data, setData] = useState(initialData);
  const [isInitial, setIsInitial] = useState(true);

  const handleMonthChange = useCallback(async (newMonth) => {
    setMonth(newMonth);
    setIsInitial(false);
    try {
      const res = await fetchStatsByMonth(sectionName, newMonth, year);
      setData(res.data);
    } catch { toast.error(`Lỗi khi tải dữ liệu ${sectionName}`); }
  }, [sectionName, year]);

  const handleYearChange = useCallback(async (newYear) => {
    setYear(newYear);
    setIsInitial(false);
    try {
      const res = await fetchStatsByMonth(sectionName, month, newYear);
      setData(res.data);
    } catch { toast.error(`Lỗi khi tải dữ liệu ${sectionName}`); }
  }, [sectionName, month]);

  // Update data when initial data changes (first load)
  useEffect(() => {
    if (isInitial) setData(initialData);
  }, [initialData, isInitial]);

  return { month, year, data, handleMonthChange, handleYearChange };
};

// ═══════════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════════

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // ── Initial data (loaded once) ──
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [newOrders, setNewOrders] = useState(0);
  const [newItems, setNewItems] = useState(0);
  const [newUsers, setNewUsers] = useState(0);
  const [initChartData, setInitChartData] = useState([]);
  const [initOrderPerformance, setInitOrderPerformance] = useState([]);
  const [initCategoryRevenue, setInitCategoryRevenue] = useState([]);
  const [initTopCustomers, setInitTopCustomers] = useState([]);
  const [initTopProducts, setInitTopProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => { loadDashboardData(); }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetchDashboardStats();
      const d = res.data;
      setMonthlyRevenue(d.monthlyRevenue || 0);
      setNewOrders(d.newOrders || 0);
      setNewItems(d.newItems || 0);
      setNewUsers(d.newUsers || 0);
      setInitChartData(d.revenueByDay || []);
      setInitOrderPerformance(d.orderPerformance || []);
      setInitCategoryRevenue(d.revenueByCategory || []);
      setInitTopCustomers(d.topCustomers || []);
      setInitTopProducts(d.topProducts || []);
      setLowStockProducts(d.lowStockProducts || []);
    } catch (error) {
      console.error('Dashboard load error:', error);
      toast.error('Không thể tải dữ liệu thống kê');
    } finally {
      setLoading(false);
    }
  };

  // ── Per-section independent filters ──
  const revenueFilter = useFilteredSection('revenue', initChartData);
  const plasticFilter = useFilteredSection('revenue', initChartData); // Cùng chung API với revenue nhưng state độc lập
  const productsFilter = useFilteredSection('products', initTopProducts);
  const customersFilter = useFilteredSection('customers', initTopCustomers);
  const categoriesFilter = useFilteredSection('categories', initCategoryRevenue);
  const ordersFilter = useFilteredSection('orders', initOrderPerformance);

  // ── FORMAT ──
  const fmtVND = (v) => new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0
  }).format(v);

  const fmtShort = (v) => {
    if (v >= 1e6) return `${(v / 1e6).toFixed(1)}tr`;
    if (v >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
    return v.toString();
  };

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── DERIVED DATA ──
  const chartData = revenueFilter.data || [];
  const topProducts = productsFilter.data || [];
  const topCustomers = customersFilter.data || [];
  const categoryRevenue = categoriesFilter.data || [];

  const plasticChartData = useMemo(() =>
    (plasticFilter.data || []).map(d => ({ date: d.date, plastic: (d.items || 0) * 0.1 })),
    [plasticFilter.data]
  );

  const totalPlasticReduced = useMemo(() => (newItems * 0.1).toFixed(1), [newItems]);

  const categoryBarData = useMemo(() =>
    categoryRevenue.map(c => ({ name: c.category, value: c.revenue })),
    [categoryRevenue]
  );

  const orderPerformanceData = useMemo(() => {
    if (ordersFilter.data && Array.isArray(ordersFilter.data) && ordersFilter.data.length > 0) {
      return ordersFilter.data;
    }
    return [
      { name: 'Thành công', value: 1 },
      { name: 'Chờ thanh toán', value: 0 },
      { name: 'Hủy', value: 0 },
    ];
  }, [ordersFilter.data]);

  // ── LOADING ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50/30">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-emerald-600 font-medium">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-emerald-50/20 p-4 md:p-6 lg:p-8">
      <div className="max-w-[1440px] mx-auto space-y-6">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">Dashboard</h1>
            <p className="text-sm text-emerald-600/60 mt-1">
              Xin chào <span className="font-medium text-emerald-700">{user?.username || 'Admin'}</span> • {today}
            </p>
          </div>
          <button onClick={() => setExportDialogOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl
                       bg-emerald-600 text-white hover:bg-emerald-700 transition-colors
                       shadow-lg shadow-emerald-600/20">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Xuất Excel / PDF
          </button>
        </div>

        {/* ═══ HÀNG 1 — KPI Cards ═══ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3">
            <KPICard title="Tổng doanh thu" value={fmtVND(monthlyRevenue)} icon="💰" accent="emerald"
              trend={12.5} trendLabel="So với tháng trước" />
          </div>
          <div className="lg:col-span-3">
            <KPICard title="Khách hàng mới" value={newUsers.toLocaleString('vi-VN')} icon="👥" accent="teal"
              trend={8.2} trendLabel="So với tháng trước" />
          </div>
          <div className="lg:col-span-3">
            <KPICard title="Tổng đơn hàng" value={newOrders.toLocaleString('vi-VN')} icon="📦" accent="cyan"
              trend={5.9} trendLabel="So với tháng trước" />
          </div>
          <div className="lg:col-span-3">
            <KPICard title="Nhựa cắt giảm" value={`${totalPlasticReduced} kg`} icon="🌿" accent="green"
              trend={15.3} trendLabel="Tác động tích cực" />
          </div>
        </div>

        {/* ═══ HÀNG 2 — Doanh thu (6) + Nhựa cắt giảm (6) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* AreaChart: Doanh thu — bộ lọc riêng */}
          <Card className="lg:col-span-6 p-5">
            <CardHeader title="Doanh thu"
              month={revenueFilter.month} year={revenueFilter.year}
              onMonthChange={revenueFilter.handleMonthChange}
              onYearChange={revenueFilter.handleYearChange} />
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tealFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" strokeOpacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6ee7b7' }}
                    axisLine={{ stroke: '#a7f3d0' }} tickLine={false}
                    tickFormatter={(v) => { const p = v.split('-'); return `${p[2]}/${p[1]}`; }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6ee7b7' }} axisLine={false}
                    tickLine={false} tickFormatter={fmtShort} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#14b8a6" strokeWidth={2.5}
                    fill="url(#tealFill)" dot={false}
                    activeDot={{ r: 5, fill: '#14b8a6', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-emerald-400/60">
                <div className="text-center"><p className="text-4xl mb-2">📊</p><p>Chưa có dữ liệu</p></div>
              </div>
            )}
          </Card>

          {/* AreaChart: Nhựa cắt giảm — bộ lọc riêng (nền tảng chung với Doanh thu) */}
          <Card className="lg:col-span-6 p-5">
            <CardHeader title="Nhựa cắt giảm (kg)"
              month={plasticFilter.month} year={plasticFilter.year}
              onMonthChange={plasticFilter.handleMonthChange}
              onYearChange={plasticFilter.handleYearChange} />
            {plasticChartData.length > 0 && plasticChartData.some(d => d.plastic > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={plasticChartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="emeraldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d1fae5" strokeOpacity={0.6} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#6ee7b7' }}
                    axisLine={{ stroke: '#a7f3d0' }} tickLine={false}
                    tickFormatter={(v) => { const p = v.split('-'); return `${p[2]}/${p[1]}`; }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6ee7b7' }} axisLine={false}
                    tickLine={false} tickFormatter={(v) => `${v}`} />
                  <Tooltip content={<PlasticTooltip />} />
                  <Area type="monotone" dataKey="plastic" stroke="#10b981" strokeWidth={2.5}
                    fill="url(#emeraldFill)" dot={false}
                    activeDot={{ r: 5, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-emerald-400/60">
                <div className="text-center"><p className="text-4xl mb-2">🌿</p><p>Chưa có dữ liệu</p></div>
              </div>
            )}
          </Card>
        </div>

        {/* ═══ HÀNG 3 — Top sản phẩm (8) + Tồn kho (4) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Top sản phẩm — bộ lọc riêng */}
          <Card className="lg:col-span-8 p-5">
            <CardHeader title="Top sản phẩm bán chạy"
              month={productsFilter.month} year={productsFilter.year}
              onMonthChange={productsFilter.handleMonthChange}
              onYearChange={productsFilter.handleYearChange}
              extra={
                <span className="text-xs font-semibold px-2 py-1 rounded-lg bg-emerald-50
                                text-emerald-600 border border-emerald-200/50">
                  Top {topProducts.length}
                </span>
              }
            />
            {topProducts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-emerald-100/60">
                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-emerald-500/70 uppercase tracking-wider">#</th>
                      <th className="text-left py-2.5 px-2 text-xs font-semibold text-emerald-500/70 uppercase tracking-wider">Sản phẩm</th>
                      <th className="text-right py-2.5 px-2 text-xs font-semibold text-emerald-500/70 uppercase tracking-wider">Đã bán</th>
                      <th className="text-right py-2.5 px-2 text-xs font-semibold text-emerald-500/70 uppercase tracking-wider">Doanh thu</th>
                      <th className="text-right py-2.5 px-2 text-xs font-semibold text-emerald-500/70 uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, i) => (
                      <tr key={p.productId || i} className="border-b border-emerald-50/60 hover:bg-emerald-50/30 transition-colors">
                        <td className="py-3 px-2">
                          <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold
                            ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600'
                              : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-500'}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2.5">
                            {p.image && <img src={p.image} alt="" className="w-8 h-8 rounded-lg object-cover ring-2 ring-emerald-100/50" />}
                            <span className="font-medium text-emerald-900 truncate max-w-[200px]">{p.name || 'Sản phẩm'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-semibold text-emerald-600">{p.totalQuantity}</td>
                        <td className="py-3 px-2 text-right text-emerald-800/70">{fmtVND(p.totalRevenue)}</td>
                        <td className="py-3 px-2 text-right">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100/60 text-emerald-700">
                            Bán chạy
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-10 text-center text-emerald-400/60">
                <p className="text-4xl mb-2">📊</p><p>Chưa có dữ liệu bán hàng</p>
              </div>
            )}
          </Card>

          {/* Cảnh báo tồn kho — không cần filter tháng/năm (real-time stock) */}
          <Card className="lg:col-span-4 p-5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-emerald-900">Cảnh báo tồn kho</h2>
              {lowStockProducts.length > 0 && (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-red-50
                                text-red-600 border border-red-200/50 animate-pulse">
                  {lowStockProducts.length} cảnh báo
                </span>
              )}
            </div>
            {lowStockProducts.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {lowStockProducts.map((p) => {
                  const img = p.images?.find(i => i.isMain) || p.images?.[0];
                  const outOfStock = p.stock === 0;
                  const critical = p.stock > 0 && p.stock <= 3;
                  const sufficient = p.stock > 10;
                  return (
                    <div key={p._id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all
                        hover:-translate-y-0.5 hover:shadow-md
                        ${outOfStock ? 'bg-red-50/60 border-red-200/60'
                          : critical ? 'bg-orange-50/60 border-orange-200/60'
                            : sufficient ? 'bg-emerald-50/60 border-emerald-200/60'
                              : 'bg-amber-50/60 border-amber-200/60'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border
                        ${outOfStock ? 'bg-red-100/80 border-red-200' : critical ? 'bg-orange-100/80 border-orange-200'
                          : sufficient ? 'bg-emerald-100/80 border-emerald-200' : 'bg-amber-100/80 border-amber-200'}`}>
                        {img
                          ? <img src={img.url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          : <span className="text-lg">{sufficient ? '✅' : outOfStock ? '🚫' : '⚠️'}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-emerald-900 truncate">{p.name}</p>
                        <p className="text-xs text-emerald-600/50">{fmtVND(p.price)}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {sufficient ? (
                          <span className="text-emerald-500 text-lg">✅</span>
                        ) : (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full
                            ${outOfStock ? 'bg-red-200/80 text-red-800' : critical ? 'bg-orange-200/80 text-orange-800' : 'bg-amber-200/80 text-amber-800'}`}>
                            {outOfStock ? 'Hết hàng' : `Còn ${p.stock}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center text-emerald-400/60">
                <p className="text-4xl mb-2">✅</p><p>Tất cả sản phẩm đều đủ hàng!</p>
              </div>
            )}
          </Card>
        </div>

        {/* ═══ HÀNG 4 — Top KH (4) + BarList (4) + DonutChart (4) ═══ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Top khách hàng — bộ lọc riêng */}
          <Card className="lg:col-span-4 p-5">
            <CardHeader title="Top khách hàng"
              month={customersFilter.month} year={customersFilter.year}
              onMonthChange={customersFilter.handleMonthChange}
              onYearChange={customersFilter.handleYearChange} />
            {topCustomers.length > 0 ? (
              <div className="space-y-2.5">
                {topCustomers.map((c, i) => (
                  <div key={c.userId || i}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-emerald-50/50 transition-colors">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-100 text-gray-600'
                        : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-50 text-emerald-600'}`}>
                      {i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200
                                    flex items-center justify-center text-emerald-700 text-sm font-bold flex-shrink-0">
                      {c.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-900 truncate">{c.username}</p>
                      <p className="text-xs text-emerald-500/60">{c.orderCount} đơn</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-700 flex-shrink-0">{fmtVND(c.totalSpent)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-emerald-400/60">
                <p className="text-3xl mb-2">👤</p><p>Chưa có dữ liệu</p>
              </div>
            )}
          </Card>

          {/* BarList: Doanh thu theo danh mục — bộ lọc riêng */}
          <Card className="lg:col-span-4 p-5">
            <CardHeader title="Doanh thu theo danh mục"
              month={categoriesFilter.month} year={categoriesFilter.year}
              onMonthChange={categoriesFilter.handleMonthChange}
              onYearChange={categoriesFilter.handleYearChange} />
            {categoryBarData.length > 0 ? (
              <BarList data={categoryBarData} valueFormatter={(v) => fmtShort(v)}
                color="emerald" className="mt-2" />
            ) : (
              <div className="py-8 text-center text-emerald-400/60">
                <p className="text-3xl mb-2">📁</p><p>Chưa có dữ liệu</p>
              </div>
            )}
          </Card>

          {/* DonutChart: Hiệu suất đơn hàng — bộ lọc riêng */}
          <Card className="lg:col-span-4 p-5">
            <CardHeader title="Hiệu suất đơn hàng"
              month={ordersFilter.month} year={ordersFilter.year}
              onMonthChange={ordersFilter.handleMonthChange}
              onYearChange={ordersFilter.handleYearChange} />
            {orderPerformanceData.some(d => d.value > 0) ? (
              <div>
                <div className="flex justify-center mb-4">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={orderPerformanceData} dataKey="value" nameKey="name"
                        cx="50%" cy="50%" innerRadius={50} outerRadius={75}
                        paddingAngle={3} strokeWidth={0}>
                        {orderPerformanceData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {orderPerformanceData.map((d, i) => {
                    const total = orderPerformanceData.reduce((s, x) => s + x.value, 0) || 1;
                    return (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ background: DONUT_COLORS[i] }} />
                          <span className="text-emerald-700">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-emerald-800">{d.value}</span>
                          <span className="text-emerald-500/50 text-xs">({((d.value / total) * 100).toFixed(0)}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-emerald-400/60">
                <p className="text-3xl mb-2">🍩</p><p>Chưa có dữ liệu</p>
              </div>
            )}
          </Card>
        </div>

        {/* ═══ FOOTER ═══ */}
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl
                        bg-white border border-emerald-100/50 shadow-sm">
          <div className="flex items-center gap-3 text-sm text-emerald-600/60">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/50" />
              Hệ thống hoạt động bình thường
            </span>
            <span className="text-emerald-300">•</span>
            <span>Zero-Waste E-commerce</span>
          </div>
          <p className="text-xs text-emerald-400/50 hidden sm:block">
            Cập nhật: {new Date().toLocaleTimeString('vi-VN')}
          </p>
        </div>

      </div>

      {/* ═══ EXPORT DIALOG ═══ */}
      <ExportReportDialog isOpen={exportDialogOpen} onClose={() => setExportDialogOpen(false)} />
    </div>
  );
};

export default Dashboard;