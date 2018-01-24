#!/usr/bin/env node
const express = require('express')
const signalRouterCreator = require('webrtc-signal-http')
const heartbeatRouterCreator = require('./lib')

const app = express()
const heartbeatRouter = heartbeatRouterCreator({
    timeoutPeriod: process.env.WEBRTC_HEARTBEAT_MS || 30 * 1000,
    gcInterval: process.env.WEBRTC_HEARTBEAT_GC_MS || 15 * 1000
})
const signalRouter = signalRouterCreator({
    peerList: heartbeatRouter.peerList,
    enableLogging: process.env.WEBRTC_SIGNAL_LOGGING || true
})
app.use(signalRouter, heartbeatRouter).listen(process.env.PORT || 3000)