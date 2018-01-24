const assert = require('assert')
const express = require('express')
const request = require('supertest')
const heartbeatRouter = require('../lib')

const appCreator = (timeoutPeriod, gcInterval) => {
    const router = heartbeatRouter({
        timeoutPeriod: timeoutPeriod,
        gcInterval: gcInterval
    })
    const app = express()

    app.use(router)

    // for testing, we also further expose peerList
    app.peerList = router.peerList

    return app
}

describe('webrtc-signal-http-heartbeat', () => {
    describe('http', () => {
        it('should support heartbeat', (done) => {
            const app = appCreator()

            const peerId = app.peerList.addPeer('testPeer', {})

            request(app)
                .get(`/heartbeat?peer_id=${peerId}`)
                .expect(200)
                .then(() => {
                    app.peerList.cancelGc()
                })
                .then(done,done)
        })

        it('should gc stale connections', (done) => {
            const app = appCreator(300, 100)

            const peerId = app.peerList.addPeer('testPeer', {})

            request(app)
                .get(`/heartbeat?peer_id=${peerId}`)
                .expect(200)
                .then(() => {
                    assert.deepEqual(app.peerList.getPeerIds(), [`${peerId}`])
                }).then(() => {
                    return new Promise((resolve, reject) => {
                        setTimeout(resolve, 400)
                    })
                })
                .then(() => {
                    assert.deepEqual(app.peerList.getPeerIds(), [])
                })
                .then(() => {
                    app.peerList.cancelGc()
                })
                .then(done, done)
        })
    })
})