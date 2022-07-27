'use strict'

const express = require('express')
const router = express.Router()

/**
 * THIS IS MAIN ROUTER
 */
const wa = require('./model/routes')
const store = require('./model/store')
const scheduler = require('./model/scheduler')
const CryptoJS = require("crypto-js")

// sendFile will from here. Delete or comment if no use anymore
router.get('/', (req, res) => {
    const path = require('path')
    res.sendFile(path.join(__dirname, '../public/index.html'));
})

// Check headers post from your PHP backend, don't forget to get
router.use((req, res, next) => {
    next()
})

// API WHATSAPP
router.post('/create-instance', wa.createInstance)
router.post('/send-message', wa.sendText)
router.post('/send-file', wa.sendMedia)
router.post('/send-button-message', wa.sendButtonMessage)
router.post('/send-template-message', wa.sendTemplateMessage)
router.post('/send-list-message', wa.sendListMessage)
router.post('/send-reaction', wa.sendReaction)
router.post('/is-exists', wa.isExists)
router.post('/get-profile-picture', wa.getPpUrl)
router.post('/delete-for-every-one', wa.deleteEveryOne)
router.post('/group-metadata', wa.groupMetadata)
router.post('/delete-credential', wa.deleteCredentials)

// STORE
router.post('/store/chats', store.chats)

// SCHEDULER
router.post('/scheduler', scheduler.getScheduler)
router.post('/scheduler/add-scheduler', scheduler.addScheduler)
router.post('/scheduler/stop-scheduler', scheduler.stopScheduler)

module.exports = router