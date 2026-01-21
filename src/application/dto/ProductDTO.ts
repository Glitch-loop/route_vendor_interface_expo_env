export default interface ProductDTO {
    id_product: string;
    product_name: string;
    barcode: string|null;
    weight: string|null;
    unit: string|null;
    comission: number;
    price: number
    product_status: number;
    order_to_show: number;
}