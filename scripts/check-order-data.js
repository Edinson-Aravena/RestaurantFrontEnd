const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkOrderData() {
  try {
    const orders = await prisma.deliveryOrder.findMany({
      select: {
        id: true,
        clientName: true,
        clientPhone: true,
        deliveryAddress: true,
        deliveryNeighborhood: true,
        client: {
          select: {
            id: true,
            name: true,
            phone: true
          }
        },
        address: {
          select: {
            id: true,
            address: true,
            neighborhood: true
          }
        }
      },
      orderBy: {
        id: 'desc'
      },
      take: 10
    })
    
    console.log('Últimas 10 órdenes:')
    orders.forEach(order => {
      console.log(`\nOrden ID: ${order.id}`)
      console.log(`  clientName (guardado): ${order.clientName || 'NULL'}`)
      console.log(`  client.name (relación): ${order.client?.name || 'NULL'}`)
      console.log(`  deliveryAddress (guardado): ${order.deliveryAddress || 'NULL'}`)
      console.log(`  address.address (relación): ${order.address?.address || 'NULL'}`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkOrderData()
