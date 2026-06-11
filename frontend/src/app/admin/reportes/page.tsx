'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api/analytics'
import { AlertTriangle, Loader2, TrendingUp, Package, Scissors } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

// ── Date range presets ─────────────────────────────────────────────────────────
type Preset = '7d' | '30d' | '90d'
function getRange(preset: Preset): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - (preset === '7d' ? 6 : preset === '30d' ? 29 : 89))
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { from: fmt(from), to: fmt(to) }
}

const COLORS = ['#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
const PIE_COLORS = { accepted: '#22c55e', rejected: '#ef4444', pending: '#f59e0b' }

// ── Small chart card wrapper ─────────────────────────────────────────────────
function ChartCard({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-brand-600" /> {title}
      </h2>
      {children}
    </div>
  )
}

export default function AdminReportesPage() {
  const [preset, setPreset] = useState<Preset>('30d')
  const { from, to } = getRange(preset)

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['analytics-sales', from, to],
    queryFn: () => analyticsApi.getSales(from, to),
  })
  const { data: topData, isLoading: topLoading } = useQuery({
    queryKey: ['analytics-top', from, to],
    queryFn: () => analyticsApi.getTopProducts(from, to),
  })
  const { data: convData, isLoading: convLoading } = useQuery({
    queryKey: ['analytics-conversion'],
    queryFn: () => analyticsApi.getConversion(),
  })
  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ['analytics-cat', from, to],
    queryFn: () => analyticsApi.getRevenueByCategory(from, to),
  })
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['analytics-low-stock'],
    queryFn: () => analyticsApi.getLowStock(),
  })

  const sales = salesData?.data ?? []
  const topProducts = topData?.data ?? []
  const conv = convData?.data
  const categories = catData?.data ?? []
  const lowStock = stockData?.data ?? []

  const convPie = conv ? [
    { name: 'Aceptadas', value: conv.accepted },
    { name: 'Rechazadas', value: conv.rejected },
    { name: 'Pendientes', value: conv.pending },
  ] : []

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-0.5">Analíticas de ventas e inventario</p>
        </div>

        {/* Preset selector */}
        <div className="flex rounded-xl border border-gray-300 overflow-hidden text-sm">
          {(['7d', '30d', '90d'] as Preset[]).map(p => (
            <button key={p} onClick={() => setPreset(p)}
              className={`px-4 py-2 font-medium transition ${
                preset === p ? 'bg-brand-700 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {p === '7d' ? 'Últ. 7 días' : p === '30d' ? 'Últ. 30 días' : 'Últ. 90 días'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Gráfico de ventas ── */}
      <ChartCard title="Ventas diarias" icon={TrendingUp}>
        {salesLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
          </div>
        ) : sales.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Sin datos para el período seleccionado
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={sales} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} width={60}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#6d28d9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Top productos + Conversión ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Top 10 productos por ingresos" icon={Package}>
          {topLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : topProducts.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sin datos
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProducts} layout="vertical" margin={{ left: 10, right: 20, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="productName" width={120}
                  tick={{ fontSize: 10 }} tickFormatter={n => n.length > 16 ? n.slice(0, 16) + '…' : n} />
                <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#6d28d9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Conversión de cotizaciones" icon={Scissors}>
          {convLoading ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
            </div>
          ) : !conv || conv.total === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Sin cotizaciones registradas
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={convPie} cx="50%" cy="50%" outerRadius={70}
                    dataKey="value" nameKey="name" label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    <Cell fill={PIE_COLORS.accepted} />
                    <Cell fill={PIE_COLORS.rejected} />
                    <Cell fill={PIE_COLORS.pending} />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 mt-1">
                Tasa de conversión: <strong>{conv.conversionRate}%</strong>
                <span className="text-gray-400 ml-2">({conv.accepted} / {conv.total})</span>
              </p>
            </div>
          )}
        </ChartCard>
      </div>

      {/* ── Revenue por categoría ── */}
      <ChartCard title="Revenue por categoría" icon={TrendingUp}>
        {catLoading ? (
          <div className="flex items-center justify-center h-48 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
          </div>
        ) : categories.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Sin datos para el período
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categories} margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="categoryName" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={60}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {categories.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>

      {/* ── Inventario bajo stock ── */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
          <h2 className="font-semibold text-gray-900 text-sm">
            Bajo inventario
            {lowStock.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {lowStock.length} variantes
              </span>
            )}
          </h2>
        </div>
        {stockLoading ? (
          <div className="flex items-center justify-center h-32 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Cargando…
          </div>
        ) : lowStock.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
            Inventario en buen estado ✓
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-2.5 font-medium text-gray-600 text-xs">Producto</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">SKU</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs">Talla / Color</th>
                <th className="text-right px-5 py-2.5 font-medium text-gray-600 text-xs">Stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lowStock.map((item, i) => (
                <tr key={i} className={item.stockQuantity === 0 ? 'bg-red-50' : ''}>
                  <td className="px-5 py-3 font-medium text-gray-900">{item.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{item.sku}</td>
                  <td className="px-4 py-3 text-gray-600">{item.size} / {item.color}</td>
                  <td className="px-5 py-3 text-right">
                    <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                      item.stockQuantity === 0
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {item.stockQuantity === 0 ? 'AGOTADO' : `${item.stockQuantity} uds.`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
