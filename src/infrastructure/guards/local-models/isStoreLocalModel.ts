import StoreLocalModel from '@/src/infrastructure/persitence/model/local-models/StoreLocalModel';

export function isStoreLocalModel(model: unknown): model is StoreLocalModel {
    return (
        typeof model === 'object' &&
        model !== null &&
        'id_store' in model && typeof model.id_store === 'string' &&
        'street' in model && typeof model.street === 'string' &&
        'ext_number' in model && (typeof model.ext_number === 'string' || model.ext_number === null) &&
        'colony' in model && typeof model.colony === 'string' &&
        'postal_code' in model && typeof model.postal_code === 'string' &&
        'address_reference' in model && (typeof model.address_reference === 'string' || model.address_reference === null) &&
        'store_name' in model && (typeof model.store_name === 'string' || model.store_name === null) &&
        'owner_name' in model && (typeof model.owner_name === 'string' || model.owner_name === null) &&
        'cellphone' in model && (typeof model.cellphone === 'string' || model.cellphone === null) &&
        'latitude' in model && typeof model.latitude === 'string' &&
        'longitude' in model && typeof model.longitude === 'string' &&
        'id_creator' in model && typeof model.id_creator === 'string' &&
        'id_client' in model && typeof model.id_client === 'string' &&
        'id_location_type' in model && typeof model.id_location_type === 'string' &&
        'creation_context' in model && typeof model.creation_context === 'string' &&
        'status_store' in model && typeof model.status_store === 'number'
    );
}
