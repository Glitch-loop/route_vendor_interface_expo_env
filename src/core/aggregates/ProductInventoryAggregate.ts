import { ProductInventory } from "@/src/core/entities/ProductInventory";

export class ProductInventoryAggregate {
    private productInventory: ProductInventory[]; 

    constructor(productInventory: ProductInventory[]) {
        this.productInventory = productInventory;
    }

    insertProductToInventory(idProductInventory: string, priceAtMoment: number, stock: number, idProduct: string) {

        const indexFound:number = this.productInventory.findIndex(pi => pi['id_product_inventory'] === idProductInventory);

        if (indexFound !== -1) throw new Error("The product you are trying to insert already exists in the inventory.");

        const newProductInventory = new ProductInventory(
            idProductInventory,
            priceAtMoment,
            stock,
            idProduct
        );

        this.productInventory.push(newProductInventory);
    }

    increaseStock(idProductInventory: string, amount: number) {
        if (this.productInventory.length === 0) throw new Error("No products in inventory.");

        const productIndex: number = this.productInventory.findIndex(pi => pi['id_product_inventory'] === idProductInventory);
        
        if (productIndex === -1) throw new Error("Product inventory not found.");

        const product:ProductInventory = this.productInventory[productIndex];

        const currentStock:number = product.get_stock_of_product();

        const updatedStock:number = currentStock + amount;

        const updatedProductInventory = new ProductInventory(
            product['id_product_inventory'],
            product.get_price_of_product(),
            updatedStock,
            product['id_product']
        );
        
        this.productInventory = this.productInventory.map((pi, index) => {
            if (index === productIndex) {
                return updatedProductInventory;
            }
            return pi;
        });
    }

    decreaseStock(idProductInventory: string, amount: number) {
        if (this.productInventory.length === 0) throw new Error("No products in inventory.");

        const productIndex: number = this.productInventory.findIndex(pi => pi['id_product_inventory'] === idProductInventory);
        
        if (productIndex === -1) throw new Error("Product inventory not found.");

        const product:ProductInventory = this.productInventory[productIndex];

        const currentStock:number = product.get_stock_of_product();

        if (amount > currentStock) {
            throw new Error("Insufficient stock to decrease.")
        };
        
        const updatedStock:number = currentStock - amount;

        const updatedProductInventory = new ProductInventory(
            product['id_product_inventory'],
            product.get_price_of_product(),
            updatedStock,
            product['id_product']
        );
        
        this.productInventory = this.productInventory.map((pi, index) => {
            if (index === productIndex) {
                return updatedProductInventory;
            }
            return pi;
        });
    }

    getProductInventory(): ProductInventory[] {
        return this.productInventory;
    }
}