export default interface StoreDTO {
    id_store: string,
    street: string,
    ext_number: string | undefined,
    colony: string,
    postal_code: string,
    address_reference: string | undefined,
    store_name: string | undefined,
    latitude: string,
    longitude: string,
    creation_date: string,
    id_client: string,
    id_creator: string,
    id_location_type: string,
    status_store: number,
    is_new: number
}