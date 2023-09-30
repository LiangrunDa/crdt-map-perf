const Automerge= require('@automerge/automerge')
const fs = require('fs')
const changes = []

const docBuf = fs.readFileSync("./draw.doc.crdt")
const uint8Array = new Uint8Array(docBuf)
const doc = Automerge.load(uint8Array)
Automerge.getAllChanges(doc).forEach((c, index) => {
    let change = Automerge.decodeChange(c)
    changes.push(JSON.stringify(change))
})

fs.writeFile("./draw.json", changes.join('\n'), (err) => {
    if(err) {
        console.log(err)
    }
})

fs.writeFile("./final.json", JSON.stringify(doc), (err) => {
    if(err) {
        console.log(err)
    }
})