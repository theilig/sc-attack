import {useState} from "react";
import {attacks} from "./attacks";

export function createData(attackLevels) {
    const OPPONENT_LEVEL = 1.21 // level 3
    const OPPONENT_EFFICIENCY = .8
    return Object.keys(attacks).map(attack => {
        const attackData = attacks[attack]
        const level = parseInt(attackLevels[attack])
        const points = Math.round(attackData.points / 5 * Math.pow(1.1, (level - 1))) * 5
        const netNoOverkillPoints = Math.round(points - 100 * OPPONENT_LEVEL * OPPONENT_EFFICIENCY * attackData.damage)
        let overkillAmount = 1
        if (attack === 'Electric Deity') {
            overkillAmount = 5
        } else if (attack === 'Doomsday Quack') {
            overkillAmount = 20
        } else if (attack === 'Shield Buster') {
            overkillAmount = 0
        }
        let itemSum = 0
        Object.keys(attackData.ingredients).forEach(key => itemSum += attackData.ingredients[key])
        const netOverkillPoints = Math.round(points - 100 * OPPONENT_LEVEL * OPPONENT_EFFICIENCY * overkillAmount)
        let overkillWeight = netOverkillPoints / (netOverkillPoints + netNoOverkillPoints) * (attackData.damage - overkillAmount) / 16
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
                ingredients: attackData.ingredients,
                netNoOverkillPoints: netNoOverkillPoints,
                netOverkillPoints: netOverkillPoints,
                blendedNet: blended,
                netPerItem: Math.round(blended / itemSum),
                netPerEnergy: Math.round(blended / attackData.energy),
                rawPerItem: Math.round(points / itemSum),
                rawPerEnergy: Math.round(points / attackData.energy)
            }
        } else {
            return {
                attack: attack
            }
        }
    })
}

function AttackTable(props) {
    const [sortField, setSortField] = useState('attack')
    let visualData = createData(props.player)

    visualData.sort((a, b) => {
        const aValue = a[sortField]
        const bValue = b[sortField]
        if (!isNaN(parseFloat(aValue))) {
            if (!isNaN(parseFloat(bValue))) {
                return bValue - aValue
            } else {
                return -1
            }
        } else if (!isNaN(parseFloat(bValue))) {
            return 1
        } else if (aValue < bValue) {
            return -1
        } else {
            return 1
        }
    })
    return <table>
        <thead>
            <tr>
                <th onClick={() => setSortField('attack')} />
                <th onClick={() => setSortField('level')} />
                <th onClick={() => setSortField('points')} />
                <th onClick={() => setSortField('netNoOverkillPoints')}>Net Points</th>
                <th onClick={() => setSortField('netOverkillPoints')}>Net Points</th>
                <th onClick={() => setSortField('blendedNet')}>Net Points</th>
                <th onClick={() => setSortField('netPerItem')}>Net Points</th>
                <th onClick={() => setSortField('netPerEnergy')}>Net Points</th>
                <th onClick={() => setSortField('rawPerItem')}>Raw Points</th>
                <th onClick={() => setSortField('rawPerEnergy')}>Raw Points</th>
            </tr>
            <tr>
                <th onClick={() => setSortField('attack')}>Attack</th>
                <th onClick={() => setSortField('level')}>Level</th>
                <th onClick={() => setSortField('points')}>Points</th>
                <th onClick={() => setSortField('netNoOverkillPoints')}>(no overkill)</th>
                <th onClick={() => setSortField('netOverkillPoints')}>(max overkill)</th>
                <th onClick={() => setSortField('blendedNet')}>(blended)</th>
                <th onClick={() => setSortField('netPerItem')}>Per Item</th>
                <th onClick={() => setSortField('netPerEnergy')}>Per Energy</th>
                <th onClick={() => setSortField('rawPerItem')}>Per Item</th>
                <th onClick={() => setSortField('rawPerEnergy')}>Per Energy</th>
            </tr>
        </thead>
        <tbody>
        {visualData.map(row => {
            if (row.level > 0) {
                return <tr key={row.attack} onClick={() => props.update(row.attack, false)} onContextMenu={() => props.update(row.attack, true)}>
                    <td>{row.attack}</td>
                    <td>{row.level}</td>
                    <td>{row.points}</td>
                    <td>{row.netNoOverkillPoints}</td>
                    <td>{row.netOverkillPoints}</td>
                    <td>{row.blendedNet}</td>
                    <td>{row.netPerItem}</td>
                    <td>{row.netPerEnergy}</td>
                    <td>{row.rawPerItem}</td>
                    <td>{row.rawPerEnergy}</td>
                </tr>
            } else {
                return <tr key={row.attack}>
                    <td>{row.attack}</td>
                </tr>
            }
        })}
        </tbody>
    </table>
}
export default AttackTable;
