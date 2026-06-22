import ProductPriceDTO from '@/src/application/dto/ProductPriceDTO'

export default interface ProductDTO {
    id_product: string;
    product_name: string;
    cost: number;
    quantity_presentation: number;
    order_to_show: number;
    product_price: ProductPriceDTO[];
    barcode: string|undefined;
}