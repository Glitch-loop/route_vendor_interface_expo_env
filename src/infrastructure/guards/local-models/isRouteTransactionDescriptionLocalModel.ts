import RouteTransactionDescriptionLocalModel from '@/src/infrastructure/persitence/model/local-models/RouteTransactionDescriptionLocalModel';

export function isRouteTransactionDescriptionLocalModel(model: unknown): model is RouteTransactionDescriptionLocalModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_route_transaction_description' in model && typeof model.id_route_transaction_description === 'string' &&
        'price_at_moment' in model && typeof model.price_at_moment === 'number' &&
        'cost_at_moment' in model && typeof model.cost_at_moment === 'number' &&
        'amount' in model && typeof model.amount === 'number' &&
        'created_at' in model && typeof model.amount === 'string' &&
        'id_product_inventory' in model && typeof model.id_product_inventory === 'string' &&
        'id_transaction_operation_type' in model && typeof model.id_transaction_operation_type === 'string' &&
        'id_product' in model && typeof model.id_product === 'string' &&
        'id_route_transaction' in model && typeof model.id_route_transaction === 'string'
    );
}
