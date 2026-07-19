/*
	Note (06-26-26)
	This enum contains the different day operation the vendor can make.

	A day operation is defined as an action the vendor might do 
	during the work day. 

	Each day operation has its own uuid, this works as the univeral identifier
	of the operation across the application and with other systems that 
	interacts this applicaiton.
*/

export enum DAY_OPERATIONS {
	// Related to inventory.
	start_shift_inventory 				= '5361d05b-e291-4fce-aa70-9452d7cfcadd',
	restock_inventory 						= '37bb2bb6-f8a1-4df9-8318-6fb9831aae49',
	end_shift_inventory 					= 'b94e615c-9899-4e82-99f1-979d773b8341',
	product_devolution_inventory 	= '8e93283a-39a3-4b2d-9383-af418d6ddfe2',
	consult_inventory 						= 'f3055418-04ea-4d27-baf5-7da940e47662',
	cancel_inventory_operation 		= 'be37a25c-f06a-4d8a-b2e5-de56c163ac0c',

	// Related to route transactions.
	route_transaction 						= '3dfde724-fb9c-4944-b38b-2022a9689bb4',
	cancel_route_transaction 			= 'f11d95a4-2d40-4dad-9209-d2731c884597',
	product_devolution 						= '8ebe4f07-d28e-46f5-988e-3ab3790e612d',
	sales 												= '992f002c-13e2-4fb8-ac20-b7b571b9162a',
	sample 												= 'f77da214-a8e8-480b-ac8d-e41d2ed6c5af',
	product_reposition 						= 'ec313b8e-ba1d-4a77-bbfb-bb662663720c',

	// Related to client operations.
	prospect_registration 				= '144addfa-2963-486e-9c13-0ac97537fda3',
	new_client_registration 			= 'a29dccef-d5a0-470d-a353-2f95e1057514',
	attention_out_of_route 				= '473e5d83-5f45-4d85-b74e-e4e26fee9279',
	route_client_attention 				= '39088d69-f29d-4b9b-be59-a3571924cf54',
	attend_client_petition 				= '7bfd1aae-b315-4954-a11d-249f413b3d9e',
	client_visited				 				= '45354223-2156-46d0-8aa7-6f178f85671a',
}

export default DAY_OPERATIONS;