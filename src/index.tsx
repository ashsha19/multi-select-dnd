import React from 'react';
import { useDrag, useDrop } from 'react-dnd';

import './style.css';


export interface Item {
    id: number;
    name: string;
    [key: string]: any;
}


// ItemComponent for each draggable item
const ItemComponent: React.FC<{
    key?: React.Key;
    item: Item;
    index: number;
    containerId: 'left' | 'right';
    moveItem: (fromContainer: 'left' | 'right', toContainer: 'left' | 'right', fromIndex: number, toIndex: number) => void;
    moveWithinContainer: (containerId: 'left' | 'right', fromIndex: number, toIndex: number) => void;
    isFocused: boolean;
    onFocus: () => void;
    template: (item: Item, index: number, containerId: 'left' | 'right', isFocused: boolean) => React.ReactElement;
}> = ({ item, index, containerId, moveItem, moveWithinContainer, isFocused, onFocus, template }) => {
    const [, drag] = useDrag({
        type: 'ITEM',
        item: { id: item.id, containerId, index }, // The item being dragged
    });

    const [, drop] = useDrop({
        accept: 'ITEM',
        drop: (draggedItem: { containerId: 'left' | 'right'; index: number }) => {
            if (draggedItem.containerId === containerId) {
                // If dropping within the same container, move the item within that container
                moveWithinContainer(containerId, draggedItem.index, index);
            } else {
                // If dropping in a different container, move the item between containers
                moveItem(draggedItem.containerId, containerId, draggedItem.index, index);
            }
        },
    });

    return (
        <div
            ref={(node) => { drag(drop(node)) }}
            className={`item-card ${isFocused ? 'selected' : ''}`}
            onClick={onFocus}
        >
            {template(item, index, containerId, isFocused)}
        </div>
    );
};

// Main component
const MultiSelectDnD: React.FC<{
    leftItems: Item[];
    rightItems: Item[];
    leftContainerHeading?: string;
    rightContainerHeading?: string;
    noLeftItemsMessage?: string;
    noRightItemsMessage?: string;
    template?: (item: Item, index: number, containerId: 'left' | 'right', isFocused: boolean) => React.ReactElement;
    onChange?: (movedItem: Item, fromContainer: 'left' | 'right', toContainer: 'left' | 'right', leftItems: Item[], rightItems: Item[]) => void;
}> = (props) => {
    const [leftItems, setLeftItems] = React.useState<Item[]>(props.leftItems);
    const [rightItems, setRightItems] = React.useState<Item[]>(props.rightItems);

    // Focus tracking
    const [focusedIndex, setFocusedIndex] = React.useState<number>(0);
    const [focusedContainer, setFocusedContainer] = React.useState<'left' | 'right'>('right');

    // drop handling when there is no item in the left container
    const [, drop] = useDrop({
        accept: 'ITEM',
        drop: (draggedItem: { containerId: 'left' | 'right'; index: number }) => {
            if (leftItems.length === 0) {
                // move the item in the left containers
                moveItem('right', 'left', draggedItem.index, 0);
            }
        },
    });

    // Move item function (between containers)
    const moveItem = (
        fromContainer: 'left' | 'right',
        toContainer: 'left' | 'right',
        fromIndex: number,
        toIndex: number
    ) => {
        if (fromContainer === 'left' && toContainer === 'right') {
            if (leftItems.length > 0) {
                const movedItem = leftItems[fromIndex];
                const newLeftItems = leftItems.filter((_, i) => i !== fromIndex);
                const newRightItems = [...rightItems.slice(0, toIndex + 1), movedItem, ...rightItems.slice(toIndex + 1)];

                setLeftItems(newLeftItems);
                setRightItems(newRightItems);

                props.onChange?.(movedItem, fromContainer, toContainer, newLeftItems, newRightItems);
            }
        } else {
            if (rightItems.length > 0) {
                const movedItem = rightItems[fromIndex];
                const newLeftItems = [...leftItems.slice(0, toIndex + 1), movedItem, ...leftItems.slice(toIndex + 1)];
                const newRightItems = rightItems.filter((_, i) => i !== fromIndex);

                setRightItems(newRightItems);
                setLeftItems(newLeftItems);

                props.onChange?.(movedItem, fromContainer, toContainer, newLeftItems, newRightItems);
            }
        }
    };

    // Move item within the same container
    const moveWithinContainer = (
        containerId: 'left' | 'right',
        fromIndex: number,
        toIndex: number
    ) => {
        let movedItem;
        let newLeftItems = leftItems, newRightItems = rightItems;

        if (containerId === 'left') {
            newLeftItems = [...leftItems];
            movedItem = newLeftItems.splice(fromIndex, 1)?.[0];
            newLeftItems.splice(toIndex, 0, movedItem);
            setLeftItems(newLeftItems);
            // } else if (containerId === 'right') {
        }
        else {
            newRightItems = [...rightItems];
            movedItem = newRightItems.splice(fromIndex, 1)?.[0];
            newRightItems.splice(toIndex, 0, movedItem);
            setRightItems(newRightItems);
        }

        props.onChange?.(movedItem, containerId, containerId, newLeftItems, newRightItems);
    };

    // Focus management
    const onFocusItem = (containerId: 'left' | 'right', index: number) => {
        setFocusedContainer(containerId);
        setFocusedIndex(index);
    };

    // Handle key events for movement
    const handleKeyDown = (event: React.KeyboardEvent | KeyboardEvent) => {
        if (focusedIndex === null || focusedContainer === null) return;

        let newFocusedIndex = focusedIndex;
        let newFocusedContainer = focusedContainer;

        // Arrow keys to move within the same container
        if (event.key === 'ArrowUp') {
            newFocusedIndex = Math.max(0, focusedIndex - 1);
        } else if (event.key === 'ArrowDown') {
            const items = focusedContainer === 'left' ? leftItems : rightItems;
            newFocusedIndex = Math.min(items.length - 1, focusedIndex + 1);
        }
        // Arrow keys to move items between containers
        else if (event.key === 'ArrowLeft' && focusedContainer === 'right') {
            newFocusedContainer = 'left';
            newFocusedIndex = Math.min(leftItems.length, focusedIndex);
        } else if (event.key === 'ArrowRight' && focusedContainer === 'left') {
            newFocusedContainer = 'right';
            newFocusedIndex = Math.min(rightItems.length, focusedIndex);
        }

        setFocusedContainer(newFocusedContainer);
        setFocusedIndex(newFocusedIndex);
    };

    const _defaultTemplate = (item: Item, index: number, containerId: 'left' | 'right', isFocused: boolean) =>
        props.template ? props.template(item, index, containerId, isFocused) : <>{item.name}</>;

    // // Attach keydown event listener
    // React.useEffect(() => {
    //     const handle = (event: KeyboardEvent) => {
    //         handleKeyDown(event);
    //     };

    //     document.addEventListener('keydown', handle);
    //     return () => {
    //         document.removeEventListener('keydown', handle);
    //     };
    // }, [focusedIndex, focusedContainer]);

    const disableButtons = leftItems.length === 0 && rightItems.length === 0;

    return <div className='multi-select-component' onKeyDown={handleKeyDown}>
        <div className='multi-select-container'>
            <div className='multi-select-column'>
                {props.leftContainerHeading && <h3>{props.leftContainerHeading}</h3>}
                <div ref={(node) => { drop(node) }} className="item-list multi-select-left-items">
                    {leftItems.length === 0 && <>{props.noLeftItemsMessage}</>}
                    {leftItems.map((item, index) => (
                        <ItemComponent
                            key={item.id}
                            item={item}
                            index={index}
                            containerId="left"
                            moveItem={moveItem}
                            moveWithinContainer={moveWithinContainer}
                            isFocused={focusedContainer === 'left' && focusedIndex === index}
                            onFocus={() => onFocusItem('left', index)}
                            template={_defaultTemplate}
                        />
                    ))}
                </div>
            </div>

            <div className="multi-select-center-buttons">
                {/* Buttons to move items */}
                <button disabled={disableButtons}
                    onClick={() => handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowUp' }))}>
                    <span className="arrows-imgs" title="Move the item upwards">↑</span>
                </button>
                <button disabled={disableButtons}
                    onClick={() => {
                        moveItem(focusedContainer === 'left' ? 'left' : 'right', focusedContainer === 'left' ? 'right' : 'left', focusedIndex, rightItems.length);
                    }}>
                    <span className="arrows-imgs" title="Toggle the item">⇆</span>
                </button>
                <button disabled={disableButtons}
                    onClick={() => handleKeyDown(new KeyboardEvent('keydown', { key: 'ArrowDown' }))}>
                    <span className="arrows-imgs" title="Move the item downwards">↓</span>
                </button>
            </div>

            <div className='multi-select-column'>
                {props.rightContainerHeading && <h3>{props.rightContainerHeading}</h3>}
                <div className="item-list multi-select-right-items">
                    {rightItems.length === 0 && <>{props.noRightItemsMessage}</>}
                    {rightItems.map((item, index) => (
                        <ItemComponent
                            key={item.id}
                            item={item}
                            index={index}
                            containerId="right"
                            moveItem={moveItem}
                            moveWithinContainer={moveWithinContainer}
                            isFocused={focusedContainer === 'right' && focusedIndex === index}
                            onFocus={() => onFocusItem('right', index)}
                            template={_defaultTemplate}
                        />
                    ))}
                </div>
            </div>
        </div>
    </div>;
};

export default MultiSelectDnD;