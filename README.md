# multi-select-dnd
React multi select component with:
1. drag and drop
2. provided buttons and supports arrow key navigation
3. customizable item template

## How to use

```JSX
import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import MultiSelectDnD, { Item } from 'multi-select-dnd';


const leftItems = [
  { id: 1, name: 'item 1' },
  { id: 2, name: 'item 2' },
  { id: 3, name: 'item 3' }
];

const rightItems = [
  { id: 4, name: 'item 4' },
  { id: 5, name: 'item 5' },
  { id: 6, name: 'item 6' },
  { id: 7, name: 'item 7' },
  { id: 8, name: 'item 8' }
];

const itemsToDelete: Item[] = [];


export default function App() {
  const onChange = (movedItem: Item, fromContainer: string, toContainer: string, leftItems: Item[], rightItems: Item[]) => {
    const _itemsToDelete: Item[] = itemsToDelete;
    // If item is moving from the right to the left
    if (fromContainer === 'right' && toContainer === 'left') {
      // Check if the item already exists in the left container
      const existingItemInLeft = leftItems.find(item => item.id === movedItem.id);
      if (existingItemInLeft) {
        // Item exists in the left container, mark it as updated
        movedItem.mark = 'update';
      } else {
        // Item does not exist in the left container, mark it as added
        movedItem.mark = 'add';
        // in case an item was removed and added back
        const itemAddedBack = _itemsToDelete.findIndex(_item => _item.id === movedItem.id);
        if (itemAddedBack !== -1) {
          _itemsToDelete.splice(itemAddedBack, 1);
        }
      }
    }
    // If item is moving from the left to the right
    else if (fromContainer === 'left' && toContainer === 'right') {
      // Check if the item already exists in the right container
      const existingItemInRight = rightItems.find(item => item.id === movedItem.id);
      if (!existingItemInRight) {
        // Item does not exist in the right container, mark it as deleted
        movedItem.mark = 'delete';
        _itemsToDelete.push(movedItem);
      }
    }

    // here you may save the modified left items and items to be deleted
  }

  return (
    <div className="App">
      <header className="App-header">
        <DndProvider backend={HTML5Backend}>
          <MultiSelectDnD
            leftContainerHeading='Show'
            rightContainerHeading='Hide'
            leftItems={leftItems} rightItems={rightItems}
            template={(item, index, containerId, isFocused) => {
              return <span>{item.name}</span>;
            }}
            onChange={(movedItem, fromContainer, toContainer, leftItems, rightItems) =>
              onChange(movedItem, fromContainer, toContainer, leftItems, rightItems)} />
        </DndProvider>
      </header>
    </div>
  );
}
```