// Apply the paper editing trace to an Automerge.Text object, one char at a time
const Automerge= require('@automerge/automerge')
const fs = require('fs')
const deepEqual = require('./common.js').areDeeplyEqual

const edits = JSON.parse(fs.readFileSync("./userEdits.json", 'utf8'))
const final = fs.readFileSync("./final.json", 'utf8')

const start = new Date()
let doc = Automerge.init()
let opCnt = 0

for (let i = 0; i < edits.length; i++) {
    doc = Automerge.change(doc, root => {
        edits[i].forEach(op => {
            opCnt++
            if (opCnt % 1000 === 0) console.log(`Processed ${opCnt} edits in ${new Date() - start} ms`)
            if (op.type === "upsert") {
                let operation = `${op.key} = `
                if (typeof op.value === 'string') {
                    operation += `\"${op.value}\"`;
                } else if (Array.isArray(op.value)) {
                    operation += `[]`
                } else if (typeof op.value === 'object') {
                    operation += `{}`
                } else {
                    operation += `${op.value}`
                }
                eval(operation)
            } else if (op.type === "delete") {
                eval(`delete ${op.key}`)
            }
        })
    })
}

if (!deepEqual(doc, JSON.parse(final))) {
    throw new RangeError('ERROR: final result did not match expectation')
}
