import RouteTransactionLocalModel from '@/src/infrastructure/persitence/model/local-models/RouteTransactionLocalModel';

export function isRouteTransactionLocalModel(model: unknown): model is RouteTransactionLocalModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_route_transaction' in model && typeof model.id_route_transaction === 'string' &&
        'state' in model && typeof model.state === 'number' &&
        'cash_received' in model && typeof model.cash_received === 'number' &&
        'latitude' in model && typeof model.latitude === 'string' &&
        'longitude' in model && typeof model.longitude === 'string' &&
        'id_work_day' in model && typeof model.id_work_day === 'string' &&
        'id_payment_method' in model && typeof model.id_payment_method === 'string' &&
        'id_store' in model && typeof model.id_store === 'string'
    );
}
