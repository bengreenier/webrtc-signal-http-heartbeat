# webrtc-signal-http-heartbeat

[![Build Status](https://travis-ci.org/bengreenier/webrtc-signal-http-heartbeat.svg?branch=master)](https://travis-ci.org/bengreenier/webrtc-signal-http-heartbeat)

[![Deploy to Azure](https://azuredeploy.net/deploybutton.png)](https://azuredeploy.net/) [![Greenkeeper badge](https://badges.greenkeeper.io/bengreenier/webrtc-signal-http-heartbeat.svg)](https://greenkeeper.io/)

[webrtc-signal-http](https://github.com/bengreenier/webrtc-signal-http) heartbeat timeout extension :heart: :timer_clock:

![logo gif](./readme_example.gif)

This adds an additional signal message to help prevent stale peers appearing as legitimate, by requiring clients to send this message at a defined interval. Clients that stop sending the message are removed from the [PeerList](https://github.com/bengreenier/webrtc-signal-http#peerlist).

## Getting started

> Learn about the [RESTful API extension](#restful-api) via the OpenAPI doc ([raw](./swagger.yml) or [hosted](https://rebilly.github.io/ReDoc/?url=https://raw.githubusercontent.com/bengreenier/webrtc-signal-http-heartbeat/master/swagger.yml)) to understand how clients should change their interaction with the service when using this extension.

To install a signal server including this extension that can be used in a cli `npm install -g webrtc-signal-http-signal`. To run it, just use `webrtc-signal-http-heartbeat` from the command line, using the `PORT` environment variable to configure it's listening port, `WEBRTC_HEARTBEAT_MS` to configure the heartbeat timeout, and `WEBRTC_HEARTBEAT_GC_MS` to configure the gc interval.

To consume this server in combination with [webrtc-signal-http](https://github.com/bengreenier/webrtc-signal-http) and other possible extensions, `npm install webrtc-signal-http webrtc-signal-http-heartbeat` and then run some code like the following:

```
const express = require('express')
const signalRouterCreator = require('webrtc-signal-http')
const heartbeatRouterCreator = require('webrtc-signal-http-heartbeat')

const app = express()
const heartbeatRouter = heartbeatRouterCreator()
const signalRouter = signalRouterCreator({
    peerList: heartbeatRouter.peerList
})

app.use(signalRouter, heartbeatRouter)

app.get('/new-endpoint', (req, res) => { res.send('hello') })

app.listen(process.env.PORT || 3000)
```

## RESTful API

To understand the base API provided by [webrtc-signal-http](https://github.com/bengreenier/webrtc-signal-http), look at the [docs for that project](https://github.com/bengreenier/webrtc-signal-http#restful-api). This documents the API endpoints this extension adds. :sparkles:

### GET /heartbeat

> Takes `peer_id` query parameter

Indicates a peer is still actively connected and able to signal. This endpoint is expected to be called at an interval defined by the extension (default `30s`). The response will be empty.

```
GET http://localhost:3000/heartbeat?peer_id=1 HTTP/1.1
Host: localhost:3000

=>

HTTP/1.1 200 OK
Content-Length: 0
```

## Extension API

To understand the base API provided by [webrtc-signal-http](https://github.com/bengreenier/webrtc-signal-http), look at the [docs for that project](https://github.com/bengreenier/webrtc-signal-http#extension-api). This documents the javascript API this extension adds. :sparkles:

### module.exports

> This is the exported behavior, you access it with `require('webrtc-signal-http-heartbeat')`

[Function] - takes a [HeartbeatOpts](#heartbeatopts) indicating configuration options. __Returns__ an [express](https://expressjs.com/) `router` object.

#### router.peerList

[Object] - can be used to retrieve a `PeerList` from the express `router`. __Returns__ a [TimeoutPeerList](#timeoutpeerlist) object.

### TimeoutPeerList

[Class] - Extends [PeerList](https://github.com/bengreenier/webrtc-signal-http/#peerlist) with the ability to have peers timeout.

#### refreshPeerTimeout

[Function] - Takes `id` (a Number). Resets the timeout on a peer, keeping it active. __Returns__ nothing.

#### cancelGc

[Function] - Takes nothing. Stops the GC from running. __Returns__ nothing.

### HeartbeatOpts

[Object] - represents the options that can be given to the heartbeat creator

#### timeoutPeriod

[Number] - the timeout period in `ms` after which a client will be marked as stale, and cleaned up when the "gc" runs. Default `30s`

#### gcInterval

[Number] - the interval in `ms` at which the gc will run, removing stale clients. Default `15s`

## License

MIT