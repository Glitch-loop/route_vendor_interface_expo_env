import { ProductInventory } from "@/src/core/entities/ProductInventory";

export class ProductInventoryAggregate {
    private productInventory: ProductInventory[]; 
    private productInventoryModified: ProductInventory[];
    private newInsertedProducts: ProductInventory[];
    private initialProductInventory: ProductInventory[];

    constructor(productInventory: ProductInventory[]) {
        this.productInventory = productInventory;
        this.productInventoryModified = [ ];
        this.newInsertedProducts = [ ];
        this.initialProductInventory = [ ...productInventory ];
    }

    insertProductToInventory(idProductInventory: string, priceAtMoment: number, stock: number, idProduct: string) {

        const indexFound:number = this.productInventory.findIndex(pi => pi.get_id_product_inventory() === idProductInventory);

        if (indexFound !== -1) throw new Error("The product you are trying to insert already exists in the inventory.");

        const newProductInventory = new ProductInventory(
            idProductInventory,
            priceAtMoment,
            stock,
            idProduct
        );

        this.productInventory.push(newProductInventory);
        this.newInsertedProducts.push(newProductInventory);
    }

    // This function should find the product to decrease by its idProductInventory, but instead it uses id_product.
    increaseStock(idProductInventory: string, amount: number) {
        if (this.productInventory.length === 0) throw new Error("No products in inventory.");

        const productIndex: number = this.productInventory.findIndex(pi => pi.get_id_product_inventory() === idProductInventory);
        
        if (productIndex === -1) throw new Error("Product inventory not found.");

        const product:ProductInventory = this.productInventory[productIndex];

        const currentStock:number = product.get_stock_of_product();

        const updatedStock:number = currentStock + amount;

        const updatedProductInventory = new ProductInventory(
            product.get_id_product_inventory(),
            product.get_price_of_product(),
            updatedStock,
            product.get_id_product()
        );
        
        this.productInventory = this.productInventory.map((pi, index) => {
            if (index === productIndex) {
                return updatedProductInventory;
            }
            return pi;
        });

        this.productInventoryModified.push(updatedProductInventory);
    }

    // This function should find the product to decrease by its idProductInventory, but instead it uses id_product.
    decreaseStock(idProductInventory: string, amount: number) {
        if (this.productInventory.length === 0) throw new Error("No products in inventory.");
        
        const productIndex: number = this.productInventory.findIndex(pi => pi.get_id_product_inventory() === idProductInventory);
        
        if (productIndex === -1) throw new Error("Product inventory not found.");

        const product:ProductInventory = this.productInventory[productIndex];

        const currentStock:number = product.get_stock_of_product();

        if (amount > currentStock) {
            throw new Error("Insufficient stock to decrease.")
        };
        
        const updatedStock:number = currentStock - amount;

        const updatedProductInventory = new ProductInventory(
            product.get_id_product_inventory(),
            product.get_price_of_product(),
            updatedStock,
            product.get_id_product()
        );
        
        this.productInventory = this.productInventory.map((pi, index) => {
            if (index === productIndex) {
                return updatedProductInventory;
            }
            return pi;
        });

        this.productInventoryModified.push(updatedProductInventory);
    }

    /*
        Business logic for new product inventory.
        Right now, the criteria for creating a new product inventory is based on whether there is an existing record for the product.
        If no record exists, a new product inventory entry is created.
        If a record does exist, the stock is simply increased by the restocked amount.
    */
    isNewProductInventory(idProduct: string): boolean {
        const foundProductInventory = this.initialProductInventory.find(pi => pi.get_id_product() === idProduct);
        return foundProductInventory === undefined;
    }

    getProductInventory(): ProductInventory[] { // Retrieves all the inventory
        return this.productInventory;
    }

    getNewProductsInventory(): ProductInventory[] { // Retrieves only the newly inserted products
        return this.newInsertedProducts;
    }

    getModifiedProductInventory(): ProductInventory[] { // Retrieves only the modified products excluding newly inserted ones
        return this.productInventoryModified;
    }

    
}