"use client"

import { useState, useEffect } from "react"
import { assignDeliveryAction } from "@/actions/assign-delivery-action"
import { getDeliveryUsersAction } from "@/actions/get-delivery-users-action"
import { formatCurrency } from "@/src/utils"
import { toast } from "react-toastify"

type DeliveryOrder = {
    id: string
    status: string
    timestamp: string
    client: {
        name: string
        lastname: string | null
        phone: string | null
    } | null
    delivery: {
        id: string
        name: string
        lastname: string | null
        phone: string | null
    } | null
    address: {
        address: string
        neighborhood: string
    } | null
    deliveryOrderProducts: Array<{
        productId: string
        quantity: number
        product: {
            name: string
            price: number
        }
    }>
}

type DeliveryUser = {
    id: string
    name: string
    lastname: string | null
    phone: string | null
}

interface Props {
    order: DeliveryOrder
    onUpdate: () => void
}

export default function DeliveryOrderCard({ order, onUpdate }: Props) {
    const [deliveryUsers, setDeliveryUsers] = useState<DeliveryUser[]>([])
    const [selectedDelivery, setSelectedDelivery] = useState<string>("")
    const [isAssigning, setIsAssigning] = useState(false)

    const isPending = order.status === 'PAGADO'
    const isDispatched = order.status === 'DESPACHADO'

    useEffect(() => {
        loadDeliveryUsers()
    }, [])

    const loadDeliveryUsers = async () => {
        const result = await getDeliveryUsersAction()
        if (result.success) {
            setDeliveryUsers(result.data)
        }
    }

    const handleAssignDelivery = async () => {
        if (!selectedDelivery) {
            toast.error("Selecciona un repartidor")
            return
        }

        setIsAssigning(true)
        const result = await assignDeliveryAction(order.id, selectedDelivery)
        setIsAssigning(false)

        if (result.success) {
            toast.success(result.message)
            onUpdate()
        } else {
            toast.error(result.error)
        }
    }

    const total = order.deliveryOrderProducts.reduce(
        (sum, item) => sum + (item.product.price * item.quantity),
        0
    )

    const statusConfig = isPending
        ? {
            gradient: 'from-yellow-500 to-yellow-600',
            bgColor: 'from-yellow-50 to-yellow-100',
            borderColor: 'border-yellow-300',
            badgeBg: 'from-yellow-500 to-yellow-600',
            icon: '⏳',
            statusBadge: 'PENDIENTE'
        }
        : {
            gradient: 'from-blue-500 to-blue-600',
            bgColor: 'from-blue-50 to-blue-100',
            borderColor: 'border-blue-300',
            badgeBg: 'from-blue-500 to-blue-600',
            icon: '🛵',
            statusBadge: 'EN CAMINO'
        }

    return (
        <div className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border ${statusConfig.borderColor}`}>
            {/* Header decorativo */}
            <div className={`h-1.5 bg-gradient-to-r ${statusConfig.badgeBg}`}></div>

            <div className="p-4 space-y-3">
                {/* Header con badges */}
                <div className="flex justify-end gap-2 pb-2">
                    <div className={`bg-gradient-to-r ${statusConfig.badgeBg} text-white px-3 py-1 rounded-full text-xs font-bold shadow-md`}>
                        Orden #{order.id}
                    </div>
                    <div className={`bg-gradient-to-r ${statusConfig.bgColor} text-gray-800 px-3 py-1 rounded-full text-xs font-bold shadow-sm border ${statusConfig.borderColor}`}>
                        {statusConfig.statusBadge}
                    </div>
                </div>

                {/* Cliente */}
                <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${statusConfig.bgColor} flex items-center justify-center text-xl`}>
                        {statusConfig.icon}
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-medium uppercase">Cliente</p>
                        <p className="text-base font-bold text-gray-900">
                            {order.client?.name} {order.client?.lastname}
                        </p>
                        {order.client?.phone && (
                            <p className="text-xs text-gray-500">📞 {order.client.phone}</p>
                        )}
                    </div>
                </div>

                {/* Dirección */}
                {order.address && (
                    <div className="bg-gray-50 rounded-lg p-2">
                        <div className="flex items-start gap-2">
                            <span className="text-base">📍</span>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase">Dirección</p>
                                <p className="text-sm font-semibold text-gray-800">{order.address.address}</p>
                                <p className="text-xs text-gray-600">{order.address.neighborhood}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Productos */}
                <div>
                    <p className="text-xs font-bold text-gray-600 uppercase mb-2">🍽️ Productos</p>
                    <div className="bg-gray-50 rounded-lg p-2 space-y-1">
                        {order.deliveryOrderProducts.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2 py-1"
                            >
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br ${statusConfig.badgeBg} flex items-center justify-center text-white font-bold text-xs`}>
                                    {item.quantity}
                                </div>
                                <p className="flex-1 text-sm font-medium text-gray-800">
                                    {item.product.name}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <p className="text-sm font-bold text-gray-700">💰 Total</p>
                    <p className="text-xl font-bold text-green-600">
                        {formatCurrency(total)}
                    </p>
                </div>

                {/* Asignación de repartidor o info del repartidor */}
                {isPending ? (
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-700 uppercase">
                            🛵 Asignar Repartidor
                        </label>
                        <select
                            value={selectedDelivery}
                            onChange={(e) => setSelectedDelivery(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                        >
                            <option value="">Selecciona un repartidor</option>
                            {deliveryUsers.map((user) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} {user.lastname}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={handleAssignDelivery}
                            disabled={isAssigning || !selectedDelivery}
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 text-white font-bold text-sm py-3 px-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isAssigning ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Asignando...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>Asignar y Despachar</span>
                                </>
                            )}
                        </button>
                    </div>
                ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-gray-700 uppercase mb-1">🛵 Repartidor</p>
                        <p className="text-base font-bold text-blue-900">
                            {order.delivery?.name} {order.delivery?.lastname}
                        </p>
                        {order.delivery?.phone && (
                            <p className="text-xs text-blue-700 mt-1">📞 {order.delivery.phone}</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
