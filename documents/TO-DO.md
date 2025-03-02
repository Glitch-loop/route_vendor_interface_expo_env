### Implement changes resulted of the database modification "workday"
Creation day: 03/02/25
Context: With the current architecture it is not possible to determine which "route day" belongs the current work day. (it is possible to know to which route it belongs, but not to which day the work day belongs)
STATUS:TO-DO
Tasks:
- Update workday controllers
- Set as null the "finish_date", this status is used to determine that the work day is not finished
- Verify that  "finish_date = Null" doesn't affect to the flow of the application

### Implementing short-term storage for route transactions to avoid missing of data in case of the user closes the application

### Add in route transaction operation description the field "comission_at_moment", the commission is sealed at the moment of selling.

### Fix the bug on which the work day are not properly closed (start date remains in the finish date and the 
end_pitty_cash is not being updated with the money that the vendo should have).


### Implementing formatter for formatting the titles and text.
Created at: 01/25/25
Status: Done
Finished at: 01/25/25

### Search a store by geography proximity.
- At the moment of selling to a client that is not in the current route, instead of searching by store's name, it is better to search a client by geography approximation.
- At the moment of adding a new client. It is better to display a map showing the store to make aware to the user if that client has been added previously.

### Implementing tracking of vendor's position.

### Detected bug: When you update an inventory operation, it is not being updated in the vendor's stock

### Implementing the IP or mac of the printer in case that the vendor far from the printer.
- During a work day it was realized that the connection of the printer is a little bit delicate being prone the application of 
disconneting from the printer
- In addition, it seems that the model of the printer is common, so it is possible that if the app is disconnected from the ptiner
the app accidentally gets connected to another printer.

### What happens with the special case on which the vendor changes one product for another one or preventing product devolution in the future?


### Implementing a better workflow for the product devolution
It might be clearer for the vendor a guided process
- DONE 

### Context for the current sale.
The more lasts a sale, it is more probably that the sale gets lost. This might be by several factors from the user moves to another 
application to the application gets closed for one reason.


### Add the action to refresh the screen in the route selection layout.
- DONE

### In route selection, mark the day that is is turn.
- DONE

### Add logic to the exit buttom.
- DONE
### 

### Implementing a sequential addition for the new products
- SOLVED

### Make grater the fontsize in the sale layout
- SOLVED

### At the moment of scrolldown, this action erase the information of an input.
- SOLVED

### In the inventory visualization, those cells different of 0 color them for a better identification.
- SOLVED


### Fixing inventory visualization bug.
- SOLVED


### Implementing a more clear header for the inventory operation visualization.
- SOLVED

### Inventory operation modifiable is not correctly determined.
- SOLVED