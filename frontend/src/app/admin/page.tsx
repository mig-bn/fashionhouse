'use client'

import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api/analytics'
import { ordersApi } from '@/lib/api/orders'
import Link from 'next/link'
import {
  TrendingUp, ShoppingBag, Users, Scissors,
  AlertTriangle, Clock, ArrowRight, Loader2,
} from 'lucide-react'

function KpiCard({
  label, value, sub, icon: Icon, color, loading,
}: {
  label: string; value: string; sub?: string
  icon: React.ElementType; color: string; loading?: boolean
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        {loading
          ? <div className="h-7 w-24 bg-gray-100 rounded animate-pulse mt-1" />
          : <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        }
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
    refetchInterval: 60_000,
  })

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders-pending'],
    queryFn: () => ordersApi.getAll({ status: 'PENDING', size: 5 }),
    refetchInterval: 30_000,
  })

  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ['analytics-low-stock'],
    queryFn: () => analyticsApi.getLowStock(),
  })

  const summary = summaryData?.data
  const pendingOrders = ordersData?.data ?? []
  const lowStock = stockData?.data ?? []

  const fmtCurrency = (n?: number) =>
    n != null ? `$${n.toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '—'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Vista general del negocio</p>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Revenue del mes" loading={summaryLoading}
          value={fmtCurrency(summary?.revenueThisMonth)}
          sub={`Total: ${fmtCurrency(summary?.totalRevenue)}`}
          icon={TrendingUp} color="bg-green-100 text-green-600" />

        <KpiCard label="Órdenes del mes" loading={summaryLoading}
          value={String(summary?.ordersThisMonth ?? '—')}
          sub={`Total: ${summary?.totalOrders ?? '—'}`}
          icon={ShoppingBag} color="bg-blue-100 text-blue-600" />

        <KpiCard label="Clientes nuevos" loading={summaryLoading}
          value={String(summary?.newCustomersThisMonth ?? '—')}
          sub={`Total: ${summary?.totalCustomers ?? '—'}`}
          icon={Users} color="bg-purple-100 text-purple-600" />

        <KpiCard label="Órdenes pendientes" loading={summaryLoading}
          value={String(summary?.pendingOrders ?? '—')}
          sub="Requieren atención"
          icon={Clock}
          color={summary?.pendingOrders && summary.pendingOrders > 0
            ? 'bg-yellow-100 text-yellow-600'
            : 'bg-gray-100 text-gray-500'} />

        <KpiCard label="Cotizaciones activas" loading={summaryLoading}
          value={String(summary?.activeQuotations ?? '—')}
          sub="En estado PENDING"
          icon={Scissors} color="bg-orange-100 text-orange-600" />

        <KpiCard label="Conversión cotizaciones" loading={summaryLoading}
          value={summary?.conversionRate != null ? `${summary.conversionRate}%` : '—'}
          sub="Aceptadas / total"
          icon={TrendingUp} color="bg-indigo-100 text-indigo-600" />
      </div>

      {/* ── Bottom row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Últimas órdenes pendientes */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Órdenes pendientes</h2>
            <Link href="/admin/ordenes?status=PENDING"
              className="text-xs text-brand-700 hover:underline flex items-center gap-1">
              Ver todas <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {ordersLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando…
            </div>
          ) : pendingOrders.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              No hay órdenes pendientes 🎉
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {pendingOrders.map(order => (
                <Link key={order.id} href={`/admin/ordenes/${order.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition">
                  <div>
                    <span className="text-sm font-medium text-gray-900 font-mono">
                      #{order.id.slice(0, 8)}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">
                      {order.itemCount} item(s)
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {order.currency} {order.total.toLocaleString()}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Alertas de bajo stock */}
        <div className="bg-white rounded-2xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Bajo inventario
            </h2>
            <Link href="/admin/reportes"
              className="text-xs text-brand-700 hover:underline flex items-center gap-1">
              Ver reporte <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {stockLoading ? (
            <div className="flex items-center justify-center h-32 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Cargando…
            </div>
          ) : lowStock.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
              Inventario en buen estado ✓
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowStock.slice(0, 5).map((item, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                    <p className="text-xs text-gray-400">
                      {item.size} / {item.color} · <span className="font-mono">{item.sku}</span>
                    </p>
                  </div>
                  <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${
                    item.stockQuantity === 0
                      ? 'bg-red-100 text-red-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.stockQuantity === 0 ? 'Sin stock' : `${item.stockQuantity} uds.`}
                  </span>
                </div>
              ))}
              {lowStock.length > 5 && (
                <div className="px-5 py-2 text-xs text-gray-400 text-center">
                  +{lowStock.length - 5} más con bajo stock
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
