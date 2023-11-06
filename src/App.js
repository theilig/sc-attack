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
        <div className="App" style={{color: 'white', backgroundColor: 'lightsteelblue'}}>
            Team Watermelon War Attacks
            <Dropdown options={options} value={current} placeholder="Select member" onChange={(e) => {
                setCurrent(e.value)
                startOver()
            }}/>
            <ItemsTable updateCounts={(counts) => {updateItemCounts(counts)}}/>
            <div style={{marginTop: '10px'}}>Close Match:</div>
            <div>{best && best.netTotal && (best.netTotal.rawValue + ' points (net ' + best.netTotal.netValue + ')')}</div>
            <div style={{display: "flex"}}>
            {best && best.netTotal && best.netTotal.text && best.netTotal.text.map(entry => {
                return <div style={{marginLeft: "10px"}}>{entry}</div>
            })}
            </div>
            <div style={{marginTop: '10px'}}>Max Points:</div>
            <div>{best && best.rawTotal && (best.rawTotal.rawValue + ' points (net ' + best.rawTotal.netValue + ')')}</div>
            <div style={{display: "flex"}}>
                {best && best.rawTotal && best.rawTotal.text && best.rawTotal.text.map(entry => {
                    return <div style={{marginLeft: "10px"}}>{entry}</div>
                })}
            </div>
            <div style={{marginTop: "50px"}} />
            <AttackTable player={members[current]}/>
        </div>
    )
}
export default App;
