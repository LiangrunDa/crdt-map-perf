// Apply the paper editing trace to an Automerge.Text object, one char at a time
const Y = require('yjs')
const fs = require('fs')
const deepEqual = require('./common.js').areDeeplyEqual

const edits = JSON.parse(fs.readFileSync("./userEdits.json", 'utf8'))
const final = fs.readFileSync("./final.json", 'utf8')

const start = new Date()
const ydoc = new Y.Doc()
const root = ydoc.getMap('root')
let opCnt = 0

for (let i = 0; i < edits.length; i++) {
    ydoc.transact(() => {
        edits[i].forEach(op => {
            opCnt++
            if (opCnt % 1000 === 0) console.log(`Processed ${opCnt} edits in ${new Date() - start} ms`)
            if (op.type === "upsert") {
                let path = op.key.substring(5, op.key.length - 1).split('][')
                let currentObj = root
                for (let i = 0; i < path.length; i++) {
                    let key = path[i]
                    if (key.startsWith('\"') && key.endsWith('\"')) {
                        key = key.substring(1, key.length - 1)
                    } else {
                        key = parseInt(key)
                    }
                    if (i === path.length - 1) {
                        if (Array.isArray(op.value)) {
                            if (typeof key === 'number') {
                                if (currentObj._length > key) {
                                    currentObj.delete(key)
                                }
                                currentObj.insert(key, [new Y.Array()])
                            } else {
                                currentObj.set(key, new Y.Array())
                            }
                        } else if (typeof op.value === 'object') {
                            if (typeof key === 'number') {
                                if (currentObj._length > key) {
                                    currentObj.delete(key)
                                }
                                currentObj.insert(key, [new Y.Map()])
                            } else {
                                currentObj.set(key, new Y.Map())
                            }
                        } else {
                            if (typeof key === 'number') {
                                if (currentObj._length > key) {
                                    currentObj.delete(key)
                                }
                                currentObj.insert(key, op.value)
                            } else {
                                currentObj.set(key, op.value)
                            }
                        }
                    } else {
                        currentObj = currentObj.get(key)
                    }
                }
            } else if (op.type === "delete") {
                let path = op.key.substring(5, op.key.length - 1).split('][')
                let currentObj = root
                for (let i = 0; i < path.length; i++) {
                    let key = path[i]
                    if (key.startsWith('\"') && key.endsWith('\"')) {
                        key = key.substring(1, key.length - 1)
                    } else {
                        key = parseInt(key)
                    }
                    if (i === path.length - 1) {
                        currentObj.delete(key)
                    } else {
                        currentObj = currentObj.get(key)
                    }
                }
            }

        })
    })
}

if (!deepEqual(root.toJSON(), JSON.parse(final))) {
    throw new RangeError('ERROR: final result did not match expectation')
}
