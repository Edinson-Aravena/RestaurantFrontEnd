import { redirect } from "next/navigation";
import Heading from "@/components/ui/Heading";
import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/utils";
import Link from "next/link";
import OrderHistoryFilters from "@/components/admin/OrderHistoryFilters";

async function getAllOrders(
  page: number,
  pageSize: number,
  filterCategory?: string,
  filterTable?: string,
  filterType?: string
) {
  const skip = (page - 1) * pageSize;

  const whereClause: any = {};

  // Filtro de categoría
  if (filterCategory) {
    whereClause.orderProducts = {
      some: {
        product: {
          categoryId: parseInt(filterCategory)
        }
      }
    };
  }

  // Filtro por nombre de mesa (solo aplica a órdenes locales)
  if (filterTable) {
    whereClause.name = filterTable;
  }

  // Determinar qué órdenes buscar según el filtro de tipo
  const shouldFetchQuiosco = !filterType || filterType === 'local';
  const shouldFetchDelivery = !filterType || filterType === 'delivery';

  // Si hay filtro de mesa, solo buscar en local
  if (filterTable) {
    const quioscoOrders = await prisma.order.findMany({
      take: pageSize,
      skip,
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      include: {
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    });

    const totalQuiosco = await prisma.order.count({ where: whereClause });

    const mappedQuioscoOrders = quioscoOrders.map(order => ({
      id: order.id,
      type: 'QUIOSCO' as const,
      name: order.name,
      total: order.total,
      date: order.date,
      orderProducts: order.orderProducts
    }));

    return { orders: mappedQuioscoOrders, totalOrders: totalQuiosco };
  }

  // Obtener órdenes según el filtro de tipo
  const [quioscoOrders, deliveryOrders, totalQuiosco, totalDelivery] = await Promise.all([
    // Órdenes del restaurant (solo si aplica)
    shouldFetchQuiosco ? prisma.order.findMany({
      take: pageSize,
      skip,
      where: whereClause,
      orderBy: {
        date: 'desc'
      },
      include: {
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    }) : Promise.resolve([]),
    // Órdenes de delivery (solo si aplica)
    shouldFetchDelivery ? prisma.deliveryOrder.findMany({
      where: {
        status: 'ENTREGADO'
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        client: {
          select: {
            name: true
          }
        },
        address: {
          select: {
            address: true,
            neighborhood: true
          }
        },
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    }) : Promise.resolve([]),
    shouldFetchQuiosco ? prisma.order.count({ where: whereClause }) : Promise.resolve(0),
    shouldFetchDelivery ? prisma.deliveryOrder.count({ where: { status: 'ENTREGADO' } }) : Promise.resolve(0)
  ]);

  // Mapear órdenes de delivery al formato unificado
  const mappedDeliveryOrders = deliveryOrders.map(order => {
    const total = order.orderProducts.reduce((sum, op) => 
      sum + (Number(op.quantity) * Number(op.product.price)), 0
    );
    
    return {
      id: order.id,
      type: 'DELIVERY' as const,
      customerName: order.clientName || order.client?.name || 'Usuario eliminado',
      address: order.deliveryAddress && order.deliveryNeighborhood 
        ? `${order.deliveryAddress}, ${order.deliveryNeighborhood}` 
        : (order.address ? `${order.address.address}, ${order.address.neighborhood}` : 'Dirección no disponible'),
      total,
      date: new Date(Number(order.timestamp)),
      orderProducts: order.orderProducts.map(op => ({
        quantity: Number(op.quantity),
        product: op.product
      }))
    };
  });

  // Mapear órdenes del restaurant
  const mappedQuioscoOrders = quioscoOrders.map(order => ({
    id: order.id,
    type: 'QUIOSCO' as const,
    name: order.name,
    total: order.total,
    date: order.date,
    orderProducts: order.orderProducts
  }));

  // Combinar todas las órdenes y ordenar por fecha
  const allOrders = [...mappedQuioscoOrders, ...mappedDeliveryOrders]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, pageSize);

  const totalOrders = totalQuiosco + totalDelivery;

  return { orders: allOrders, totalOrders };
}

export default async function OrderHistoryPage({
  searchParams
}: {
  searchParams: {
    page?: string;
    category?: string;
    table?: string;
    type?: string;
  }
}) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 10;
  const filterCategory = searchParams.category;
  const filterTable = searchParams.table;
  const filterType = searchParams.type;

  if (page < 1) redirect('/admin/orders/history');

  // Obtener todas las categorías para los filtros
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' }
  });

  const categoriesForFilter = categories.map(cat => ({
    ...cat,
    id: Number(cat.id)
  }));

  const { orders, totalOrders } = await getAllOrders(page, pageSize, filterCategory, filterTable, filterType);

  const totalPages = Math.ceil(totalOrders / pageSize);

  if (page > totalPages && totalPages > 0) redirect('/admin/orders/history');

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <Heading>Historial de Órdenes</Heading>
            <p className="text-gray-600 mt-2">Registro completo de todas las órdenes completadas</p>
          </div>
          <Link
            href="/admin/orders"
            className="text-amber-600 hover:text-amber-700 font-semibold flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver a Órdenes Pendientes
          </Link>
        </div>
        
        {/* Resumen rápido */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl">
                📋
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900">Total Órdenes</p>
                <p className="text-2xl font-bold text-blue-700">{totalOrders}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl">
                🏪
              </div>
              <div>
                <p className="text-sm font-semibold text-purple-900">Órdenes Local</p>
                <p className="text-2xl font-bold text-purple-700">
                  {orders.filter(o => o.type === 'QUIOSCO').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-2xl">
                🏍️
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-900">Órdenes Delivery</p>
                <p className="text-2xl font-bold text-orange-700">
                  {orders.filter(o => o.type === 'DELIVERY').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                📄
              </div>
              <div>
                <p className="text-sm font-semibold text-green-900">Página Actual</p>
                <p className="text-2xl font-bold text-green-700">{page} de {totalPages}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <OrderHistoryFilters
        categories={categoriesForFilter as any}
        filterCategory={filterCategory}
        filterTable={filterTable}
        filterType={filterType}
      />

      {/* Tabla de órdenes */}
      {orders.length > 0 ? (
        <>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Cliente/Mesa</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Productos</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Total</th>
                    <th className="px-6 py-4 text-left text-sm font-bold">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {orders.map((order, index) => {
                    const isDelivery = order.type === 'DELIVERY';
                    return (
                      <tr
                        key={`${order.type}-${order.id}`}
                        className={`hover:bg-gray-50 transition-colors ${
                          isDelivery ? 'bg-blue-50/30' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                        }`}
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          #{order.id}
                        </td>
                        <td className="px-6 py-4">
                          {isDelivery ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">
                              📱 Delivery
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">
                              🏪 Local
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 ${isDelivery ? 'bg-blue-500' : 'bg-amber-500'} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                              {isDelivery ? (order as any).customerName.charAt(0) : (order as any).name}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {isDelivery ? (order as any).customerName : `Mesa ${(order as any).name}`}
                              </div>
                              {isDelivery && (
                                <div className="text-xs text-gray-500">{(order as any).address}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {order.orderProducts.map((item, idx) => (
                              <div key={idx} className="text-sm text-gray-600">
                                <span className="font-semibold text-gray-900">{item.quantity}x</span> {item.product.name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-lg font-bold text-gray-900">
                          {formatCurrency(order.total)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {formatDate(order.date)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2">
                  {/* Botón Anterior */}
                  <Link
                    href={page > 1 ? `/admin/orders/history?page=${page - 1}${filterCategory ? `&category=${filterCategory}` : ''}${filterTable ? `&table=${filterTable}` : ''}${filterType ? `&type=${filterType}` : ''}` : '#'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      page > 1
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    Anterior
                  </Link>

                  {/* Números de página */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                    // Mostrar solo páginas cercanas a la actual
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <Link
                          key={pageNum}
                          href={`/admin/orders/history?page=${pageNum}${filterCategory ? `&category=${filterCategory}` : ''}${filterTable ? `&table=${filterTable}` : ''}${filterType ? `&type=${filterType}` : ''}`}
                          className={`w-10 h-10 flex items-center justify-center rounded-lg font-semibold transition-colors ${
                            pageNum === page
                              ? 'bg-amber-500 text-white shadow-md'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    } else if (pageNum === page - 2 || pageNum === page + 2) {
                      return (
                        <span key={pageNum} className="px-2 text-gray-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}

                  {/* Botón Siguiente */}
                  <Link
                    href={page < totalPages ? `/admin/orders/history?page=${page + 1}${filterCategory ? `&category=${filterCategory}` : ''}${filterTable ? `&table=${filterTable}` : ''}${filterType ? `&type=${filterType}` : ''}` : '#'}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      page < totalPages
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed pointer-events-none'
                    }`}
                  >
                    Siguiente
                  </Link>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl font-semibold text-gray-700 mb-2">No se encontraron órdenes</p>
          <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      )}
    </div>
  );
}
