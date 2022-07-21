const makeWaSocket = require('@adiwajshing/baileys').default
const { useMultiFileAuthState, delay, DisconnectReason, fetchLatestBaileysVersion } = require('@adiwajshing/baileys')
const { existsSync, mkdirSync } = require('fs')
const fs = require("fs")
const http = require("http")
const qrcode = require("qrcode")
const express = require('express')
const socketIO = require("socket.io")
const app = express();
const server = http.createServer(app)
const io = socketIO(server)
const fileUpload = require('express-fileupload')
const P = require('pino')
const mime = require('mime-types')
const db = require('./mysql.js');
const axios = require('axios');
require('dotenv').config();
const port = process.env.SERVER_PORT;
const Path = './Sessions/';
const Auth = 'auth_info.json';
const appName = process.env.NAME + " " + port;
const log = process.env.ERROR_LOG || 'silent';
const logEnvio = process.env.SEND_LOG || false;
app.use(express.json()); //parser used for requests via post,
app.use("/assets", express.static(__dirname + "/assets"))
app.use(express.urlencoded({ extended : true }));
app.use(fileUpload({ debug: false }));
const retries = new Map()

app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: __dirname
    });
});

app.post('/send-message', async function (req, res) {

    console.log("Requested sending VIA POST message");

    var number = req.body.number;
    const jid = number + '@c.us'
    const message = req.body.message;
    const footer = req.body.footer;
    const button = req.body.button;
    var return_object;

    const { state, saveCreds } = await useMultiFileAuthState(Path + Auth)
    const conn = makeWaSocket({ auth: state, logger: P({ level: log }) })
    conn.ev.on('creds.update', saveCreds)

    let options = {
        text: message,
        footer: footer
    };

    let templateButtons = [];

    for (i in button){
        templateButtons[i] = {};
        templateButtons[i].index = (parseInt(i) + 1);
        if (button[i].urlButton){
            templateButtons[i].urlButton = {
                displayText: button[i].textButton ? button[i].textButton : button[i].urlButton,
                url: button[i].urlButton
            }
        }
        if (button[i].phoneButton){
            templateButtons[i].callButton = {
                displayText: button[i].textButton ? button[i].textButton : button[i].phoneButton,
                phoneNumber: button[i].phoneButton
            }
        }
        if (button[i].replyButton){
            templateButtons[i].quickReplyButton = {
                displayText: button[i].replyButton,
                id: 'id-like-buttons-message'
            }
        }
    }
    if(templateButtons.length){
        options.templateButtons = templateButtons;
    }

    await conn.waitForConnectionUpdate(({ connection }) => connection === "open")

    // Vários botões
    /*return_object = await conn.sendMessage(jid, options)

    templateButtons = [
        { index: 1, quickReplyButton: { displayText: 'Opção 4', id: 'id-like-buttons-message' } },
        { index: 2, quickReplyButton: { displayText: 'Opção 5', id: 'id-like-buttons-message' } },
        { index: 3, quickReplyButton: { displayText: 'Opção 6', id: 'id-like-buttons-message' } },
    ]
    options.text = 'ou ainda:';
    options.templateButtons = templateButtons;

    return_object = await conn.sendMessage(jid, options)

    templateButtons = [
        { index: 1, quickReplyButton: { displayText: 'Opção 7', id: 'id-like-buttons-message' } },
        { index: 2, quickReplyButton: { displayText: 'Opção 8', id: 'id-like-buttons-message' } },
        { index: 3, quickReplyButton: { displayText: 'Opção 9', id: 'id-like-buttons-message' } },
    ]
    options.text = 'ou ainda:';
    options.templateButtons = templateButtons;*/

    //Lista de mensagens
    /*const sections = [
        {
            title: "Suporte",
            rows: [
                { title: "Opção 1", rowId: "option1" },
                { title: "Opção 2", rowId: "option2", description: "Descrição aqui" }
            ]
        },
        {
            title: "Atendimento",
            rows: [
                { title: "Opção 1", rowId: "option3" },
                { title: "Opção 2", rowId: "option4", description: "Descrição 2 aqui" },
                { title: "Opção 3", rowId: "option5", description: "Descrição 3 aqui" },
                { title: "Opção 4", rowId: "option6", description: "Descrição 4 aqui" },
                { title: "Opção 5", rowId: "option7", description: "Descrição 5 aqui" },
                { title: "Opção 6", rowId: "option8", description: "Descrição 6 aqui" },
                { title: "Opção 7", rowId: "option9" },
                { title: "Opção 8", rowId: "option10" },
                { title: "Opção 9", rowId: "option11" },
                { title: "Opção 10", rowId: "option12" }
            ]
        },
    ]

    const options = {
        text: "Também da pra enviar uma lista de opções!",
        title: "Titulo da lista de opções",
        buttonText: "Selecione uma opção",
        sections
    }*/

    const [result] = await conn.onWhatsApp(jid)
    if (!result || !result.exists) {
        return_object = { status: false, message: 'Número indisponível ou bloqueado.' };
    } else {
        return_object = await conn.sendMessage(jid, options);
        if (logEnvio) {
            console.log('© BOT - Log envio:', return_object);
        }
    }

    res.send(return_object);

});

app.post('/send-file', async (req, res) => {
    const number = req.body.number;
    const jid = number + '@c.us';
    const caption = req.body.caption;
    const fileUrl = req.body.fileUrl;
    const fileName = req.body.fileName;
    const footer = req.body.footer;
    const button = req.body.button;

    console.log("Requested sending VIA POST file", { caption: caption, url: fileUrl, fileName: fileName });

    const { state, saveCreds } = await useMultiFileAuthState(Path + Auth)
    const conn = makeWaSocket({ auth: state, logger: P({ level: log }) })
    conn.ev.on('creds.update', saveCreds)

    const mimeType = mime.lookup(fileUrl);
    const typeMessage = mimeType.split("/")[0];

    let options = {};
    if (typeMessage === "video") {
        options = {
            video: { url: fileUrl },
            caption: caption,
            fileName: fileName
        };
    } else if (typeMessage === "audio") {
        options = {
            audio: { url: fileUrl },
            mimetype: mimeType,
        };
    } else if (typeMessage === "document" || typeMessage === "application") {
        options = {
            document: { url: fileUrl },
            fileName: fileName,
            mimetype: mimeType
        };
    } else {
        options = {
            image: { url: fileUrl },
            caption: caption,
            fileName: fileName,
        };
    }

    options.footer = footer;

    let templateButtons = [];

    for (i in button) {
        templateButtons[i] = {};
        templateButtons[i].index = (parseInt(i) + 1);
        if (button[i].urlButton) {
            templateButtons[i].urlButton = {
                displayText: button[i].textButton ? button[i].textButton : button[i].urlButton,
                url: button[i].urlButton
            }
        }
        if (button[i].phoneButton) {
            templateButtons[i].callButton = {
                displayText: button[i].textButton ? button[i].textButton : button[i].phoneButton,
                phoneNumber: button[i].phoneButton
            }
        }
        if (button[i].replyButton) {
            templateButtons[i].quickReplyButton = {
                displayText: button[i].replyButton,
                id: 'id-like-buttons-message'
            }
        }
    }
    if (templateButtons.length) {
        options.templateButtons = templateButtons;
    }

    await conn.waitForConnectionUpdate(({ connection }) => connection === "open");

    const [result] = await conn.onWhatsApp(jid)
    if (!result || !result.exists) {
        return_object = { status: false, message: 'Número indisponível ou bloqueado.' };
    } else {
        return_object = await conn.sendMessage(jid, options)
    }

    res.send(return_object);

});

app.get('/deleteconnection', async function (req, res) {

    const { state, saveCreds } = await useMultiFileAuthState(Path + Auth)
    const conn = makeWaSocket({ auth: state, logger: P({ level: log }) })
    conn.ev.on('creds.update', saveCreds)

    if (!existsSync(Path)) {
        res.send({ status: 'Nenhuma sessão encontrada' });
    } else {
        await conn.logout()
            .then(fs.rmSync(Path, { recursive: true, force: true }))
            .catch(function () {
                connectToWhatsApp()
                console.log('© BOT - Sessão removida');
                res.send({ status: 'Sessão removida' });
            });

    }
});


const groupCheck = (jid) => {
    const regexp = new RegExp(/^\d{18}@g.us$/)
    return regexp.test(jid)
}

io.on("connection", async socket => {
    socket.emit('message', '© BOT - Aguarde a conexão...');
    socket.emit("check", "./assets/off.svg")

    connectToWhatsApp()

})

const shouldReconnect = (sessionId) => {
    let maxRetries = parseInt(2 ?? 0)
    let attempts = retries.get(sessionId) ?? 0
    maxRetries = maxRetries < 1 ? 1 : maxRetries
    if (attempts < maxRetries) {
        ++attempts
        console.log('Reconectando...', { attempts, sessionId })
        retries.set(sessionId, attempts)
        return true
    }
    return false
}

async function connectToWhatsApp() {
    var return_object;
    const { version } = await fetchLatestBaileysVersion()

    if (!existsSync(Path)) {
        mkdirSync(Path, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(Path + Auth)

    const config = {
        auth: state,
        logger: P({ level: log }),
        printQRInTerminal: true,
        version,
        browser: [appName, "MacOS", "3.0"],
        connectTimeoutMs: 60_000,
        async getMessage(key) {
            return { conversation: 'botzg' };
        },
    }
    const conn = makeWaSocket(config)
    conn.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        const Reconnect = lastDisconnect?.error?.output?.statusCode
        if (qr) {
            console.log('© BOT - Qrcode: ', qr);
            qrcode.toDataURL(qr, (err, url) => {
                io.emit("qr", url)
                io.emit("message", "© BOT - Qrcode recebido.")
            })
        };

        if (connection === 'close') {
            if (Reconnect === DisconnectReason.loggedOut || !shouldReconnect(Path + Auth)) {
                return;
            }
            setTimeout(() => {
                connectToWhatsApp()
                console.log('© BOT - CONECTADO');
                io.emit('message', '© BOT - WhatsApp conectado!');
                io.emit("check", "./assets/check.svg")
                return_object = { status: 'Conectado' };
            },
                Reconnect === DisconnectReason.restartRequired ? 0 : parseInt(5000 ?? 0)
            )

            if (Reconnect === DisconnectReason.connectionClosed) {
                console.log('© BOT - WhatsApp desconectado!')
                io.emit('message', '© BOT - WhatsApp desconectado!');
                io.emit("check", "./assets/off.svg")
                return_object = { status: 'WhatsApp desconectado!' };
            }
        }
        if (connection === 'open') {
            console.log('© BOT - CONECTADO')
            io.emit('message', '© BOT - WhatsApp conectado!');
            io.emit("check", "./assets/check.svg")
            return_object = { status: 'Conectado' };
        }
    })
    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        const usuario = msg.pushName
        const jid = msg.key.remoteJid
        if (!msg.key.fromMe && jid !== 'status@broadcast' && !groupCheck(jid)) {
            const user = jid.replace(/\D/g, '');
            const getUser = await db.getUser(user);
            if (getUser == false) {
                setUserFrom = await db.setUser(user);
                axios.get('https://meuhfc.com.br/app/api/imagenet/resposta')
                    .then(function (response) {
                        // handle success
                        //console.log('ok', response);
                    })
                    .catch(function (error) {
                        console.log('erro', error);
                    })
            }
        }
    });

    await delay(1000);
    return return_object
}

connectToWhatsApp()

server.listen(port, function () {
    console.log('© BOT - Servidor rodando na porta: ' + port);
});