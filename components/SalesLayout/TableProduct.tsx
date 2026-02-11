// Libraries
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import tw from 'twrnc';

// UI Components
import CardProduct from '@/components/SalesLayout/CardProduct';
import SectionTitle from '@/components/SalesLayout/SectionTitle';
import SubtotalLine from '@/components/SalesLayout/SubtotalLine';
import HeaderProduct from '@/components/SalesLayout/HeaderProduct';
import SearchBarWithSuggestions from '@/components/SalesLayout/SearchBarWithSuggestions';

// DTOs
import ProductDTO from '@/src/application/dto/ProductDTO';
import ProductInventoryDTO from '@/src/application/dto/ProductInventoryDTO';
import RouteTransactionDescriptionDTO from '@/src/application/dto/RouteTransactionDescriptionDTO';

// Utils
import { capitalizeFirstLetterOfEachWord } from '@/utils/string/utils';


function createCatalog(avialableProducts:ProductDTO[], productsInventory:ProductInventoryDTO[]):(ProductDTO&ProductInventoryDTO)[] {
  const catalog:(ProductDTO&ProductInventoryDTO)[] = [];
  let id_product_inventory:string = '';
  let price_at_moment:number = 0;
  let stock:number = 0;

  const arrAvailableProducts = avialableProducts.map(prod => prod);

  const availableProductsOrdered = arrAvailableProducts.sort((a, b) => a.order_to_show - b.order_to_show);

  for (const availableProduct of availableProductsOrdered) {
    const { id_product, product_name, barcode, weight, unit, comission, price, product_status, order_to_show } = availableProduct;

    const productInInventory = productsInventory.find(prodInv => prodInv.id_product === availableProduct.id_product);

    if (productInInventory === undefined) {
      id_product_inventory = id_product;
      price_at_moment = price;
      stock = 0;
    } else {
      id_product_inventory = productInInventory.id_product_inventory;
      price_at_moment = productInInventory.price_at_moment;
      stock = productInInventory.stock;
    }


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

  for (const productInventory of productsInventory) {
    const productDetails = avialableProducts.find(prod => prod.id_product === productInventory.id_product);

    if (productDetails === undefined) continue;
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


function validatorCriteriaByProductInventoryForSearchBar(query: string, item: ProductInventoryDTO&ProductDTO):boolean {
  const { product_name } = item;
    return product_name.toLowerCase().includes(query.toLowerCase());
}

function criteriaForSelectedItemsByProductInventoryForSearchBar(item: ProductInventoryDTO&ProductDTO, selectedItems: (ProductInventoryDTO&ProductDTO)[]):boolean {
    return selectedItems.some(selectedItem => selectedItem.product_name === item.product_name);
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
    setCommitedProduct:(movements: RouteTransactionDescriptionDTO[], newItem: ProductDTO&ProductInventoryDTO|null, amount: number) => void,
    sectionTitle:string,
    sectionCaption: string,
    totalMessage: string,
  }) => {
    const catalog:(ProductDTO&ProductInventoryDTO)[] = createCatalog(avialableProducts, productInventory);
    const catalogMap: Map<string, ProductDTO&ProductInventoryDTO> = converCatalogToMap(catalog); // <id_product_inventory, ProductDTO&ProductInventoryDTO>
    
    const [catalogToShow, setCatalogToShow] = useState<(ProductDTO&ProductInventoryDTO)[]>(catalog);  



    useEffect(() => {
      const newCatalogToShow:(ProductDTO&ProductInventoryDTO)[] = catalog.filter(product => {
        const { id_product_inventory } = product;
        if (commitedProducts.find((commitedProduct) => commitedProduct.id_product_inventory === id_product_inventory) === undefined) return true
        else return false
      });

      setCatalogToShow(newCatalogToShow);
      
    }, [commitedProducts]);

    // Handlers
    /*
      Notes about handler implementation:
      Although the name of the field is id_product, it is actually the id_product_inventory.
      It depends on the product inventory and not in the product perse.
    */

    const onSelectAnItem = (selectedItem:ProductInventoryDTO&ProductDTO) => {
      //Avoiding duplicates
      const foundItem:RouteTransactionDescriptionDTO|undefined = commitedProducts.find(product => {
        return product.id_product_inventory === selectedItem.id_product_inventory;
      });

      if (foundItem === undefined) {
        setCommitedProduct(
          [...commitedProducts], 
          {...selectedItem},
          1 // Default amount when adding a new product
        );
      }
    };

    const handleOnChangeAmount = (changedItem:RouteTransactionDescriptionDTO, newAmount:number) => {
      if (newAmount <= 0) return;
      
      const { id_product_inventory } = changedItem;

      if (catalogMap.has(id_product_inventory) === false) return;

      const productDetails = catalogMap.get(id_product_inventory)!;


      setCommitedProduct(
        [ ...commitedProducts ],
        { ...productDetails },
        newAmount   
      );
    };

    const handleOnDelteItem = (deleteItem:RouteTransactionDescriptionDTO) => {
      const updatedCommitedProducts = commitedProducts.filter(product => product.id_product_inventory !== deleteItem.id_product_inventory);
      setCommitedProduct(updatedCommitedProducts, null, 0);
    };

  return (
    <View style={tw`w-full flex-1 items-center`}>
      <SectionTitle
        title               = { sectionTitle }
        caption             = { sectionCaption }
        titlePositionStyle  = { 'justify-center items-center' }/>
      <View style={tw`w-full mt-3 flex flex-row justify-center my-2`}>
        <SearchBarWithSuggestions
          selectedCatalog = { commitedProducts }
          catalog         = { catalogToShow }
          fieldToSearch   = { 'product_name' }
          keyField        = { 'id_product_inventory' }
          onSelectHandler = { onSelectAnItem }
          criteriaForValidQuery = { validatorCriteriaByProductInventoryForSearchBar }
          criteriaForSelectedItems = { criteriaForSelectedItemsByProductInventoryForSearchBar }
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
                productName   = { capitalizeFirstLetterOfEachWord(product_name) }
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
          const { amount, id_product_inventory } = currentValue;

          if (catalogMap.has(id_product_inventory)) {
            const productCatalog = catalogMap.get(id_product_inventory)!;
            const { price_at_moment } = productCatalog;
            price = price_at_moment;
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
