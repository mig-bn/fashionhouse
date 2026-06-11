'use client'

import type { Category } from '@/types/product'

interface Props {
  categories: Category[]
  selected: string | null
  onChange: (id: string | null) => void
}

export default function CategoryFilter({ categories, selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
          selected === null
            ? 'bg-brand-700 text-white border-brand-700'
            : 'text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700'
        }`}
      >
        Todos
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => onChange(selected === cat.id ? null : cat.id)}
          className={`px-4 py-1.5 rounded-full text-sm font-medium border transition ${
            selected === cat.id
              ? 'bg-brand-700 text-white border-brand-700'
              : 'text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-700'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
