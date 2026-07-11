import InventoryOperationDescriptionServerModel from '@/src/infrastructure/persitence/model/server-models/InventoryOperationDescriptionServerModel';

export function isInventoryOperationDescriptionServerModel(model: unknown): model is InventoryOperationDescriptionServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_product_operation_description' in model && typeof model.id_product_operation_description === 'string' &&
        'price_at_moment' in model && typeof model.price_at_moment === 'number' &&
        'cost_at_moment' in model && typeof model.cost_at_moment === 'number' &&
        'quantity' in model && typeof model.quantity === 'number' &&
        'created_at' in model && typeof model.created_at === 'string' &&
        'id_inventory_operation' in model && typeof model.id_inventory_operation === 'string' &&
        'id_product' in model && typeof model.id_product === 'string'
    );
}
