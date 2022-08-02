'use strict'

const fs = require('fs')
// check .env config
if ( !fs.existsSync('.env') ) {
    console.log('----------\n>Arquivo .env não encontrado\n> EXITED\n----------')
    process.exit(0)
}
// check folder credentials
if ( !fs.existsSync('credentials') ) {
    console.log('----------\n> diretório credentials não encontrada\n----------')
    fs.mkdirSync('credentials')
    console.log('----------\n> diretório credentials criada\n----------')
}

require('dotenv').config()
const lib = require('./lib')
global.log = lib.log

/**
 * CHECK THE .ENV FIRST
 */
const port = process.env.PORT

if ( !port ) {
    log.fatal('Verifique seu arquivo .env')
    process.exit(1)
}
log.info('Seu arquivo .env está configurado')

/**
 * EXPRESS FOR ROUTING
 */
const express = require('express')
const app = express()
const http = require('http')
const server = http.createServer(app)

/**
 * SOCKET.IO
 */
const io = require('socket.io')(server,{
    cors: {
      origin: process.env.ORIGIN
    }
});
/**
 * THIS IS MAIN ROUTER
 */
const wa = require('./router/model/whatsapp')
// middleware
app.use( (req, res, next) => {
    res.set('Cache-Control', 'no-store')
    req.io = io
    // res.set('Cache-Control', 'no-store')
    wa.checkToWhatsApp(io)
    next()
})
io.setMaxListeners(0)

/**
 * PARSER
 */
// body parser
const bodyParser = require('body-parser')
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

app.use(express.static('public'))
app.use(require('./router'))

app.get('/*', (req, res) => {
    res.status(404).end('404 - PAGE NOT FOUND')
})

// console.log(process.argv)

server.listen(port, log.info(`Servidor rodando na porta: ${port}`))

function autostartInstance() {

    const wa = require('./router/model/whatsapp')
    const scheduler = require('./router/model/scheduler')

    // looking for credentials saved
    const fs = require('fs')
    const path = 'credentials'
    const file = fs.readdirSync(path)
    let token = file.filter( x => x != 'store')
    token = token.map( x => x.split('.')[0])

    // looping credentials to reconnecting
    lib.log.info(`Encontrado ${token.length} credencia${token.length > 1 ? '\'is' : 'l'}`)
    for ( let i = 0; i < token.length; i++ ) {
        const delay = i * 2000 // set delay 2 second each credentials. You can edit here for the delay
        setTimeout(async() => {
            lib.log.info(`Reconectando sessão ${token[i]}`)
            await wa.connectToWhatsApp(token[i], io).catch(err => lib.log.error(err))
            scheduler.autostartScheduler(token[i])
        }, delay)
    }

}

// delaying app 5 second before autostart, to more eficient ram.
setTimeout(() => {
    autostartInstance()
}, 5000)