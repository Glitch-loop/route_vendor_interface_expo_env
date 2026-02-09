export default interface StoreDTO {
    id_store: string,
    street: string,
    ext_number: string | null,
    colony: string,
    postal_code: string,
    address_reference: string | null,
    store_name: string | null,
    latitude: string,
    longitude: string,
    creation_date: string,
    status_store: number,
    is_new: number
}