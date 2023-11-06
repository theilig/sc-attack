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
                if (data.ingredients) {
                    Object.keys(data.ingredients).forEach(ingredient => {
                        localItems[ingredient] = (localItems[ingredient] || 0) - data.ingredients[ingredient] * (currentGuarantees[i] || 0)
                        if (localItems[ingredient] < data.ingredients[ingredient]) {
                            canUpdate = false
                        }
                    })
                } else {
                    canUpdate = false
                }
                if (canUpdate) {
                    indexToUpdate = i
                }
            }
            return indexToUpdate
        }
        const currentGuaranteeUpdated = guaranteeToIncrement(currentItemCounts, currentGuarantees)

        if (currentGuaranteeUpdated === undefined) {
            return
        }
        currentGuarantees[currentGuaranteeUpdated] = (currentEvaluated[currentGuaranteeUpdated] || 0) + 1

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
        currentEvaluated.forEach((value, index) => {
            if (value > 0) {
                netTotal += value * attacksData[index].blendedNet
                rawTotal += value * attacksData[index].points
                text.push(attacksData[index].attack + ': ' + value)
            }
        })
        if (currentBest.netTotal === undefined || netTotal > currentBest.netTotal.netValue) {
            currentBest.netTotal = {netValue: netTotal, attackSet: currentEvaluated, text: text.join(', '), rawValue: rawTotal}
        }
        if (currentBest.rawTotal === undefined || rawTotal > currentBest.rawTotal.rawValue) {
            currentBest.rawTotal = {netValue: netTotal, attackSet: currentEvaluated, text: text.join(', '), rawValue: rawTotal}
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

        return {
            currentBest
        }
    }
    return {
        findBest,
        startOver
    }
}
