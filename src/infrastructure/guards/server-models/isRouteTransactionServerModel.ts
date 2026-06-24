import RouteTransactionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionServerModel';

export function isRouteTransactionServerModel(model: unknown): model is RouteTransactionServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_transaction' in model && typeof model.id_transaction === 'string' &&
        'cfdi' in model && typeof model.cfdi === 'string' &&
        'received_amount' in model && typeof model.received_amount === 'number' &&
        'id_invoice_concept' in model && typeof model.id_invoice_concept === 'string' &&
        'latitude' in model && typeof model.latitude === 'string' &&
        'longitude' in model && typeof model.longitude === 'string' &&
        'id_location' in model && typeof model.id_location === 'string' &&
        'id_client' in model && typeof model.id_client === 'string' &&
        'id_work_day' in model && typeof model.id_work_day === 'string' &&
        'id_payment_method' in model && typeof model.id_payment_method === 'string' &&
        'id_payment_schema' in model && typeof model.id_payment_schema === 'string'
    );
}
