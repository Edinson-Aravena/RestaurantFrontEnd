"use client";

import { ChefOrder } from "@/actions/get-chef-orders-action"
import { startPreparingOrderAction, markOrderReadyAction } from "@/actions/update-chef-order-action"
import { formatCurrency } from "@/src/utils"
import { toast } from "react-toastify"

interface ChefOrderCardProps {
  order: ChefOrder;
  onComplete?: () => Promise<void>;
}

export default function ChefOrderCard({ order, onComplete }: ChefOrderCardProps) {
  const isInProgress = order.prepStatus === 'IN_PROGRESS';
  
  console.log(`Order ${order.orderId} - Anotaciones:`, order.anotaciones, typeof order.anotaciones);
  
  const handleOrderClick = async () => {
    if (!isInProgress) {
      // Primer click: marcar como "En Preparación"
      try {
        const result = await startPreparingOrderAction(order.orderId);
        if (result.success) {
          toast.success("Orden en preparación");
          if (onComplete) await onComplete();
        } else {
          toast.error(result.error || "Error al iniciar la orden");
        }
      } catch (error) {
        toast.error("Error al iniciar la orden");
      }
    } else {
      // Segundo click: marcar como "Lista"
      try {
        const result = await markOrderReadyAction(order.orderId);
        if (result.success) {
          toast.success("Orden completada");
          if (onComplete) await onComplete();
        } else {
          toast.error(result.error || "Error al completar la orden");
        }
      } catch (error) {
        toast.error("Error al completar la orden");
      }
    }
  }

  // Determinar el color y estado según el progreso
  const getStatusConfig = () => {
    if (isInProgress) {
      return {
        gradient: 'from-orange-500 to-orange-600',
        hoverGradient: 'hover:from-orange-600 hover:to-orange-700',
        bgColor: 'from-orange-50 to-orange-100',
        borderColor: 'border-orange-300',
        badgeBg: 'from-orange-500 to-orange-600',
        icon: '👨‍🍳',
        buttonText: 'Marcar como Lista',
        buttonIcon: (
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        statusBadge: 'EN PREPARACIÓN'
      };
    }
    return {
      gradient: 'from-yellow-500 to-yellow-600',
      hoverGradient: 'hover:from-yellow-600 hover:to-yellow-700',
      bgColor: 'from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-300',
      badgeBg: 'from-yellow-500 to-yellow-600',
      icon: '⏳',
      buttonText: 'Iniciar Preparación',
      buttonIcon: (
        <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      statusBadge: 'PENDIENTE'
    };
  };

  const statusConfig = getStatusConfig();

  // Icono y badge según el tipo de orden
  const orderTypeConfig = order.orderType === 'DELIVERY' 
    ? { icon: '🏍️', label: 'Delivery', color: 'bg-blue-500' }
    : { icon: '🍽️', label: 'Local', color: 'bg-purple-500' };

  return (
    <section
      aria-labelledby="summary-heading"
      className={`group relative bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border ${statusConfig.borderColor}`}
    >
      {/* Header decorativo */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${statusConfig.badgeBg}`}></div>

      <div className="p-4 space-y-3">
        {/* Header con badges */}
        <div className="flex justify-between items-start gap-2 pb-2">
          <div className={`${orderTypeConfig.color} text-white px-3 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1`}>
            <span>{orderTypeConfig.icon}</span>
            <span>{orderTypeConfig.label}</span>
          </div>
          <div className="flex flex-col gap-2 items-end">
            <div className={`bg-gradient-to-r ${statusConfig.badgeBg} text-white px-3 py-1 rounded-full text-xs font-bold shadow-md`}>
              {order.orderId}
            </div>
            <div className={`bg-gradient-to-r ${statusConfig.bgColor} text-gray-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${statusConfig.borderColor}`}>
              {statusConfig.statusBadge}
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="space-y-2 pt-3">
          <p className="text-sm text-gray-600 font-bold uppercase tracking-wide">Productos a preparar</p>
          <div className="space-y-1">
            {order.products.map((product, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 py-1.5 px-2 bg-gray-50 rounded-lg"
              >
                <div className="bg-orange-500 text-white font-bold text-sm w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0">
                  {product.quantity}
                </div>
                <p className="font-bold text-gray-900 text-base flex-1">{product.productName}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Anotaciones especiales */}
        {order.anotaciones && (
          <div className="space-y-2 pt-3 border-t-2 border-dashed border-amber-300 bg-amber-50 -mx-4 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xl">📝</span>
              <p className="text-sm text-amber-800 font-bold uppercase tracking-wide">Instrucciones Especiales</p>
            </div>
            <p className="text-sm text-gray-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-amber-200">
              {order.anotaciones}
            </p>
          </div>
        )}

        {/* Total y Botón */}
        <div className="space-y-3 pt-3 border-t-2 border-dashed border-gray-300">
          <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-200">
            <span className="text-base font-bold text-gray-700">Total</span>
            <span className="text-2xl font-black text-green-600">
              {formatCurrency(order.total)}
            </span>
          </div>

          <button
            onClick={handleOrderClick}
            className={`w-full group/btn bg-gradient-to-r ${statusConfig.gradient} ${statusConfig.hoverGradient} text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2`}
          >
            {statusConfig.buttonIcon}
            <span className="text-sm">{statusConfig.buttonText}</span>
          </button>

          {/* Hora de inicio si está en progreso */}
          {order.startedAt && (
            <div className="text-xs text-gray-600 text-center font-semibold">
              ⏱️ Iniciado: {new Date(order.startedAt).toLocaleTimeString('es-ES')}
            </div>
          )}
        </div>
      </div>

      {/* Animación de brillo */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 group-hover:animate-shimmer pointer-events-none"></div>
    </section>
  )
}
