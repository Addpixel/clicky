'use strict'

let fs = require('fs')
let WebSocketServer = require('ws').Server

const countFilename = '/var/www/virtual/addpixel/clicky.addpixel.net/count'

let wss = new WebSocketServer({ port: 63327 })
let count = (() => {
  const fileValue = parseInt(fs.readFileSync(countFilename), 10)
  return fileValue === NaN ? 0 : fileValue
}())
let isWritingToFile = false
let fileIsUpToDate = true

console.log('count at: ' + count)

var saveCount = () => {
  isWritingToFile = true
  fileIsUpToDate = true
  
  fs.writeFile(countFilename, count.toString(), (error) => {
    isWritingToFile = false
    
    if (!fileIsUpToDate) { saveCount() }
    
    if (error) { throw error }
  })
}

wss.on('connection', ws => {
  console.log('connected, client count now: ' + wss.clients.length)
  
  ws.on('message', message => {
    if (message === 'tap!') {
      count += 1
      
      // Write to File
      fileIsUpToDate = false
      
      if (!isWritingToFile) {
        saveCount()
      }
      
      // Send New Count to Other Clients
      wss.clients.filter(x => x !== ws).forEach(x => x.send(count.toString()))
      
      console.log('increment, now: ' + count)
    } else if (message === 'count?') {
      ws.send(count.toString())
    }
  })
  
  ws.on('close', () => {
    console.log('disconnected, client count now: ' + wss.clients.length)
  })
})