import InventoryOperationDescriptionLocalModel from '@/src/infrastructure/persitence/model/local-models/InventoryOperationDescriptionLocalModel';

export function isInventoryOperationDescriptionLocalModel(model: unknown): model is InventoryOperationDescriptionLocalModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_inventory_operation_description' in model && typeof model.id_inventory_operation_description === 'string' &&
        'price_at_moment' in model && typeof model.price_at_moment === 'number' &&
        'cost_at_moment' in model && typeof model.cost_at_moment === 'number' &&
        'amount' in model && typeof model.amount === 'number' &&
        'id_inventory_operation' in model && typeof model.id_inventory_operation === 'string' &&
        'id_product' in model && typeof model.id_product === 'string'
      );
}
