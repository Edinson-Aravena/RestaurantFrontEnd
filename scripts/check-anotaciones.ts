import { prisma } from "@/src/lib/prisma"

async function checkAnotaciones() {
    try {
        const orders = await prisma.deliveryOrder.findMany({
            select: {
                id: true,
                clientName: true,
                anotaciones: true,
                status: true,
                timestamp: true
            },
            orderBy: {
                timestamp: 'desc'
            },
            take: 10
        })

        console.log('Últimas 10 órdenes de delivery:')
        console.log('================================')
        orders.forEach(order => {
            console.log(`\nOrden #${order.id}`)
            console.log(`Cliente: ${order.clientName}`)
            console.log(`Estado: ${order.status}`)
            console.log(`Anotaciones: ${order.anotaciones || 'Sin anotaciones'}`)
            console.log(`Fecha: ${new Date(Number(order.timestamp)).toLocaleString('es-ES')}`)
        })

        await prisma.$disconnect()
    } catch (error) {
        console.error('Error:', error)
        await prisma.$disconnect()
        process.exit(1)
    }
}

checkAnotaciones()
