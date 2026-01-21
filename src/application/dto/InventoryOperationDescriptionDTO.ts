export default interface InventoryOperationDescriptionDTO {
    id_product_operation_description: string;
    price_at_moment: number;
    amount: number;
    id_inventory_operation: string;
    id_product: string;
}