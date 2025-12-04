"use client";

import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  slug: string;
  icon: string;
};

type OrderHistoryFiltersProps = {
  categories: Category[];
  filterCategory?: string;
  filterTable?: string;
  filterType?: string;
};

export default function OrderHistoryFilters({
  categories,
  filterCategory,
  filterTable,
  filterType,
}: OrderHistoryFiltersProps) {
  const router = useRouter();

  const buildUrl = (params: { category?: string; table?: string; type?: string }) => {
    const searchParams = new URLSearchParams();
    searchParams.set('page', '1');
    
    const category = params.category !== undefined ? params.category : filterCategory;
    const table = params.table !== undefined ? params.table : filterTable;
    const type = params.type !== undefined ? params.type : filterType;
    
    if (category) searchParams.set('category', category);
    if (table) searchParams.set('table', table);
    if (type) searchParams.set('type', type);
    
    return `/admin/orders/history?${searchParams.toString()}`;
  };

  const handleCategoryChange = (value: string) => {
    router.push(buildUrl({ category: value }));
  };

  const handleTableChange = (value: string) => {
    // Si selecciona una mesa, automáticamente cambiar a tipo "local"
    if (value) {
      router.push(buildUrl({ table: value, type: 'local' }));
    } else {
      router.push(buildUrl({ table: value }));
    }
  };

  const handleTypeChange = (value: string) => {
    // Si cambia a delivery, limpiar el filtro de mesa
    if (value === 'delivery') {
      router.push(buildUrl({ type: value, table: '' }));
    } else {
      router.push(buildUrl({ type: value }));
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Filtro de Tipo */}
        <div>
          <label htmlFor="type-filter" className="block text-sm font-semibold text-gray-700 mb-2">
            Filtrar por Tipo
          </label>
          <select
            id="type-filter"
            value={filterType || ''}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-700 font-medium cursor-pointer transition-colors hover:border-amber-400"
          >
            <option value="">Todos los pedidos</option>
            <option value="local">🏪 Solo Local (Restaurant)</option>
            <option value="delivery">📱 Solo Delivery (App)</option>
          </select>
        </div>

        {/* Filtro de Categoría */}
        <div>
          <label htmlFor="category-filter" className="block text-sm font-semibold text-gray-700 mb-2">
            Filtrar por Categoría
          </label>
          <select
            id="category-filter"
            value={filterCategory || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-700 font-medium cursor-pointer transition-colors hover:border-amber-400"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de Mesa - Solo visible si no es delivery */}
        <div>
          <label htmlFor="table-filter" className="block text-sm font-semibold text-gray-700 mb-2">
            Filtrar por Mesa
          </label>
          <select
            id="table-filter"
            value={filterTable || ''}
            onChange={(e) => handleTableChange(e.target.value)}
            disabled={filterType === 'delivery'}
            className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-white text-gray-700 font-medium cursor-pointer transition-colors hover:border-amber-400 ${
              filterType === 'delivery' ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''
            }`}
          >
            <option value="">Todas las mesas</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tableNumber) => (
              <option key={tableNumber} value={tableNumber}>
                Mesa {tableNumber}
              </option>
            ))}
          </select>
          {filterType === 'delivery' && (
            <p className="text-xs text-gray-500 mt-1">No aplica para pedidos delivery</p>
          )}
        </div>
      </div>
    </div>
  );
}
