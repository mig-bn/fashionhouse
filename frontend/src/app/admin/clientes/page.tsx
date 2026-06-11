'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Users, Star, Search } from 'lucide-react'
import { customersApi } from '@/lib/api/customers'
import { formatCurrency, formatDate } from '@/lib/utils/formatters'

export default function AdminClientesPage() {
  const [trustedOnly, setTrustedOnly] = useState<boolean | undefined>(undefined)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', trustedOnly],
    queryFn: () => customersApi.getAll(0, 100, trustedOnly),
  })

  const customers = ((data as any)?.data?.content ?? []).filter((c: any) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      c.firstName?.toLowerCase().includes(q) ||
      c.lastName?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q)
    )
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Users className="w-6 h-6 text-brand-700" />
        <h1 className="text-xl font-bold text-gray-900">Clientes</h1>
        <span className="ml-auto text-sm text-gray-400">{customers.length} clientes</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email o teléfono…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <button
          onClick={() => setTrustedOnly(undefined)}
          className={`px-4 py-2 rounded-xl text-sm font-medium border transition ${
            trustedOnly === undefined
              ? 'bg-brand-700 text-white border-brand-700'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Todos
        </button>
        <button
          onClick={() => setTrustedOnly(true)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition ${
            trustedOnly === true
              ? 'bg-brand-700 text-white border-brand-700'
              : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Star className="w-3.5 h-3.5" /> VIP
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2" />
          <p>No se encontraron clientes.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Cliente</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Contacto</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Órdenes</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Cot.</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">LTV</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Última orden</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Etiquetas</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/clientes/${c.id}`}
                      className="flex items-center gap-2 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs shrink-0">
                        {c.firstName?.[0]}{c.lastName?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-brand-700 transition flex items-center gap-1">
                          {c.firstName} {c.lastName}
                          {c.trustedClient && <Star className="w-3 h-3 text-brand-600 fill-brand-600" />}
                        </p>
                        <p className="text-xs text-gray-400">{c.email ?? '—'}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-800">{c.orderCount}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{c.quotationCount}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(c.lifetimeValue)}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap max-w-[140px]">
                      {(c.internalTags ?? []).slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
