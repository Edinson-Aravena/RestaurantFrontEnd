-- Verificar las restricciones actuales
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
    AND CONSTRAINT_SCHEMA = 'delivery_app';

-- Eliminar las restricciones existentes
ALTER TABLE `orders` DROP FOREIGN KEY `orders_id_client_fkey`;
ALTER TABLE `orders` DROP FOREIGN KEY `orders_id_delivery_fkey`;

-- Recrear las restricciones con SET NULL
ALTER TABLE `orders` 
ADD CONSTRAINT `orders_id_client_fkey` 
FOREIGN KEY (`id_client`) 
REFERENCES `users`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

ALTER TABLE `orders` 
ADD CONSTRAINT `orders_id_delivery_fkey` 
FOREIGN KEY (`id_delivery`) 
REFERENCES `users`(`id`) 
ON DELETE SET NULL 
ON UPDATE CASCADE;

-- Verificar que los cambios se aplicaron
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
    AND CONSTRAINT_SCHEMA = 'delivery_app';
