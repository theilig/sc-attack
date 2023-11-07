import {useState} from "react";

export function useCalculator() {
    const [bestSoFar, setBestSoFar] = useState({})
    const [lastEvaluated, setLastEvaluated] = useState([])
    const [guarantees, setGuarantees] = useState([])

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
        setLastEvaluated([])
        setBestSoFar({})
        setGuarantees([])
    }

    const innerLoop = (possibleCounts, currentItemCounts, currentGuarantees, currentEvaluated, currentBest, attacksData) => {
        const guaranteeToIncrement = () => {
            let localItems = {...currentItemCounts}
            let indexToUpdate;
            for (let i = attacksData.length - 1; i >= 0; i -= 1) {
                let canUpdate = true;
                const data = attacksData[i]
                let netCost = 0
                let rawCost = 0
                if (data.ingredients) {
                    Object.keys(data.ingredients).forEach(ingredient => {
                        localItems[ingredient] = (localItems[ingredient] || 0) - data.ingredients[ingredient] * (currentGuarantees[i] || 0)
                        if (localItems[ingredient] < data.ingredients[ingredient]) {
                            canUpdate = false
                        }
                        if (currentBest.netTotal) {
                            netCost += Math.max(0, data.ingredients[ingredient] - (currentBest.netTotal.remaining[ingredient] || 0)) * (currentBest.netTotal.cost[ingredient] || 0)
                        }
                        if (currentBest.rawTotal) {
                            rawCost += Math.max(0, data.ingredients[ingredient] - (currentBest.rawTotal.remaining[ingredient] || 0)) * (currentBest.rawTotal.cost[ingredient] || 0)
                        }
                    })
                    netCost -= data.blendedNet
                    rawCost -= data.points
                } else {
                    canUpdate = false
                }

                if (canUpdate && (netCost < 0 || rawCost < 0)) {
                    indexToUpdate = i
                }
            }
            return indexToUpdate
        }
        const currentGuaranteeUpdated = guaranteeToIncrement(currentItemCounts, currentGuarantees)

        if (currentGuaranteeUpdated === undefined) {
            return
        }
        currentGuarantees[currentGuaranteeUpdated] = (currentGuarantees[currentGuaranteeUpdated] || 0) + 1
        if (currentBest.netTotal && currentBest.netTotal.attackSet[currentGuaranteeUpdated] > currentGuarantees[currentGuaranteeUpdated]) {
            currentGuarantees[currentGuaranteeUpdated] = currentBest.netTotal.attackSet[currentGuaranteeUpdated]
        }

        if (currentBest.rawTotal && currentBest.rawTotal.attackSet[currentGuaranteeUpdated] > currentGuarantees[currentGuaranteeUpdated]) {
            currentGuarantees[currentGuaranteeUpdated] = currentBest.rawTotal.attackSet[currentGuaranteeUpdated]
        }

        for (let i = 0; i < currentGuaranteeUpdated; i += 1) {
            // reset the lower indexes to start over with this new guarantee
            currentGuarantees[i] = 0
        }

        attacksData.forEach((data, index) => {
            if (currentGuarantees[index]) {
                Object.keys(data.ingredients).forEach(ingredient => {
                    currentItemCounts[ingredient] -= data.ingredients[ingredient] * currentGuarantees[index]
                })
            }
        })

        for (let i = 0; i < attacksData.length; i += 1) {
            currentEvaluated[i] = currentGuarantees[i] || 0
        }

        attacksData.forEach((data, index) => {
            const canDo = maxAvailable(data, currentItemCounts)
            if (canDo > currentEvaluated[index]) {
                const extra = canDo - currentEvaluated[index]
                currentEvaluated[index] = canDo
                // Guarantees protect against earlier indexes locking them out, but once we've done
                // the guarantee we can let the earlier indexes go wild.  We can't do this with the
                // later indexes though because it might incorrectly cause us to skip some permutations
                if (index < currentGuaranteeUpdated) {
                    currentGuarantees[index] = canDo
                }
                Object.keys(data.ingredients).forEach(ingredient => {
                    currentItemCounts[ingredient] -= data.ingredients[ingredient] * extra
                })
            }
        })

        let netTotal = 0
        let rawTotal = 0
        let text = []
        let lowestNet = {}
        let lowestRaw = {}
        currentEvaluated.forEach((value, index) => {
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
            currentBest.netTotal = {netValue: netTotal, attackSet: currentEvaluated, text: text, rawValue: rawTotal, remaining: {...currentItemCounts}, cost: lowestNet}
        }
        if (currentBest.rawTotal === undefined || rawTotal > currentBest.rawTotal.rawValue) {
            currentBest.rawTotal = {netValue: netTotal, attackSet: currentEvaluated, text: text, rawValue: rawTotal, remaining: {...currentItemCounts}, cost: lowestRaw}
        }
    }

    const findBest = (attacksData, itemCounts) => {
        let possibleCounts = []
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

        let currentGuarantees = [...guarantees]
        let currentEvaluated = [...lastEvaluated]
        let currentBest = {...bestSoFar}
        let currentItemCounts = {...itemCounts}

        let deadline = Date.now() + 100

        while (Date.now() < deadline) {
            innerLoop(possibleCounts, currentItemCounts, currentGuarantees, currentEvaluated, currentBest, attacksData)
        }

        setLastEvaluated(currentEvaluated)
        setGuarantees(currentGuarantees)
        setBestSoFar(currentBest)

        let evaluatedTotal = 1
        let evaluatedCount = 1
        let evaluatedIndex = 0
        currentGuarantees.forEach((value, index) => {
            if (value > 0) {
                evaluatedIndex = index
            }
        })
        possibleCounts.forEach((value, index) => {
            const possibleCount = (value || 0)
            evaluatedTotal *= possibleCount + 1
            if (index < evaluatedIndex) {
                evaluatedCount *= possibleCount + 1
            } else if (index === evaluatedIndex) {
                evaluatedCount *= (currentGuarantees[index] || 0) + 1
            }
        })
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
