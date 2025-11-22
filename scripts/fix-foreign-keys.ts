import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixForeignKeys() {
  try {
    console.log('Verificando restricciones actuales...')
    
    // Verificar restricciones actuales
    const currentConstraints = await prisma.$queryRaw`
      SELECT 
        CONSTRAINT_NAME, 
        TABLE_NAME, 
        REFERENCED_TABLE_NAME,
        DELETE_RULE,
        UPDATE_RULE
      FROM 
        INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
      WHERE 
        TABLE_NAME = 'orders' 
        AND CONSTRAINT_SCHEMA = 'delivery_app'
    `
    
    console.log('Restricciones actuales:', currentConstraints)
    
    // Eliminar restricciones existentes
    console.log('\nEliminando restricciones antiguas...')
    await prisma.$executeRaw`ALTER TABLE orders DROP FOREIGN KEY orders_id_client_fkey`
    await prisma.$executeRaw`ALTER TABLE orders DROP FOREIGN KEY orders_id_delivery_fkey`
    
    // Recrear con SET NULL
    console.log('Recreando restricciones con SET NULL...')
    await prisma.$executeRaw`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_id_client_fkey 
      FOREIGN KEY (id_client) 
      REFERENCES users(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `
    
    await prisma.$executeRaw`
      ALTER TABLE orders 
      ADD CONSTRAINT orders_id_delivery_fkey 
      FOREIGN KEY (id_delivery) 
      REFERENCES users(id) 
      ON DELETE SET NULL 
      ON UPDATE CASCADE
    `
    
    console.log('\nVerificando nuevas restricciones...')
    const newConstraints = await prisma.$queryRaw`
      SELECT 
        CONSTRAINT_NAME, 
        TABLE_NAME, 
        REFERENCED_TABLE_NAME,
        DELETE_RULE,
        UPDATE_RULE
      FROM 
        INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS 
      WHERE 
        TABLE_NAME = 'orders' 
        AND CONSTRAINT_SCHEMA = 'delivery_app'
    `
    
    console.log('Nuevas restricciones:', newConstraints)
    console.log('\n✅ Foreign keys actualizadas correctamente!')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixForeignKeys()
