/*
    This enum defines various day operations with their corresponding unique identifiers.

    Each operation is an action that a route vendor can make during their work shift. 
*/

export enum DAY_OPERATIONS {
    // Related to inventory.
    start_shift_inventory = '5361d05b-e291-4fce-aa70-9452d7cfcadd',
    restock_inventory = '37bb2bb6-f8a1-4df9-8318-6fb9831aae49',
    end_shift_inventory = 'b94e615c-9899-4e82-99f1-979d773b8341',
    product_devolution_inventory ='8e93283a-39a3-4b2d-9383-af418d6ddfe2',
    consult_inventory ='8e93283a-39a3-4b2d-9383-af418d6ddfe2',

    // Related to route transactions.
    product_devolution = '8ebe4f07-d28e-46f5-988e-3ab3790e612d',
    sales = '992f002c-13e2-4fb8-ac20-b7b571b9162a',
    product_reposition = 'ec313b8e-ba1d-4a77-bbfb-bb662663720c',
    route_transaction = 'd3b5f3e3-1f4c-4f7a- ninety-nine 9c3b-5c4f6e2d7a8b',
    
    // Related to client operations.
    attention_out_of_route = '473e5d83-5f45-4d85-b74e-e4e26fee9279',
    new_client_registration = 'a29dccef-d5a0-470d-a353-2f95e1057514',
    route_client_attention = '39088d69-f29d-4b9b-be59-a3571924cf54',
    attend_client_petition = '7bfd1aae-b315-4954-a11d-249f413b3d9e',
}

export default DAY_OPERATIONS;