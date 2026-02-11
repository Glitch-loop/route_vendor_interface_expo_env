import React, { useState } from 'react';
import { View, Pressable, Text, ScrollView } from 'react-native';
import { Searchbar } from 'react-native-paper';
import tw from 'twrnc';
import { Provider } from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { capitalizeFirstLetter, capitalizeFirstLetterOfEachWord } from '@/utils/generalFunctions';
import { isProductDTO, isStoreDTO } from '@/src/application/guards/dtoGuards';
import { getAddressOfStore } from '@/utils/stores/utils';

/*
  To make this module reusable, it was decided to pass as props an array of "any"
  and a string that is going to be used to search the variable.
*/


function ItemPresentation(item: any, fieldToSearch: string) {
  if (isProductDTO(item)) {
    const { product_name } = item;
    return (
    <View>
      <Text style={tw`text-xl text-center`}>{capitalizeFirstLetter(product_name)}</Text>
    </View>
    );
  } else if(isStoreDTO(item)) {
    const { store_name } = item;
    return (
      <View>
        <Text style={tw`text-xl text-center`}>{capitalizeFirstLetter(store_name)}</Text>
        <Text style={tw`text-sm text-center`}>{getAddressOfStore(item)}</Text>
      </View>
    );
  } else {
    return (
      <Text style={tw`text-xl text-center`}>{capitalizeFirstLetter(item[fieldToSearch])}</Text>
    )
  }
}

const SearchBarWithSuggestions = ({
    catalog,
    selectedCatalog,
    fieldToSearch,  // Field used to filter the catalog based on the search query and to show the suggestions.
    keyField,       // Used as key to identify the item in the suggestion list.
    onSelectHandler,
    criteriaForValidQuery, // Fucntion with the criteria to determine if the item accomplishes the search query.
    criteriaForSelectedItems, // Function with the criteria to determine if the item is already selected (to avoid showing it in the suggestion list).
  }:{
    catalog:any[],
    selectedCatalog: any[],
    fieldToSearch:string,
    keyField:string|number,
    onSelectHandler:any,
    criteriaForValidQuery: (query: any, item: any) => boolean,
    criteriaForSelectedItems: (item: any, selectedItems: any[]) => boolean
  }) => {
  // Importing redux state

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filteredData, setFilteredData] = useState<any[]>([]);

  // Handler for search input changes
  const onChangeSearch = (query:string) => {
    setSearchQuery(query);
    let result = false;
    // Filter data based on search query
    if (query) {
      const filtered = catalog.filter((item) => {
        
        if (criteriaForValidQuery(query, item)) {
          result = !criteriaForSelectedItems(item, selectedCatalog);
        } else {
          result = false;
        }
        
        return result;

        // let validQuery = item[fieldToSearch].toLowerCase().includes(query.toLowerCase());
        
        // let result = false;
        // if (criteria(item)) {
        //   const selectedItem = selectedCatalog
        //     .find(verifySelectedItem => { return verifySelectedItem[fieldToSearch] === item[fieldToSearch]; });

        //   if (selectedItem === undefined) {
        //     // Valid product to show.
        //     result = true;
        //   } else {
        //     // Product that was already choosen.
        //     result = false;
        //   }
        // } else {
        //   // Product that doesn't accomplish the query.
        //   result = false;
        // }

        // return result;
      }
      );
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  };

  // Handler for when a suggestion is selected
  const onSelectItem = (item:any) => {
    onSelectHandler(item);
    setSearchQuery('');
    setFilteredData([]);
  };

  return (
    <View style={tw`h-16 w-11/12 flex flex-col`}>
      <View style={tw`h-full w-full`}>
        <Provider>
          <Searchbar
            clearIcon={() => {return '';}}
            icon={() => <MaterialIcons name="search" size={24} color="gray" />}
            style={tw`h-full border border-solid text-xl`}
            placeholder="Search"
            onChangeText={onChangeSearch}
            value={searchQuery}
          />
        </Provider>
      </View>
      {filteredData.length > 0 &&
        <View style={tw`absolute top-11 z-20 w-full rounded border-solid border-l border-r border-b flex flex-1 flex-row justify-center items-center max-h-56`}>
          {/* Display suggestions */}
          <ScrollView nestedScrollEnabled={true} className='flex flex-1 w-full justify-center items-center'>
            {filteredData.length > 0 && (
              filteredData.map(item => (
                <Pressable
                  key={item[keyField]}
                  style={({pressed}) => [
                    tw`p-3 border border-0 border-b-2 border-solid`,
                    pressed ? tw`bg-purple-200` : tw`bg-purple-50`,
                  ]}
                  onPress={() => onSelectItem(item)}>
                  {/* <Text style={tw`text-xl text-center`}>
                    {capitalizeFirstLetterOfEachWord(item[fieldToSearch])}
                  </Text> */}
                  {ItemPresentation(item, fieldToSearch)}
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      }
    </View>
  );
};

export default SearchBarWithSuggestions;
