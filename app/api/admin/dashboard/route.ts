import { prisma } from "@/src/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // formato: "2025-01" o null para actual
  const year = searchParams.get('year');

  const now = new Date();
  
  let startDate: Date;
  let endDate: Date;

  if (month && year) {
    // Filtrar por mes específico
    const monthNum = parseInt(month) - 1; // JavaScript months are 0-indexed
    const yearNum = parseInt(year);
    startDate = new Date(yearNum, monthNum, 1);
    endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59); // Último día del mes
  } else {
    // Mes actual
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  }

  // Inicio del día actual
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Inicio de la semana (lunes)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  // Inicio del año
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  try {
    const [
      // Stats del periodo seleccionado
      periodRevenue,
      periodOrders,
      
      // Stats generales (sin filtro de mes)
      dailyRevenue,
      weeklyRevenue,
      yearlyRevenue,
      totalOrders,
      totalProducts,
      avgOrderValue,
      topProducts,
      
      // Delivery del periodo
      periodDelivery,
      dailyDelivery,
      weeklyDelivery,
      yearlyDelivery,
      totalDelivery,
      
      // Quiosco del periodo
      periodQuiosco,
      dailyQuiosco,
      weeklyQuiosco,
      yearlyQuiosco,
      totalQuiosco,
    ] = await Promise.all([
      // Revenue del periodo seleccionado
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          date: { gte: startDate, lte: endDate },
          orderDeliveredAt: { not: null }
        }
      }),
      // Órdenes del periodo
      prisma.order.count({
        where: {
          date: { gte: startDate, lte: endDate },
          orderDeliveredAt: { not: null }
        }
      }),
      
      // Ganancias del día
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          date: { gte: startOfDay },
          orderDeliveredAt: { not: null }
        }
      }),
      // Ganancias de la semana
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          date: { gte: startOfWeek },
          orderDeliveredAt: { not: null }
        }
      }),
      // Ganancias del año
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
      // Total de productos
      prisma.product.count(),
      // Valor promedio
      prisma.order.aggregate({
        _avg: { total: true },
        where: { orderDeliveredAt: { not: null } }
      }),
      // Top productos
      prisma.orderProducts.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      }),
      
      // Delivery del periodo
      prisma.deliveryOrder.findMany({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'ENTREGADO'
        },
        include: { orderProducts: { include: { product: true } } }
      }),
      // Delivery diario
      prisma.deliveryOrder.findMany({
        where: {
          createdAt: { gte: startOfDay },
          status: 'ENTREGADO'
        },
        include: { orderProducts: { include: { product: true } } }
      }),
      // Delivery semanal
      prisma.deliveryOrder.findMany({
        where: {
          createdAt: { gte: startOfWeek },
          status: 'ENTREGADO'
        },
        include: { orderProducts: { include: { product: true } } }
      }),
      // Delivery anual
      prisma.deliveryOrder.findMany({
        where: {
          createdAt: { gte: startOfYear },
          status: 'ENTREGADO'
        },
        include: { orderProducts: { include: { product: true } } }
      }),
      // Total órdenes delivery
      prisma.deliveryOrder.count({
        where: { status: 'ENTREGADO' }
      }),
      
      // Quiosco del periodo
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          date: { gte: startDate, lte: endDate },
          orderDeliveredAt: { not: null }
        }
      }),
      // Quiosco diario
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          date: { gte: startOfDay },
          orderDeliveredAt: { not: null }
        }
      }),
      // Quiosco semanal
      prisma.order.aggregate({
        _sum: { total: true },
        where: {
          date: { gte: startOfWeek },
          orderDeliveredAt: { not: null }
        }
      }),
      // Quiosco anual
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
      period: calculateDeliveryTotal(periodDelivery),
      daily: calculateDeliveryTotal(dailyDelivery),
      weekly: calculateDeliveryTotal(weeklyDelivery),
      yearly: calculateDeliveryTotal(yearlyDelivery),
    };

    // Obtener detalles de productos
    const productIds = topProducts.map(p => p.productId);
    const productsDetails = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true }
    });

    const topProductsWithDetails = topProducts.map(tp => {
      const product = productsDetails.find(p => p.id === tp.productId);
      // Convert BigInt/Decimal to Number for JSON serialization
      return { 
        ...product, 
        price: Number(product?.price || 0),
        totalSold: Number(tp._sum.quantity || 0) 
      };
    });

    // Órdenes recientes
    const [recentQuioscoOrders, recentDeliveryOrders] = await Promise.all([
      prisma.order.findMany({
        take: 5,
        orderBy: { date: 'desc' },
        where: { orderDeliveredAt: { not: null } },
        include: { orderProducts: { include: { product: true } } }
      }),
      prisma.deliveryOrder.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { status: 'ENTREGADO' },
        include: {
          client: true,
          orderProducts: { include: { product: true } }
        }
      })
    ]);

    // Serializar órdenes para evitar problemas con Decimal/BigInt
    const serializeOrder = (order: any) => ({
      ...order,
      total: Number(order.total || 0),
      orderProducts: order.orderProducts?.map((op: any) => ({
        ...op,
        quantity: Number(op.quantity || 0),
        product: op.product ? {
          ...op.product,
          price: Number(op.product.price || 0)
        } : null
      }))
    });

    const serializedQuioscoOrders = recentQuioscoOrders.map(serializeOrder);
    const serializedDeliveryOrders = recentDeliveryOrders.map(serializeOrder);

    // Datos diarios del mes para el gráfico
    const daysInMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0).getDate();
    const dailyData = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(startDate.getFullYear(), startDate.getMonth(), day);
      const dayEnd = new Date(startDate.getFullYear(), startDate.getMonth(), day, 23, 59, 59);

      dailyData.push({
        day,
        date: dayStart.toISOString().split('T')[0]
      });
    }

    return NextResponse.json({
      revenue: {
        period: Number(periodRevenue._sum.total || 0) + deliveryRevenue.period,
        daily: Number(dailyRevenue._sum.total || 0) + deliveryRevenue.daily,
        weekly: Number(weeklyRevenue._sum.total || 0) + deliveryRevenue.weekly,
        yearly: Number(yearlyRevenue._sum.total || 0) + deliveryRevenue.yearly,
      },
      quioscoRevenue: {
        period: Number(periodQuiosco._sum.total || 0),
        daily: Number(dailyQuiosco._sum.total || 0),
        weekly: Number(weeklyQuiosco._sum.total || 0),
        yearly: Number(yearlyQuiosco._sum.total || 0),
      },
      deliveryRevenue,
      totalOrders: totalOrders + totalDelivery,
      periodOrders: periodOrders + periodDelivery.length,
      totalQuioscoOrders: totalQuiosco,
      totalDeliveryOrders: totalDelivery,
      totalProducts,
      avgOrderValue: Number(avgOrderValue._avg.total || 0),
      topProducts: topProductsWithDetails,
      recentOrders: {
        quiosco: serializedQuioscoOrders,
        delivery: serializedDeliveryOrders
      },
      selectedPeriod: {
        month: startDate.getMonth() + 1,
        year: startDate.getFullYear(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}
