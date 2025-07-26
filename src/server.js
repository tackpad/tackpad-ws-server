#!/usr/bin/env node
import { App } from 'uWebSockets.js'
import * as number from 'lib0/number'
import { setupWSConnection } from './utils.js'

const host = process.env.HOST || 'localhost'
const port = number.parseInt(process.env.PORT || '1234')

const app = App({
  compression: 1,
  maxCompressedSize: 64 * 1024,
  maxBackpressure: 64 * 1024
})

// HTTP route for health check
app.get('/*', (res, req) => {
  res.writeStatus('200 OK')
    .writeHeader('Content-Type', 'text/plain')
    .end('okay')
})

// WebSocket route - handle any path as document name
app.ws('/*', {
  compression: 1,
  maxCompressedSize: 64 * 1024,
  maxBackpressure: 64 * 1024,

  message: (ws, message, opCode) => {
    if (!ws.doc) return
    // uWebSockets.js gives us ArrayBuffer, but YJS expects Uint8Array
    const uint8Message = new Uint8Array(message)
    ws.doc.messageListener(ws, uint8Message)
  },

  open: (ws) => {
    // Get document name from userData that was set during upgrade
    const docName = ws.getUserData().docName || 'default'
    console.log(`WebSocket opened for document: ${docName}`)
    setupWSConnection(ws, { url: `/${docName}` }, { docName, gc: true })
  },

  close: (ws, code, message) => {
    if (ws.doc) {
      console.log(`WebSocket closed for document: ${ws.getUserData().docName}`)
      ws.doc.closeConnection(ws)
    }
  },

  pong: (ws, message) => {
    if (ws.doc && ws.doc.conns.has(ws)) {
      ws.pongReceived = true
    }
  },

  upgrade: (res, req, context) => {
    // Extract the document name from the URL during upgrade
    const url = req.getUrl()
    const docName = url.slice(1).split('?')[0] || 'default'

    console.log(`WebSocket upgrade request for document: ${docName}`)

    const upgradeAborted = { aborted: false }

    res.onAborted(() => {
      upgradeAborted.aborted = true
    })

    if (upgradeAborted.aborted) {
      return
    }

    // Store the document name in userData
    res.upgrade(
      { docName },
      req.getHeader('sec-websocket-key'),
      req.getHeader('sec-websocket-protocol'),
      req.getHeader('sec-websocket-extensions'),
      context
    )
  }
})

app.listen(host, port, (token) => {
  if (token) {
    console.log(`YJS WebSocket server running at '${host}' on port ${port}`)
  } else {
    console.log(`Failed to listen to port ${port}`)
    process.exit(1)
  }
})

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully')
  process.exit(0)
})
