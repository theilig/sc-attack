import {useCallback, useState} from "react";
import {attacks} from "./attacks";

function ItemsTable(props) {
    const [adjustments, setAdjustments] = useState({})
    const updateCallback = props.updateCounts
    function goodWasClicked(goodName, rightButton) {
        if (rightButton) {
            updateCount(goodName,-1)
        } else {
            updateCount(goodName,1)
        }
    }

    const updateCount = useCallback((goodName, delta) => {
        let newList = {...adjustments};
        const total = (adjustments[goodName] || 0) + delta
        if (total > 0) {
            newList[goodName] = total
        } else {
            delete newList[goodName]
        }
        setAdjustments(newList)
        updateCallback(newList)
    }, [adjustments, updateCallback])

    let items = []
    Object.values(attacks).forEach(attack => {
        Object.keys(attack.ingredients).forEach(item => {
            if (!items.includes(item)) {
                items.push(item)
            }
        })
    })
    items.sort()

    return <div style={{display: 'flex'}}>
        {items.map(item => {
            const count = adjustments[item] || 0
            const extra = count - (props.maxNeeded[item] || 0)
            return <div key={item} style={{marginRight: '5px'}} onClick={() => goodWasClicked(item, false)} onContextMenu={() => goodWasClicked(item, true)}>{item} {count} ({extra})</div>
        })}
    </div>

}
export default ItemsTable;
