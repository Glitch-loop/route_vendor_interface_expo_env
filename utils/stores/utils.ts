import StoreDTO from "@/src/application/dto/StoreDTO";


export function getAddressOfStore(store: StoreDTO): string {
    const { street, ext_number, colony, postal_code } = store;
    return `${street} #${ext_number}, ${colony}, ${postal_code}`;
}