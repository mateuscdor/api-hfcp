'use strict'

const express = require('express')
const router = express.Router()
const session = require('express-session');
const path = require('path');

router.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(express.static(path.join(__dirname, 'static')));

/**
 * THIS IS MAIN ROUTER
 */
const wa = require('./model/routes')
const store = require('./model/store')
const scheduler = require('./model/scheduler')
const CryptoJS = require("crypto-js")

// sendFile will from here. Delete or comment if no use anymore
router.get('/', (req, res) => {
    if (req.session && req.session.loggedin && req.session.token === process.env.TOKEN) {
        res.sendFile(path.join(__dirname, '../public/home.html'));
    } else {
        res.sendFile(path.join(__dirname, '../public/login.html'));
    }
})

router.post('/', (req, res) => {
    let token = req.body.token;
    if (token) {
        if (token === process.env.TOKEN) {
            // Authenticate the user
            req.session.loggedin = true;
            req.session.token = token;
            res.redirect('/');
        } else {
            res.send('Tokem inválido!');
            res.end();
        }
    } else {
        res.send('Informe um token!');
        res.end();
    }
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