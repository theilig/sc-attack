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
    const [updatedMembers, setUpdatedMembers] = useState(members)
    const [evaluated, setEvaluated] = useState(0)
    const [maxNeeded, setMaxNeeded] = useState({})
    const {
        findBest,
        startOver
    } = useCalculator()
    const updateItemCounts = (counts) => {
        setItemCounts(counts)
        setBest({})
        startOver()
    }
    const updateMembers = (name, attack, rightClicked) => {
        let newPlayer = {...updatedMembers[name]}
        if (rightClicked && newPlayer[attack] && newPlayer[attack] > 0) {
            newPlayer[attack] -= 1
        } else if (rightClicked) {
            newPlayer[attack] = null
        } else {
            newPlayer[attack] = (newPlayer[attack] || 0) + 1
        }
        let newMembers = {...updatedMembers}
        newMembers[name] = newPlayer
        setUpdatedMembers(newMembers)
    }
    options.sort()
    useEffect(() => {
        const interval = setInterval(() => {
            const attackData = createData(updatedMembers[current])
            const result = findBest(attackData, itemCounts)
            setBest(result.currentBest)
            const newEvaluated = Math.floor(result.evaluatedCount * 10000 / result.evaluatedTotal) / 100
            if (newEvaluated !== evaluated) {
                setEvaluated(newEvaluated)
            }
            let neededNet = []
            let neededRaw = []
            attackData.forEach((attack, index) => {
                if (result.currentBest && result.currentBest.netTotal) {
                    if (result.currentBest.netTotal.attackSet[index] > 0) {
                        Object.keys(attack.ingredients).forEach(ingredient => {
                            neededNet[ingredient] = (neededNet[ingredient] || 0) + attack.ingredients[ingredient] * result.currentBest.netTotal.attackSet[index]
                        })
                    }
                }
                if (result.currentBest && result.currentBest.rawTotal) {
                    if (result.currentBest.rawTotal.attackSet[index] > 0) {
                        Object.keys(attack.ingredients).forEach(ingredient => {
                            neededRaw[ingredient] = (neededRaw[ingredient] || 0) + attack.ingredients[ingredient] * result.currentBest.rawTotal.attackSet[index]
                        })
                    }
                }
            })
            Object.keys(neededRaw).forEach((key) => {
                neededNet[key] = Math.max(neededNet[key] || 0, neededRaw[key])
            })
            setMaxNeeded(neededNet)
        }, 100)
        return () => clearInterval(interval)
    }, [current, findBest, itemCounts, updatedMembers, evaluated])
    return (
        <div className="App" style={{color: 'white', backgroundColor: 'lightsteelblue'}}>
            Team Watermelon War Attacks
            <Dropdown options={options} value={current} placeholder="Select member" onChange={(e) => {
                setCurrent(e.value)
                startOver()
            }}/>
            <ItemsTable updateCounts={(counts) => {updateItemCounts(counts)}} maxNeeded={maxNeeded}/>
            <div style={{marginTop: '10px'}}>Close Match:</div>
            <div>{best && best.netTotal && (best.netTotal.rawValue + ' points (net ' + best.netTotal.netValue + ')')}</div>
            <div style={{display: "flex"}}>
            {best && best.netTotal && best.netTotal.text && best.netTotal.text.map(entry => {
                return <div style={{marginLeft: "10px"}}><div>{entry.attack}</div><div style={{marginLeft: "5px"}}>{entry.value}</div></div>
            })}
            </div>
            <div style={{marginTop: '10px'}}>Max Points:</div>
            <div>{best && best.rawTotal && (best.rawTotal.rawValue + ' points (net ' + best.rawTotal.netValue + ')')}</div>
            <div style={{display: "flex"}}>
                {best && best.rawTotal && best.rawTotal.text && best.rawTotal.text.map(entry => {
                    return <div style={{marginLeft: "10px"}}><div>{entry.attack}</div><div style={{marginLeft: "5px"}}>{entry.value}</div></div>
                })}
            </div>
            <div style={{marginTop: "10px"}}>Evaluated {evaluated} % of combinations</div>
            <div style={{marginTop: "50px"}} />
            <AttackTable player={updatedMembers[current]} update={(attack, rightClicked) => updateMembers(current, attack, rightClicked)}/>
        </div>
    )
}
export default App;
