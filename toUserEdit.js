const fs = require('fs')

// fow now, it only supports append, not update or delete (because in tldraw, we don't update or delete elements in a list)
// but it can be extended to support update and delete, by simulating the RGATree in Automerge
class RGATree {
    constructor() {
        this.data = ['_head']
    }

    insert(predId, op){
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] === predId) {
                for (let j = i + 1; j < this.data.length; j++) {
                    if (this.data[j] < op) {
                        this.data.splice(j, 0, op)
                        return
                    }
                }
                this.data.push(op)
                return
            }
        }
    }

    getIndex(id) {
        return this.data.indexOf(id) - 1
    }
}

const userEdits = []
const objIdToKey = {"_root": "root"}

const RGATrees = {} // assume we don't remove element from the lists

const changes = fs.readFileSync("./draw.json", 'utf8').split('\n')

// first run: build the RGATrees and objIdToKey
changes.forEach((c, index) => {
    const change = JSON.parse(c)
    let id = change.startOp
    change.ops.forEach((op, index) => {
        const opId = id + "@" + change.actor
        if(op.action === "makeMap" || op.action === "makeList") {
            const parent = objIdToKey[op.obj]

            if (RGATrees[parent]) { // list in a list, or map in a list
                RGATrees[parent].insert(op.elemId, opId)
                const key = parent + "[" + RGATrees[parent].getIndex(opId) + "]"
                objIdToKey[opId] = key
            } else {
                const key = parent + "[\"" + op.key + "\"]"
                objIdToKey[opId] = key
            }

            if (op.action === "makeList") {
                const key = parent + "[\"" + op.key + "\"]"
                RGATrees[key] = new RGATree()
            }
        }
        id++
    })
})

// second run: output the user edits
changes.forEach((c, index) => {
    const change = JSON.parse(c)
    const edits = []
    let id = change.startOp
    change.ops.forEach((op, index) => {
        const opId = id + "@" + change.actor
        if(op.action === "set") {
            edits.push({
                type: "upsert",
                key: op.key && objIdToKey[op.obj] + "[\"" + op.key + "\"]" || objIdToKey[op.obj],
                value: op.value
            })
        } else if(op.action === "makeMap") {
            edits.push({
                type: "upsert",
                key:  objIdToKey[opId],
                value: {}
            })
        } else if(op.action === "makeList") {
            edits.push({
                type: "upsert",
                key: objIdToKey[opId],
                value: []
            })
        } else if(op.action === "del") {
            edits.push({
                type: "delete",
                key: op.key && objIdToKey[op.obj] + "[\"" + op.key + "\"]" || objIdToKey[op.obj],
            })
        }
        id++

    })
    userEdits.push(edits)
})

fs.writeFile("./userEdits.json", JSON.stringify(userEdits, null, 2), (err) => {
    if(err) {
        console.log(err)
    }
})