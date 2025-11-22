"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

interface RevenueComparisonProps {
  quioscoRevenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
  deliveryRevenue: {
    daily: number;
    weekly: number;
    monthly: number;
    yearly: number;
  };
}

export function RevenueComparisonChart({ quioscoRevenue, deliveryRevenue }: RevenueComparisonProps) {
  const data = [
    {
      periodo: 'Hoy',
      Local: quioscoRevenue.daily,
      Delivery: deliveryRevenue.daily,
    },
    {
      periodo: 'Semana',
      Local: quioscoRevenue.weekly,
      Delivery: deliveryRevenue.weekly,
    },
    {
      periodo: 'Mes',
      Local: quioscoRevenue.monthly,
      Delivery: deliveryRevenue.monthly,
    },
    {
      periodo: 'Año',
      Local: quioscoRevenue.yearly,
      Delivery: deliveryRevenue.yearly,
    },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Comparación de Ventas</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="periodo" />
          <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
          <Legend />
          <Bar dataKey="Local" fill="#f59e0b" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Delivery" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface OrderDistributionProps {
  totalQuioscoOrders: number;
  totalDeliveryOrders: number;
}

export function OrderDistributionChart({ totalQuioscoOrders, totalDeliveryOrders }: OrderDistributionProps) {
  const data = [
    { name: 'Local', value: totalQuioscoOrders },
    { name: 'Delivery', value: totalDeliveryOrders },
  ];

  const total = totalQuioscoOrders + totalDeliveryOrders;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🍕 Distribución de Pedidos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value} (${((value / total) * 100).toFixed(1)}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TopProductsChartProps {
  topProducts: Array<{
    id: number;
    name: string;
    totalSold: number;
  }>;
}

export function TopProductsChart({ topProducts }: TopProductsChartProps) {
  const data = topProducts.map(product => ({
    name: product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name,
    cantidad: product.totalSold
  }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-xl font-bold text-gray-900 mb-4">🏆 Productos Más Vendidos</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={150} />
          <Tooltip />
          <Bar dataKey="cantidad" fill="#10b981" radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
