import RouteTransactionDescriptionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionDescriptionServerModel';

export function isRouteTransactionDescriptionServerModel(model: unknown): model is RouteTransactionDescriptionServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_transaction_description' in model && typeof model.id_transaction_description === 'string' &&
        'price_at_moment' in model && typeof model.price_at_moment === 'number' &&
        'cost_at_moment' in model && typeof model.cost_at_moment === 'number' &&
        'quantity' in model && typeof model.quantity === 'number' &&
        'created_at' in model && typeof model.created_at === 'string' &&
        'id_transaction_operation_type' in model && typeof model.id_transaction_operation_type === 'string' &&
        'id_product' in model && typeof model.id_product === 'string'
    );
}
