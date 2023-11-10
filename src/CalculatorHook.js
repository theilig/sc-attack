import {useState} from "react";

export function useCalculator() {
    const [bestSoFar, setBestSoFar] = useState({})
    const [lastEvaluated, setLastEvaluated] = useState()
    const [depth, setDepth] = useState(1)

    const maxAvailable = (attackData, itemCounts) => {
        if (attackData.level && attackData.level > 0) {
            let possibleCount
            Object.keys(attackData.ingredients).forEach(ingredient => {
                const canDo = Math.floor((itemCounts[ingredient] || 0) / attackData.ingredients[ingredient])
                if (possibleCount === undefined || possibleCount > canDo) {
                    possibleCount = Math.max(canDo, 0)
                }
            })
            return possibleCount
        }
        return 0
    }

    const startOver = () => {
        setLastEvaluated(undefined)
        setBestSoFar({})
        setDepth(1)
    }

    const evaluate = (attackCounts, currentBest, attacksData) => {
        let netTotal = 0
        let rawTotal = 0
        let text = []
        let lowestNet = {}
        let lowestRaw = {}
        attackCounts.forEach((value, index) => {
            if (value > 0) {
                const data = attacksData[index]
                netTotal += value * data.blendedNet
                rawTotal += value * data.points
                Object.keys(data.ingredients).forEach(ingredient => {
                    if (lowestNet[ingredient] === undefined || lowestNet[ingredient] > attacksData[index].netPerItem) {
                        lowestNet[ingredient] = attacksData[index].netPerItem
                    }
                    if (lowestRaw[ingredient] === undefined || lowestRaw[ingredient] > attacksData[index].rawPerItem) {
                        lowestRaw[ingredient] = attacksData[index].rawPerItem
                    }
                })
                text.push({attack: attacksData[index].attack, value: value})
            }
        })
        if (currentBest.netTotal === undefined || netTotal > currentBest.netTotal.netValue) {
            currentBest.netTotal = {netValue: netTotal, attackSet: attackCounts, text: text, rawValue: rawTotal}
        }
        if (currentBest.rawTotal === undefined || rawTotal > currentBest.rawTotal.rawValue) {
            currentBest.rawTotal = {netValue: netTotal, attackSet: attackCounts, text: text, rawValue: rawTotal}
        }
    }

    const findBest = (attacksData, itemCounts) => {
        let possibleCounts = []
        const removeItems = (items, attackData, count) => {
            if (attackData.ingredients) {
                Object.keys(attackData.ingredients).forEach(ingredient => {
                    items[ingredient] -= attackData.ingredients[ingredient] * count
                })
            }
        }
        const getAllCombos = (attacks, counts, index, whereWeLeftOff, localDepth) => {
            let allCombos = []
            if (index >= attacks.length) {
                return [""]
            }
            let localLeftOff;
            let alreadySeen = []
            let startingPoint = maxAvailable(attacks[index], counts)
            if (whereWeLeftOff) {
                let leftOffIndex = whereWeLeftOff.split(":")
                startingPoint = parseInt(leftOffIndex[0])
                leftOffIndex.splice(0, 1)
                localLeftOff = leftOffIndex.join(":")
                alreadySeen[localLeftOff] = true
            }
            let endingIndex = 0
            if (localDepth <= 0) {
                endingIndex = startingPoint
            }
            for (let i = startingPoint; i >= endingIndex && allCombos.length < 1000; i -= 1) {
                let localCounts = {...counts}
                removeItems(localCounts, attacks[index], i)
                getAllCombos(attacks, localCounts, index + 1, localLeftOff, localDepth - 1).forEach(possible => {
                    if (alreadySeen[possible] === undefined) {
                        alreadySeen[possible] = true
                        allCombos.push("" + i + ":" + possible)
                    }
                })
                localLeftOff = undefined
            }
            return allCombos
        }

        // Sorting just to make sure keys are always in the same order, they shouldn't change but just making sure
        attacksData.sort((a, b) => {
            if (a.blendedNet && b.blendedNet) {
                return b.blendedNet - a.blendedNet
            } else if (a.blendedNet) {
                return -1
            } else {
                return 1
            }
        })
        attacksData.forEach((attack, index) => {
            possibleCounts[index] = maxAvailable(attack, itemCounts)
        })
        const possibleCombos = getAllCombos(attacksData, {...itemCounts}, 0, lastEvaluated, depth)
        let currentBest = {...bestSoFar}
        possibleCombos.forEach(combo => {
            const attackCounts = combo.split(":")
            evaluate(attackCounts, currentBest, attacksData)
        })
        setBestSoFar(currentBest)
        if (possibleCombos.length > 0) {
            setLastEvaluated(possibleCombos[possibleCombos.length - 1])
        }
        if (possibleCombos.length === 0 && depth < 10) {
            let newDepth = depth + 1
            while (newDepth < possibleCounts.length && possibleCounts[newDepth] === 0) {
                newDepth += 1
            }
            setDepth(newDepth)
            setLastEvaluated(undefined)
        }

        let evaluatedTotal = 10
        let evaluatedCount = depth
        return {
            currentBest,
            evaluatedCount,
            evaluatedTotal
        }
    }
    return {
        findBest,
        startOver
    }
}
