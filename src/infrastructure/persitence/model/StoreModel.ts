import { ReplicationDataInterface } from "../data-replication/ReplicationDataInterface";

export default interface StoreDTO extends ReplicationDataInterface {
    id_store: string,
    street: string,
    ext_number: string | null,
    colony: string,
    postal_code: string,
    address_reference: string | null,
    store_name: string | null,
    owner_name: string | null,
    cellphone: string | null,
    latitude: string,
    longitude: string,
    id_creator: string,
    creation_date: string,
    status_store: number,
}
