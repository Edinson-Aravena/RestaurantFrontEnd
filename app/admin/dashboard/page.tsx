import { prisma } from "@/src/lib/prisma";
import { formatCurrency } from "@/src/utils";
import Link from "next/link";
import { RevenueComparisonChart, OrderDistributionChart, TopProductsChart } from "@/components/admin/DashboardCharts";
import DashboardRefreshButton from "@/components/admin/DashboardRefreshButton";

async function getDashboardStats() {
  const now = new Date();
  
  // Inicio del día actual (00:00:00)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Inicio de la semana (lunes)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  // Inicio del mes
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Inicio del año
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  // Ganancias por período (solo órdenes entregadas)
  const [dailyRevenue, weeklyRevenue, monthlyRevenue, yearlyRevenue, totalOrders, totalProducts, avgOrderValue, topProducts, 
    // Ventas QUIOSCO (Local)
    dailyQuiosco, weeklyQuiosco, monthlyQuiosco, yearlyQuiosco, totalQuiosco,
    // Ventas DELIVERY (App Móvil) 
    dailyDelivery, weeklyDelivery, monthlyDelivery, yearlyDelivery, totalDelivery
  ] = await Promise.all([
    // Ganancias del día (TOTAL)
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: startOfDay },
        orderDeliveredAt: { not: null }
      }
    }),
    // Ganancias de la semana (TOTAL)
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: startOfWeek },
        orderDeliveredAt: { not: null }
      }
    }),
    // Ganancias del mes (TOTAL)
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: startOfMonth },
        orderDeliveredAt: { not: null }
      }
    }),
    // Ganancias del año (TOTAL)
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: startOfYear },
        orderDeliveredAt: { not: null }
      }
    }),
    // Total de órdenes entregadas
    prisma.order.count({
      where: { orderDeliveredAt: { not: null } }
    }),
    // Total de productos disponibles
    prisma.product.count(),
    // Valor promedio de orden
    prisma.order.aggregate({
      _avg: { total: true },
      where: { orderDeliveredAt: { not: null } }
    }),
    // Productos más vendidos (ambos sistemas)
    prisma.orderProducts.groupBy({
      by: ['productId'],
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 5
    }),
    
    // ========== VENTAS QUIOSCO (LOCAL) ==========
    // Día
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: startOfDay },
        orderDeliveredAt: { not: null }
      }
    }),
    // Semana
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: startOfWeek },
        orderDeliveredAt: { not: null }
      }
    }),
    // Mes
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: startOfMonth },
        orderDeliveredAt: { not: null }
      }
    }),
    // Año
    prisma.order.aggregate({
      _sum: { total: true },
      where: {
        date: { gte: startOfYear },
        orderDeliveredAt: { not: null }
      }
    }),
    // Total órdenes quiosco
    prisma.order.count({
      where: { orderDeliveredAt: { not: null } }
    }),
    
    // ========== VENTAS DELIVERY (APP MÓVIL) ==========
    // Día
    prisma.deliveryOrder.findMany({
      where: {
        createdAt: { gte: startOfDay },
        status: 'ENTREGADO'
      },
      include: {
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    }),
    // Semana
    prisma.deliveryOrder.findMany({
      where: {
        createdAt: { gte: startOfWeek },
        status: 'ENTREGADO'
      },
      include: {
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    }),
    // Mes
    prisma.deliveryOrder.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        status: 'ENTREGADO'
      },
      include: {
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    }),
    // Año
    prisma.deliveryOrder.findMany({
      where: {
        createdAt: { gte: startOfYear },
        status: 'ENTREGADO'
      },
      include: {
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    }),
    // Total órdenes delivery
    prisma.deliveryOrder.count({
      where: { status: 'ENTREGADO' }
    }),
  ]);

  // Calcular totales de delivery
  const calculateDeliveryTotal = (orders: any[]) => {
    return orders.reduce((sum, order) => {
      const orderTotal = order.orderProducts.reduce((total: number, op: any) => {
        return total + (Number(op.quantity) * Number(op.product.price));
      }, 0);
      return sum + orderTotal;
    }, 0);
  };

  const deliveryRevenue = {
    daily: calculateDeliveryTotal(dailyDelivery),
    weekly: calculateDeliveryTotal(weeklyDelivery),
    monthly: calculateDeliveryTotal(monthlyDelivery),
    yearly: calculateDeliveryTotal(yearlyDelivery),
  };

  // Obtener detalles de los productos más vendidos
  const productIds = topProducts.map(p => p.productId);
  const productsDetails = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { category: true }
  });

  const topProductsWithDetails = topProducts.map(tp => {
    const product = productsDetails.find(p => p.id === tp.productId);
    return {
      id: Number(product?.id || 0),
      name: product?.name || 'Producto desconocido',
      totalSold: tp._sum.quantity || 0
    };
  });

  // Órdenes recientes (ambos sistemas)
  const [recentQuioscoOrders, recentDeliveryOrders] = await Promise.all([
    // Quiosco
    prisma.order.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      where: { orderDeliveredAt: { not: null } },
      include: {
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    }),
    // Delivery
    prisma.deliveryOrder.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      where: { status: 'ENTREGADO' },
      include: {
        client: true,
        orderProducts: {
          include: {
            product: true
          }
        }
      }
    })
  ]);

  return {
    revenue: {
      daily: dailyRevenue._sum.total || 0,
      weekly: weeklyRevenue._sum.total || 0,
      monthly: monthlyRevenue._sum.total || 0,
      yearly: yearlyRevenue._sum.total || 0,
    },
    quioscoRevenue: {
      daily: dailyQuiosco._sum.total || 0,
      weekly: weeklyQuiosco._sum.total || 0,
      monthly: monthlyQuiosco._sum.total || 0,
      yearly: yearlyQuiosco._sum.total || 0,
    },
    deliveryRevenue,
    totalOrders: totalOrders + totalDelivery,
    totalQuioscoOrders: totalQuiosco,
    totalDeliveryOrders: totalDelivery,
    totalProducts,
    avgOrderValue: avgOrderValue._avg.total || 0,
    topProducts: topProductsWithDetails,
    recentOrders: {
      quiosco: recentQuioscoOrders,
      delivery: recentDeliveryOrders
    }
  };
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

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
            <h1 className="text-3xl font-black text-gray-900">
              Dashboard
              <span className="block w-20 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mt-2 rounded-full"></span>
            </h1>
            <p className="text-gray-600 mt-2">Resumen general del negocio</p>
          </div>
          <DashboardRefreshButton />
        </div>
      </div>

      {/* Tarjetas de Ganancias TOTALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ganancias Diarias */}
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-5xl opacity-80">💰</div>
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-xs font-bold">
              HOY
            </div>
          </div>
          <p className="text-green-100 text-sm font-semibold mb-1">Ganancias Diarias TOTALES</p>
          <p className="text-3xl font-bold">{formatCurrency(stats.revenue.daily + stats.deliveryRevenue.daily)}</p>
          <div className="mt-2 pt-2 border-t border-white/20 flex justify-between text-xs">
            <span>Local: {formatCurrency(stats.quioscoRevenue.daily)}</span>
            <span>App: {formatCurrency(stats.deliveryRevenue.daily)}</span>
          </div>
        </div>

        {/* Ganancias Semanales */}
        <div className="bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-5xl opacity-80">�</div>
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-xs font-bold">
              SEMANA
            </div>
          </div>
          <p className="text-blue-100 text-sm font-semibold mb-1">Ganancias Semanales TOTALES</p>
          <p className="text-3xl font-bold">{formatCurrency(stats.revenue.weekly + stats.deliveryRevenue.weekly)}</p>
          <div className="mt-2 pt-2 border-t border-white/20 flex justify-between text-xs">
            <span>Local: {formatCurrency(stats.quioscoRevenue.weekly)}</span>
            <span>App: {formatCurrency(stats.deliveryRevenue.weekly)}</span>
          </div>
        </div>

        {/* Ganancias Mensuales */}
        <div className="bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-5xl opacity-80">🎯</div>
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-xs font-bold">
              MES
            </div>
          </div>
          <p className="text-purple-100 text-sm font-semibold mb-1">Ganancias Mensuales TOTALES</p>
          <p className="text-3xl font-bold">{formatCurrency(stats.revenue.monthly + stats.deliveryRevenue.monthly)}</p>
          <div className="mt-2 pt-2 border-t border-white/20 flex justify-between text-xs">
            <span>Local: {formatCurrency(stats.quioscoRevenue.monthly)}</span>
            <span>App: {formatCurrency(stats.deliveryRevenue.monthly)}</span>
          </div>
        </div>

        {/* Ganancias Anuales */}
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="text-5xl opacity-80">🏆</div>
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-xs font-bold">
              AÑO
            </div>
          </div>
          <p className="text-amber-100 text-sm font-semibold mb-1">Ganancias Anuales TOTALES</p>
          <p className="text-3xl font-bold">{formatCurrency(stats.revenue.yearly + stats.deliveryRevenue.yearly)}</p>
          <div className="mt-2 pt-2 border-t border-white/20 flex justify-between text-xs">
            <span>Local: {formatCurrency(stats.quioscoRevenue.yearly)}</span>
            <span>App: {formatCurrency(stats.deliveryRevenue.yearly)}</span>
          </div>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Órdenes */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">
              📦
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Total Órdenes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500">Órdenes entregadas</p>
            </div>
          </div>
        </div>

        {/* Total Productos */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
              🍽️
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Total Productos</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
              <p className="text-xs text-gray-500">En el menú</p>
            </div>
          </div>
        </div>

        {/* Promedio por Orden */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
              💵
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Promedio por Orden</p>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.avgOrderValue)}</p>
              <p className="text-xs text-gray-500">Ticket promedio</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Análisis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueComparisonChart 
          quioscoRevenue={stats.quioscoRevenue}
          deliveryRevenue={stats.deliveryRevenue}
        />
        <OrderDistributionChart 
          totalQuioscoOrders={stats.totalQuioscoOrders}
          totalDeliveryOrders={stats.totalDeliveryOrders}
        />
      </div>

      {/* Tabla Comparativa Local vs Delivery */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📊</span>
            Comparativa: Local vs Delivery
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4 font-bold text-gray-700">Período</th>
                  <th className="text-center py-3 px-4 font-bold text-orange-600">
                    <div className="flex items-center justify-center gap-2">
                      <span>🏪</span> Local
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-bold text-blue-600">
                    <div className="flex items-center justify-center gap-2">
                      <span>📱</span> Delivery
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-bold text-green-600">
                    <div className="flex items-center justify-center gap-2">
                      <span>💰</span> Total
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 font-bold text-gray-600">% Local</th>
                  <th className="text-center py-3 px-4 font-bold text-gray-600">% Delivery</th>
                </tr>
              </thead>
              <tbody>
                {/* Hoy */}
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-800">Hoy</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-orange-600">{formatCurrency(stats.quioscoRevenue.daily)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-blue-600">{formatCurrency(stats.deliveryRevenue.daily)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-green-600">{formatCurrency(stats.quioscoRevenue.daily + stats.deliveryRevenue.daily)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-semibold">
                      {stats.quioscoRevenue.daily + stats.deliveryRevenue.daily > 0 
                        ? ((stats.quioscoRevenue.daily / (stats.quioscoRevenue.daily + stats.deliveryRevenue.daily)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">
                      {stats.quioscoRevenue.daily + stats.deliveryRevenue.daily > 0 
                        ? ((stats.deliveryRevenue.daily / (stats.quioscoRevenue.daily + stats.deliveryRevenue.daily)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                </tr>
                {/* Semana */}
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-800">Esta Semana</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-orange-600">{formatCurrency(stats.quioscoRevenue.weekly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-blue-600">{formatCurrency(stats.deliveryRevenue.weekly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-green-600">{formatCurrency(stats.quioscoRevenue.weekly + stats.deliveryRevenue.weekly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-semibold">
                      {stats.quioscoRevenue.weekly + stats.deliveryRevenue.weekly > 0 
                        ? ((stats.quioscoRevenue.weekly / (stats.quioscoRevenue.weekly + stats.deliveryRevenue.weekly)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">
                      {stats.quioscoRevenue.weekly + stats.deliveryRevenue.weekly > 0 
                        ? ((stats.deliveryRevenue.weekly / (stats.quioscoRevenue.weekly + stats.deliveryRevenue.weekly)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                </tr>
                {/* Mes */}
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-semibold text-gray-800">Este Mes</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-orange-600">{formatCurrency(stats.quioscoRevenue.monthly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-blue-600">{formatCurrency(stats.deliveryRevenue.monthly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-green-600">{formatCurrency(stats.quioscoRevenue.monthly + stats.deliveryRevenue.monthly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-sm font-semibold">
                      {stats.quioscoRevenue.monthly + stats.deliveryRevenue.monthly > 0 
                        ? ((stats.quioscoRevenue.monthly / (stats.quioscoRevenue.monthly + stats.deliveryRevenue.monthly)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-semibold">
                      {stats.quioscoRevenue.monthly + stats.deliveryRevenue.monthly > 0 
                        ? ((stats.deliveryRevenue.monthly / (stats.quioscoRevenue.monthly + stats.deliveryRevenue.monthly)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                </tr>
                {/* Año */}
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors">
                  <td className="py-4 px-4">
                    <span className="font-bold text-gray-900">Este Año</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-orange-600 text-lg">{formatCurrency(stats.quioscoRevenue.yearly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-blue-600 text-lg">{formatCurrency(stats.deliveryRevenue.yearly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="font-bold text-green-600 text-lg">{formatCurrency(stats.quioscoRevenue.yearly + stats.deliveryRevenue.yearly)}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-sm font-bold">
                      {stats.quioscoRevenue.yearly + stats.deliveryRevenue.yearly > 0 
                        ? ((stats.quioscoRevenue.yearly / (stats.quioscoRevenue.yearly + stats.deliveryRevenue.yearly)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
                      {stats.quioscoRevenue.yearly + stats.deliveryRevenue.yearly > 0 
                        ? ((stats.deliveryRevenue.yearly / (stats.quioscoRevenue.yearly + stats.deliveryRevenue.yearly)) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          {/* Resumen de órdenes */}
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white text-xl">
                  🏪
                </div>
                <div>
                  <p className="text-sm text-orange-600 font-semibold">Órdenes Local</p>
                  <p className="text-2xl font-bold text-orange-700">{stats.totalQuioscoOrders}</p>
                </div>
              </div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white text-xl">
                  📱
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-semibold">Órdenes Delivery</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.totalDeliveryOrders}</p>
                </div>
              </div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-xl">
                  📦
                </div>
                <div>
                  <p className="text-sm text-green-600 font-semibold">Total Órdenes</p>
                  <p className="text-2xl font-bold text-green-700">{stats.totalOrders}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Productos Más Vendidos */}
      <TopProductsChart topProducts={stats.topProducts} />

      {/* Órdenes Recientes */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>📋</span>
            Órdenes Recientes
          </h2>
          <Link
            href="/admin/orders/history"
            className="text-white text-sm font-semibold hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Local Orders */}
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3">🏪 Local (Restaurant)</h3>
              <div className="space-y-3">
                {stats.recentOrders.quiosco.slice(0, 3).map((order: any) => (
                  <div key={`q-${order.id}`} className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors border border-orange-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                          {order.name}
                        </div>
                        <span className="font-semibold text-gray-900 text-sm">Mesa {order.name}</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                          Entregada
                        </span>
                      </div>
                      <span className="text-base font-bold text-gray-900">
                        {formatCurrency(order.total)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(order.date)} • {order.orderProducts.length} productos
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Orders */}
            <div>
              <h3 className="text-sm font-bold text-gray-600 mb-3">📱 App Móvil (Delivery)</h3>
              <div className="space-y-3">
                {stats.recentOrders.delivery.slice(0, 3).map((order: any) => {
                  const total = order.orderProducts.reduce((sum: number, op: any) => 
                    sum + (Number(op.quantity) * Number(op.product.price)), 0
                  );
                  const clientName = order.clientName || order.client?.name || 'Usuario eliminado';
                  return (
                    <div key={`d-${order.id}`} className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors border border-blue-200">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {clientName.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900 text-sm">{clientName}</span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-semibold">
                            Entregado
                          </span>
                        </div>
                        <span className="text-base font-bold text-gray-900">
                          {formatCurrency(total)}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {formatDate(new Date(Number(order.timestamp)))} • {order.orderProducts.length} productos
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
