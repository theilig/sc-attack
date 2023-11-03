import {useState} from "react";

function AttackTable(props) {
    const [sortField, setSortField] = useState('attack')

    let visualData = [...props.data]
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
                return <tr>
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
                return <tr>
                    <td>{row.attack}</td>
                </tr>
            }
        })}
        </tbody>
    </table>
}
export default AttackTable;
