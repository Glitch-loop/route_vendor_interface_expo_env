// Libraries
import React from 'react';
import { View } from 'react-native';
import tw from 'twrnc';

// Components
import CardProduct from './CardProduct';
import SectionTitle from './SectionTitle';
import SubtotalLine from './SubtotalLine';
import HeaderProduct from './HeaderProduct';
import SearchBarWithSuggestions from './SearchBarWithSuggestions';

import { IProductInventory } from '../../interfaces/interfaces';
import ProductDTO from '@/src/application/dto/ProductDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';


/*
  RouteTransactionDescriptionDTO should depend on ProductInventoryDTO id but since the requirements say
  that only one product will appear then it is ok to depend directly on ProductDTO id.

  In a futuree, if needed, this could be implemented to handle different prices for the same product depending on inventory.
*/

function createCatalog(avialableProducts:ProductDTO[], productsInventory:ProductInventoryDTO[]):(ProductDTO&ProductInventoryDTO)[] {
  const catalog:(ProductDTO&ProductInventoryDTO)[] = [];
  for (const productInventory of productsInventory) {
    const productDetails = avialableProducts.find(prod => prod.id_product ===   productInventory.id_product);

    if (productDetails === undefined) continue;

    const { id_product, product_name, barcode, weight, unit, comission, price, product_status, order_to_show } = productDetails;
    const { id_product_inventory, price_at_moment, stock } = productInventory;

    catalog.push({
      id_product: id_product,
      product_name: product_name,
      barcode: barcode,
      weight: weight,
      unit: unit,
      comission: comission,
      price: price,
      product_status: product_status,
      order_to_show: order_to_show,
      id_product_inventory: id_product_inventory,
      price_at_moment: price_at_moment,
      stock: stock,
    })
  }

  return catalog;
}

function converCatalogToMap(catalog: (ProductDTO&ProductInventoryDTO)[]): Map<string, ProductDTO&ProductInventoryDTO> {
  const catalogMap: Map<string, ProductDTO&ProductInventoryDTO> = new Map();
  for (const product of catalog) {
    catalogMap.set(product.id_product_inventory, product);
  }

  return catalogMap;
}

const TableProduct = ({
    avialableProducts,
    productInventory,
    commitedProducts,
    setCommitedProduct,
    sectionTitle,
    sectionCaption,
    totalMessage,
  }:{
    avialableProducts:ProductDTO[],
    productInventory:ProductInventoryDTO[],
    commitedProducts:RouteTransactionDescriptionDTO[],
    setCommitedProduct:(movements: RouteTransactionDescriptionDTO[]) => void,
    sectionTitle:string,
    sectionCaption: string,
    totalMessage: string,
  }) => {

    const catalog:(ProductDTO&ProductInventoryDTO)[] = createCatalog(avialableProducts, productInventory);
    const catalogMap: Map<string, ProductDTO&ProductInventoryDTO> = converCatalogToMap(catalog);

    // Handlers
    /*
      Notes about handler implementation:
      Although the name of the field is id_product, it is actually the id_product_inventory.
      It depends on the product inventory and not in the product perse.
    */

    const onSelectAnItem = (selectedItem:RouteTransactionDescriptionDTO) => {
      const newItem:RouteTransactionDescriptionDTO = { ...selectedItem };

      //Avoiding duplicates
      const foundItem:RouteTransactionDescriptionDTO|undefined = commitedProducts.find(product => {
        return product.id_product_inventory === selectedItem.id_product_inventory;
      });

      if (foundItem === undefined) {
        newItem.amount = 1;

        setCommitedProduct([
          {...newItem},
          ...commitedProducts,
        ]);
      }
    };

    const handleOnChangeAmount = (changedItem:RouteTransactionDescriptionDTO, newAmount:number) => {
      const updatedCommitedProducts = commitedProducts.map(product => {
        if (product.id_product_inventory === changedItem.id_product_inventory) {
          return {
            ...changedItem,
            amount: newAmount,
          };
        } else {
          return product;
        }
      });
      setCommitedProduct(updatedCommitedProducts);
    };

    const handleOnDelteItem = (deleteItem:RouteTransactionDescriptionDTO) => {
      const updatedCommitedProducts = commitedProducts.filter(product => product.id_product_inventory !== deleteItem.id_product_inventory);
      setCommitedProduct(updatedCommitedProducts);
    };

  return (
    <View style={tw`w-full flex-1 items-center`}>
      <SectionTitle
        title={sectionTitle}
        caption={sectionCaption}
        titlePositionStyle={'justify-center items-center'}/>
      <View style={tw`w-full mt-3 flex flex-row justify-center my-2`}>
        <SearchBarWithSuggestions
          selectedCatalog={commitedProducts}
          catalog={catalog}
          fieldToSearch={'product_name'}
          keyField={'id_product_inventory'}
          onSelectHandler={onSelectAnItem}
          />
      </View>
      <HeaderProduct />
      { commitedProducts.length > 0 &&
        commitedProducts.map(commitedProduct => {
          const { amount, id_product_inventory } = commitedProduct;
          let productCatalog: ProductDTO&ProductInventoryDTO|undefined = undefined
          

          if (id_product_inventory === null)  return null;
          
          if (catalogMap.has(id_product_inventory)) {
            productCatalog = catalogMap.get(id_product_inventory);
          } else {
            return null;
          }
          
          if (productCatalog === undefined) return null;
          
          const { price_at_moment, product_name } = productCatalog;
          

          return (
            <View
              style={tw`my-1`}
              key={ id_product_inventory }>
              <CardProduct
                productName   = { product_name }
                price         = { price_at_moment }
                amount        = { amount }
                subtotal      = { price_at_moment * amount}
                item          = { commitedProduct }
                onChangeAmount= { handleOnChangeAmount }
                onDeleteItem  = { handleOnDelteItem }
              />
            </View>
          )          
        }
        )
      }
      <SubtotalLine
        description={totalMessage}
        total={
          commitedProducts.reduce((accumulator, currentValue) => {
          let price:number = 0;
          const { amount, id_product } = currentValue;

          if (catalogMap.has(id_product)) {
            const productCatalog = catalogMap.get(id_product);
            if (productCatalog !== undefined) {
              price = productCatalog.price_at_moment;
            }
          } 
            return accumulator + amount * price;
          }, 0).toString()
        }
        fontStyle={'font-bold text-lg'}
      />
      <View style={tw`w-11/12 border border-solid mt-2`} />
    </View>
  );
};

export default TableProduct;
