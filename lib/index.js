const moment = require('moment')
const express = require('express')
const PeerList = require('webrtc-signal-http/lib/peer-list')

class TimeoutPeerList extends PeerList {
    constructor(existingPeerList, timeoutPeriodMs, gcIntervalMs, sendPeerMessage) {
        super()
        
        // copy over existing peers if any
        if (existingPeerList) {
            this._peers = existingPeerList._peers || {}
        }

        this._timeoutPeriod = timeoutPeriodMs

        this._gc = setInterval(() => {
            const stalePeers = this.getPeerIds().filter(id => {
                return moment().isAfter(this.getPeer(id).timeoutAt)
            })

            stalePeers.forEach((id) => {
                this.removePeer(id)
            })

            const peerListStr = this.format()

            this.getPeerIds().filter(id => stalePeers.indexOf(id) === -1).forEach((id) => {
                sendPeerMessage(id, id, peerListStr)
            })
        }, gcIntervalMs)
    }

    cancelGc() {
        clearInterval(this._gc)
    }

    refreshPeerTimeout(id) {
        this._peers[id].timeoutAt = moment().add(this._timeoutPeriod, 'ms')
    }
}

module.exports = (opts) => {
    const router = express.Router()
    
    // abstracted peer message sender logic
    // this will direct send if possible, otherwise
    // it will buffer into the peerList
    const sendPeerMessage = (srcId, destId, data) => {
        // find the current peer
        const peer = router.peerList.getPeer(destId)

        if (peer.status()) {
            peer.res
                .status(200)
                .set('Pragma', srcId)
                .send(data)
        }
        // otherwise we buffer
        else {
            router.peerList.pushPeerData(srcId, destId, data)
        }
    }

    const heartbeatPeerList = opts.peerList = new TimeoutPeerList(opts.peerList || null,
        opts.timeoutPeriod || 30 * 1000,
        opts.gcInterval || 15 * 1000,
        sendPeerMessage)
    
    // store the peer list on the router
    router.peerList = heartbeatPeerList

    router.get('/heartbeat', (req, res) => {
        const peerId = req.query.peer_id

        if (!peerId) {
            return res.status(400).end()
        }

        heartbeatPeerList.refreshPeerTimeout(peerId)

        res.status(200).end()
    })

    return router
}