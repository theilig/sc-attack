import './App.css';
import Dropdown from 'react-dropdown';
import {members} from './members'
import {useState} from "react";
import {attacks} from "./attacks";
import AttackTable from "./AttackTable";

function App() {
    let options = Object.keys(members)
    const OPPONENT_LEVEL = 1.21 // level 3
    const OPPONENT_EFFICIENCY = .8
    const [current, setCurrent] = useState(options[0])
    options.sort()
    const data = Object.keys(attacks).map(attack => {
        const data = attacks[attack]
        const level = parseInt(members[current][attack])
        const points = Math.round(data.points / 5 * Math.pow(1.1, (level - 1))) * 5
        const netNoOverkillPoints = Math.round(points - 100 * OPPONENT_LEVEL * OPPONENT_EFFICIENCY * data.damage)
        let overkillAmount = 1
        if (attack === 'Electric Deity') {
            overkillAmount = 5
        } else if (attack === 'Doomsday Quack') {
            overkillAmount = 20
        } else if (attack === 'Shield Buster') {
            overkillAmount = 0
        }
        let itemSum = 0
        Object.keys(data.ingredients).forEach(key => itemSum += data.ingredients[key])
        const netOverkillPoints = Math.round(points - 100 * OPPONENT_LEVEL * OPPONENT_EFFICIENCY * overkillAmount)
        let overkillWeight = netOverkillPoints / (netOverkillPoints + netNoOverkillPoints) * (data.damage - overkillAmount) / 16
        if (attack === 'Shield Buster') {
            overkillWeight = netNoOverkillPoints / (netOverkillPoints + netNoOverkillPoints) * 6 / 16
        } else if (attack === 'Electric Deity') {
            overkillWeight = .02
        }
        const blended = Math.round(netNoOverkillPoints * (1 - overkillWeight) + netOverkillPoints * overkillWeight)
        if (level > 0) {
            return {
                attack: attack,
                level: level,
                points: points,
                netNoOverkillPoints: netNoOverkillPoints,
                netOverkillPoints: netOverkillPoints,
                blendedNet: blended,
                netPerItem: Math.round(blended / itemSum),
                netPerEnergy: Math.round(blended / data.energy),
                rawPerItem: Math.round(points / itemSum),
                rawPerEnergy: Math.round(points / data.energy)
            }
        } else {
            return {
                attack: attack
            }
        }
    })
    return (
        <div className="App">
            Team Watermelon War Attacks
            <Dropdown options={options} value={current} placeholder="Select member" onChange={(e) => setCurrent(e.value)}/>
            <AttackTable data={data}/>
        </div>
    )
}
export default App;
