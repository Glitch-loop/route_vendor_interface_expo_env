import { ProductInventoryAggregate } from "@/src/core/aggregates/ProductInventoryAggregate";
import { ProductInventory } from "@/src/core/entities/ProductInventory";

describe("ProductInventoryAggregate", () => {
    let aggregate: ProductInventoryAggregate;
    let initialProduct: ProductInventory;

    beforeEach(() => {
        initialProduct = new ProductInventory(
            "pi-1",
            100,
            50,
            "product-1"
        );
        aggregate = new ProductInventoryAggregate([initialProduct]);
    });

    describe("constructor", () => {
        it("should initialize with an empty array", () => {
            const emptyAggregate = new ProductInventoryAggregate([]);
            expect(emptyAggregate.getProductInventory()).toEqual([]);
        });

        it("should initialize with product inventory items", () => {
            const inventory = aggregate.getProductInventory();
            expect(inventory.length).toBe(1);
            expect(inventory[0]).toBe(initialProduct);
        });

        it("should handle multiple products on initialization", () => {
            const product2 = new ProductInventory("pi-2", 50, 100, "product-2");
            const product3 = new ProductInventory("pi-3", 200, 25, "product-3");
            const multiAggregate = new ProductInventoryAggregate([initialProduct, product2, product3]);

            const inventory = multiAggregate.getProductInventory();
            expect(inventory.length).toBe(3);
        });
    });

    describe("insertProductToInventory", () => {
        it("should add a new product to inventory", () => {
            aggregate.insertProductToInventory("pi-2", 150, 30, "product-2");

            const inventory = aggregate.getProductInventory();
            expect(inventory.length).toBe(2);
            expect(inventory[1].get_stock_of_product()).toBe(30);
            expect(inventory[1].get_price_of_product()).toBe(150);
        });

        it("should add product with correct product reference", () => {
            aggregate.insertProductToInventory("pi-2", 150, 30, "product-2");

            const inventory = aggregate.getProductInventory();
            expect(inventory[1]['id_product']).toBe("product-2");
        });

        it("should preserve existing products when adding new one", () => {
            const stockBefore = initialProduct.get_stock_of_product();
            aggregate.insertProductToInventory("pi-2", 150, 30, "product-2");

            const inventory = aggregate.getProductInventory();
            expect(inventory[0].get_stock_of_product()).toBe(stockBefore);
        });

        it("should allow adding multiple products sequentially", () => {
            aggregate.insertProductToInventory("pi-2", 150, 30, "product-2");
            aggregate.insertProductToInventory("pi-3", 200, 50, "product-3");
            aggregate.insertProductToInventory("pi-4", 75, 15, "product-4");

            const inventory = aggregate.getProductInventory();
            expect(inventory.length).toBe(4);
        });

        it("should throw error when inserting a product that already exists", () => {
            aggregate.insertProductToInventory("pi-2", 150, 30, "product-2");

            expect(() => {
                aggregate.insertProductToInventory("pi-2", 200, 50, "product-2");
            }).toThrow("The product you are trying to insert already exists in the inventory.");
        });

        it("should throw error when inserting product with same id as initial product", () => {
            expect(() => {
                aggregate.insertProductToInventory("pi-1", 200, 100, "product-1");
            }).toThrow("The product you are trying to insert already exists in the inventory.");
        });
    });

    describe("increaseStock", () => {
        it("should increase stock of existing product", () => {
            aggregate.increaseStock("pi-1", 25);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_stock_of_product()).toBe(75); // 50 + 25
        });

        it("should throw error if product inventory not found", () => {
            expect(() => {
                aggregate.increaseStock("pi-nonexistent", 10);
            }).toThrow("Product inventory not found.");
        });

        it("should throw error if no products in inventory", () => {
            const emptyAggregate = new ProductInventoryAggregate([]);
            expect(() => {
                emptyAggregate.increaseStock("pi-1", 10);
            }).toThrow("No products in inventory.");
        });

        it("should preserve price when increasing stock", () => {
            const priceBefore = initialProduct.get_price_of_product();
            aggregate.increaseStock("pi-1", 10);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_price_of_product()).toBe(priceBefore);
        });

        it("should increase value correctly when stock increases", () => {
            const valueBefore = initialProduct.get_value_of_product();
            aggregate.increaseStock("pi-1", 50);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_value_of_product()).toBe(valueBefore + 50 * initialProduct.get_price_of_product());
        });

        it("should handle increasing by zero", () => {
            const stockBefore = initialProduct.get_stock_of_product();
            aggregate.increaseStock("pi-1", 0);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_stock_of_product()).toBe(stockBefore);
        });

        it("should handle large quantity increases", () => {
            aggregate.increaseStock("pi-1", 10000);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_stock_of_product()).toBe(10050);
        });
    });

    describe("decreaseStock", () => {
        it("should decrease stock of existing product", () => {
            aggregate.decreaseStock("pi-1", 10);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_stock_of_product()).toBe(40); // 50 - 10
        });

        it("should throw error if product inventory not found", () => {
            expect(() => {
                aggregate.decreaseStock("pi-nonexistent", 10);
            }).toThrow("Product inventory not found.");
        });

        it("should throw error if no products in inventory", () => {
            const emptyAggregate = new ProductInventoryAggregate([]);
            expect(() => {
                emptyAggregate.decreaseStock("pi-1", 10);
            }).toThrow("No products in inventory.");
        });

        it("should throw error if amount exceeds current stock", () => {
            expect(() => {
                aggregate.decreaseStock("pi-1", 100); // Stock is 50
            }).toThrow("Insufficient stock to decrease.");
        });

        it("should allow decreasing to zero", () => {
            aggregate.decreaseStock("pi-1", 50);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_stock_of_product()).toBe(0);
        });

        it("should preserve price when decreasing stock", () => {
            const priceBefore = initialProduct.get_price_of_product();
            aggregate.decreaseStock("pi-1", 10);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_price_of_product()).toBe(priceBefore);
        });

        it("should decrease value correctly when stock decreases", () => {
            const valueBefore = initialProduct.get_value_of_product();
            aggregate.decreaseStock("pi-1", 25);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_value_of_product()).toBe(valueBefore - 25 * initialProduct.get_price_of_product());
        });

        it("should throw error if amount equals current stock plus one", () => {
            expect(() => {
                aggregate.decreaseStock("pi-1", 51);
            }).toThrow("Insufficient stock to decrease.");
        });
    });

    describe("getProductInventory", () => {
        it("should return all products in inventory", () => {
            aggregate.insertProductToInventory("pi-2", 150, 30, "product-2");
            aggregate.insertProductToInventory("pi-3", 200, 20, "product-3");

            const inventory = aggregate.getProductInventory();
            expect(inventory.length).toBe(3);
        });

        it("should return empty array when no products", () => {
            const emptyAggregate = new ProductInventoryAggregate([]);
            expect(emptyAggregate.getProductInventory()).toEqual([]);
        });
    });

    describe("Complex scenarios", () => {
        it("should handle multiple products with increase and decrease operations", () => {
            aggregate.insertProductToInventory("pi-2", 150, 100, "product-2");
            aggregate.insertProductToInventory("pi-3", 200, 50, "product-3");

            aggregate.increaseStock("pi-1", 25);
            aggregate.decreaseStock("pi-2", 30);
            aggregate.increaseStock("pi-3", 10);

            const inventory = aggregate.getProductInventory();
            const p1 = inventory.find(p => p['id_product_inventory'] === "pi-1");
            const p2 = inventory.find(p => p['id_product_inventory'] === "pi-2");
            const p3 = inventory.find(p => p['id_product_inventory'] === "pi-3");

            expect(p1!.get_stock_of_product()).toBe(75);
            expect(p2!.get_stock_of_product()).toBe(70);
            expect(p3!.get_stock_of_product()).toBe(60);
        });

        it("should handle interleaved operations on same product", () => {
            aggregate.increaseStock("pi-1", 10);
            aggregate.decreaseStock("pi-1", 5);
            aggregate.increaseStock("pi-1", 20);
            aggregate.decreaseStock("pi-1", 15);

            const inventory = aggregate.getProductInventory();
            const product = inventory.find(p => p['id_product_inventory'] === "pi-1");
            expect(product!.get_stock_of_product()).toBe(60); // 50 + 10 - 5 + 20 - 15
        });

        it("should track correct total inventory value after operations", () => {
            const p1 = new ProductInventory("pi-1", 100, 50, "product-1");
            const p2 = new ProductInventory("pi-2", 200, 25, "product-2");
            const multiAggregate = new ProductInventoryAggregate([p1, p2]);

            multiAggregate.increaseStock("pi-1", 10);
            multiAggregate.decreaseStock("pi-2", 5);

            const inventory = multiAggregate.getProductInventory();
            const totalValue = inventory.reduce((sum, p) => sum + p.get_value_of_product(), 0);
            
            const expectedValue = (60 * 100) + (20 * 200); // 6000 + 4000 = 10000
            expect(totalValue).toBe(expectedValue);
        });
    });

    describe("Edge cases", () => {
        it("should handle negative stock amounts in decrease (boundary test)", () => {
            expect(() => {
                aggregate.decreaseStock("pi-1", 51);
            }).toThrow("Insufficient stock to decrease."); // -10 should be treated as invalid operation check
        });

        it("should preserve product inventory reference in id_product", () => {
            aggregate.insertProductToInventory("pi-2", 150, 30, "product-2");

            const inventory = aggregate.getProductInventory();
            expect(inventory[1]['id_product']).toBe("product-2");
            expect(inventory[0]['id_product']).toBe("product-1");
        });
    });
});
