import RouteTransactionServerModel from '@/src/infrastructure/persitence/model/server-models/RouteTransactionServerModel';
import { isRouteTransactionDescriptionServerModel } from './isRouteTransactionDescriptionServerModel';

export function isRouteTransactionServerModel(model: unknown): model is RouteTransactionServerModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_transaction' in model && typeof model.id_transaction === 'string' &&
        'cfdi' in model && (model.cfdi === undefined || typeof model.cfdi === 'string') &&
        'id_invoice_concept' in model && (model.id_invoice_concept === undefined || typeof model.id_invoice_concept === 'string') &&
        'received_amount' in model && typeof model.received_amount === 'number' &&
        'created_at' in model && typeof model.created_at === 'string' &&
        'state' in model && typeof model.state === 'string' &&
        'latitude' in model && typeof model.latitude === 'string' &&
        'longitude' in model && typeof model.longitude === 'string' &&
        'id_location' in model && typeof model.id_location === 'string' &&
        'id_client' in model && (model.id_client === undefined || typeof model.id_client === 'string') &&
        'created_by' in model && typeof model.created_by === 'string' &&
        'id_work_day' in model && typeof model.id_work_day === 'string' &&
        'id_payment_method' in model && typeof model.id_payment_method === 'string' &&
        'id_payment_schema' in model && typeof model.id_payment_schema === 'string' &&
        'transaction_descriptions' in model && Array.isArray(model.transaction_descriptions) && model.transaction_descriptions.every(isRouteTransactionDescriptionServerModel)
    );
}
