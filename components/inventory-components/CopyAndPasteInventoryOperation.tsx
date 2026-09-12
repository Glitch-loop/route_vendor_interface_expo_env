import ProductClass from "@/classes/ProductClass";
import InventoryOperationDescriptionDTO from "@/src/application/dto/InventoryOperationDescriptionDTO";
import ProductDTO from "@/src/application/dto/ProductDTO";
import {
  headerTitleTableStyle,
  textHeaderTableStyle,
  cellTableStyle,
  textRowTableStyle,
} from "@/utils/inventoryOperationTableStyles";
import { capitalizeFirstLetterOfEachWord } from "@/utils/string/utils";
import DangerButton from "@/components/shared-components/DangerButton";
import { useEffect, useMemo, useRef, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { DataTable } from "react-native-paper";
import tw from "twrnc";

type CopyAndPasteInventoryOperationProps = {
  availableProducts: ProductDTO[]
  movementsOfOperation: InventoryOperationDescriptionDTO[],
  productWithPrices: Map<String, ProductClass>,
  setInventoryOperation: (product: InventoryOperationDescriptionDTO[]) => void,
}

/*
  Parses lines with format "<id_product>\t<quantity>" into a map of id_product -> quantity.
  Malformed lines (missing tab, non numeric quantity) are ignored.
*/
function parsePastedInventory(rawText: string): Map<string, number> {
  const parsedEntries = new Map<string, number>();

  rawText.split('\n').forEach((line) => {
    const trimmedLine = line.trim();
    if (trimmedLine.length === 0) return;

    const [id_product, rawQuantity] = trimmedLine.split('\t');
    const quantity = Number(rawQuantity);

    if (id_product !== undefined && !Number.isNaN(quantity)) {
      parsedEntries.set(id_product.trim(), quantity);
    }
  });

  return parsedEntries;
}

const CopyAndPasteInventoryOperation = ({
  availableProducts,
  movementsOfOperation,
  productWithPrices,
  setInventoryOperation,
}: CopyAndPasteInventoryOperationProps) => {
  const [pastedText, setPastedText] = useState('');
  // Keeps the latest movements without forcing the sync effect to depend on it (avoids update loops).
  const movementsOfOperationRef = useRef(movementsOfOperation);
  movementsOfOperationRef.current = movementsOfOperation;
  // Tracks which products were added by this component on the previous parse, so they can be cleared.
  const previousPastedIdsRef = useRef<Set<string>>(new Set());

  const orderedAvailableProducts = useMemo(
    () => availableProducts.map(prod => prod).sort((a, b) => a.order_to_show - b.order_to_show),
    [availableProducts]
  );

  const parsedEntries = useMemo(() => parsePastedInventory(pastedText), [pastedText]);

  const pastedProducts = useMemo(
    () => orderedAvailableProducts.filter((product) => parsedEntries.has(product.id_product)),
    [orderedAvailableProducts, parsedEntries]
  );

  useEffect(() => {
    const idsToRemove = new Set<string>([...previousPastedIdsRef.current, ...parsedEntries.keys()]);
    if (idsToRemove.size === 0) return;

    const updatedMovements: InventoryOperationDescriptionDTO[] = [
      ...movementsOfOperationRef.current.filter((movement) => !idsToRemove.has(movement.id_product)),
      ...pastedProducts.map((product) => {
        const amount = parsedEntries.get(product.id_product)!;
        const price_at_moment = productWithPrices.has(product.id_product)
          ? productWithPrices.get(product.id_product)!.getPrice()
          : 0;

        return {
          id_product_operation_description: '',
          price_at_moment,
          cost_at_moment: product.cost,
          amount,
          id_inventory_operation: '',
          id_product: product.id_product,
        };
      }),
    ];

    previousPastedIdsRef.current = new Set(parsedEntries.keys());
    setInventoryOperation(updatedMovements);
  }, [parsedEntries, pastedProducts, productWithPrices, setInventoryOperation]);

  const clearPastedInventory = () => {
    setInventoryOperation(
      movementsOfOperationRef.current.filter((movement) => !previousPastedIdsRef.current.has(movement.id_product))
    );
    previousPastedIdsRef.current = new Set();
    setPastedText('');
  };

  return (
    <View style={tw`w-full`}>
      <View style={tw`flex flex-row items-center justify-between mb-2`}>
        <Text style={tw`text-black text-base font-bold`}>Copia y pega el inventario</Text>
        <DangerButton iconName="trash" onPressButton={clearPastedInventory} />
      </View>
      <TextInput
        multiline
        numberOfLines={6}
        value={pastedText}
        onChangeText={setPastedText}
        style={tw`w-full border border-gray-300 rounded p-2 text-black h-32`}
        textAlignVertical="top"
      />
      { pastedProducts.length > 0 &&
        <DataTable style={tw`w-full mt-4`}>
          <DataTable.Header>
            <DataTable.Title style={tw`${headerTitleTableStyle}`}>
              <Text style={tw`${textHeaderTableStyle}`}>Producto</Text>
            </DataTable.Title>
            <DataTable.Title style={tw`${headerTitleTableStyle}`}>
              <Text style={tw`${textHeaderTableStyle}`}>Cantidad</Text>
            </DataTable.Title>
          </DataTable.Header>
          { pastedProducts.map((product) => {
            const amount = parsedEntries.get(product.id_product)!;
            return (
              <DataTable.Row key={product.id_product}>
                <DataTable.Cell style={tw`${cellTableStyle}`}>
                  <Text style={tw`${textRowTableStyle}`}>{capitalizeFirstLetterOfEachWord(product.product_name)}</Text>
                </DataTable.Cell>
                <DataTable.Cell style={tw`${cellTableStyle}`}>
                  <Text style={tw`${textRowTableStyle}`}>{amount}</Text>
                </DataTable.Cell>
              </DataTable.Row>
            );
          })}
        </DataTable>
      }
    </View>
  );
};

export default CopyAndPasteInventoryOperation;
