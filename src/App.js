import './App.css';
import Dropdown from 'react-dropdown';
import {members} from './members'
import {useEffect, useState} from "react";
import AttackTable, {createData} from "./AttackTable";
import ItemsTable from "./ItemsTable";
import {useCalculator} from "./CalculatorHook";

document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
});

function App() {
    let options = Object.keys(members)
    const [current, setCurrent] = useState(options[0])
    const [itemCounts, setItemCounts] = useState({})
    const [best, setBest] = useState({})
    const {
        findBest,
        startOver
    } = useCalculator()
    const updateItemCounts = (counts) => {
        setItemCounts(counts)
        setBest({})
        startOver()
    }
    options.sort()
    useEffect(() => {
        const interval = setInterval(() => {
            const attackData = createData(members[current])
            const result = findBest(attackData, itemCounts)
            setBest(result.currentBest)
        }, 100)
        return () => clearInterval(interval)
    }, [current, findBest, itemCounts])
    return (
        <div className="App">
            Team Watermelon War Attacks
            <Dropdown options={options} value={current} placeholder="Select member" onChange={(e) => setCurrent(e.value)}/>
            <AttackTable player={members[current]}/>
            <ItemsTable updateCounts={(counts) => {updateItemCounts(counts)}}/>
            <div>{best && best.netTotal && (best.netTotal.rawValue + ' (' + best.netTotal.netValue + '):' + best.netTotal.text)}</div>
            <div>{best && best.rawTotal && (best.rawTotal.rawValue + ' (' + best.rawTotal.netValue + '):' + best.rawTotal.text)}</div>
        </div>
    )
}
export default App;
