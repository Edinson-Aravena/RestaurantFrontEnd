const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function populateOrderHistory() {
  try {
    console.log('Poblando datos históricos en órdenes existentes...')
    
    // Obtener todas las órdenes de delivery
    const orders = await prisma.deliveryOrder.findMany({
      include: {
        client: true,
        address: true
      }
    })
    
    console.log(`Encontradas ${orders.length} órdenes para actualizar`)
    
    let updated = 0
    
    for (const order of orders) {
      // Solo actualizar si los campos están vacíos y hay datos disponibles
      const updateData = {}
      
      if (!order.clientName && order.client) {
        updateData.clientName = order.client.name
        updateData.clientPhone = order.client.phone
      }
      
      if (!order.deliveryAddress && order.address) {
        updateData.deliveryAddress = order.address.address
        updateData.deliveryNeighborhood = order.address.neighborhood
      }
      
      if (Object.keys(updateData).length > 0) {
        await prisma.deliveryOrder.update({
          where: { id: order.id },
          data: updateData
        })
        updated++
      }
    }
    
    console.log(`\n✅ ${updated} órdenes actualizadas con información histórica`)
    console.log('Ahora puedes eliminar usuarios y la información se mantendrá en las órdenes')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

populateOrderHistory()
