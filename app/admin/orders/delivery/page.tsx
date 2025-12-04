"use client"

import useSWR from "swr"
import Heading from "@/components/ui/Heading"
import DeliveryOrderCard from "@/components/order/DeliveryOrderCard"

type DeliveryOrder = {
    id: string
    status: string
    timestamp: string
    client: {
        id: string
        name: string
        lastname: string | null
        phone: string | null
        email: string | null
    } | null
    delivery: {
        id: string
        name: string
        lastname: string | null
        phone: string | null
    } | null
    address: {
        id: string
        address: string
        neighborhood: string
    } | null
    deliveryOrderProducts: Array<{
        productId: string
        quantity: number
        product: {
            id: string
            name: string
            price: number
            image: string | null
        }
    }>
}

export default function DeliveryOrdersPage() {
    const url = '/admin/orders/delivery/api'
    const fetcher = () => fetch(url).then(res => res.json())

    const { data, error, isLoading, mutate } = useSWR<DeliveryOrder[]>(url, fetcher, {
        refreshInterval: 10000,
        revalidateOnFocus: true
    })

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-green-200 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-green-500 rounded-full border-t-transparent animate-spin"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Cargando órdenes de delivery...</p>
            </div>
        )
    }

    if (error || !data || !Array.isArray(data)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="text-6xl mb-4">⚠️</div>
                <p className="text-red-600 font-semibold text-lg">Error al cargar las órdenes</p>
                <p className="text-gray-500 text-sm mt-2">Por favor, intenta recargar la página</p>
                {error && (
                    <p className="text-xs text-gray-400 mt-2">{error.message || 'Error desconocido'}</p>
                )}
            </div>
        )
    }

    // Separar órdenes por estado
    // Listas para asignar: PAGADO sin repartidor asignado
    const readyOrders = data.filter(o => o.status === 'PAGADO' && !o.delivery)
    // En camino: DESPACHADO o EN CAMINO (con repartidor asignado)
    const dispatchedOrders = data.filter(o => o.status === 'DESPACHADO' || o.status === 'EN CAMINO' || o.delivery)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <Heading>Órdenes de Delivery</Heading>
                        <p className="text-gray-600 mt-2">
                            {data.length ? `${data.length} ${data.length === 1 ? 'orden activa' : 'órdenes activas'}` : 'No hay órdenes activas'}
                        </p>
                    </div>
                    <button
                        onClick={() => mutate()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold rounded-lg shadow-md transition-all hover:shadow-lg active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Actualizar
                    </button>
                </div>
            </div>

            {/* Órdenes listas para asignar repartidor */}
            {readyOrders.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        <h2 className="text-xl font-bold text-gray-800">Listas para Asignar Repartidor</h2>
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {readyOrders.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {readyOrders.map(order => (
                            <DeliveryOrderCard
                                key={order.id}
                                order={order}
                                onUpdate={() => mutate()}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Órdenes despachadas */}
            {dispatchedOrders.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
                        <h2 className="text-xl font-bold text-gray-800">En Camino</h2>
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                            {dispatchedOrders.length}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {dispatchedOrders.map(order => (
                            <DeliveryOrderCard
                                key={order.id}
                                order={order}
                                onUpdate={() => mutate()}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Sin órdenes */}
            {data.length === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100">
                    <div className="text-6xl mb-4">🛵</div>
                    <p className="text-xl font-semibold text-gray-700 mb-2">No hay órdenes de delivery</p>
                    <p className="text-gray-500">Las nuevas órdenes aparecerán aquí automáticamente</p>
                </div>
            )}
        </div>
    )
}
