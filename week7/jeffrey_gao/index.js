const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const mongoose = require('mongoose');

const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

async function main() {
    await mongoose.connect('mongodb://localhost:27017/chatbox');
    console.log('Connected to MongoDB');
}
main().catch(err => console.log(err));

const chatSchema = new mongoose.Schema({
    user: String,
    text: String,
    time: String
});

const Chat = mongoose.model('Chat', chatSchema);

let users = {};

io.on('connection', async (socket) => {
    console.log('A user connected');

    const messages = await Chat.find().sort({ _id: -1 }).limit(20);
    socket.emit('chat history', messages.reverse());

    socket.on('set username', (username) => {
        users[socket.id] = username;
        io.emit('user joined', username);
    });

    socket.on('chat message', async (msg) => {
        const timestamp = new Date().toLocaleTimeString();
        const message = new Chat({ user: users[socket.id] || 'Anonymous', text: msg, time: timestamp });

        await message.save();
        io.emit('chat message', { user: message.user, text: message.text, time: message.time });
    });

    socket.on('typing', () => {
        socket.broadcast.emit('typing', users[socket.id] || 'Someone');
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
    });

    socket.on('disconnect', () => {
        io.emit('user left', users[socket.id] || 'Someone');
        delete users[socket.id];
    });
});

server.listen(3000, () => {
    console.log('Listening on *:3000');
});
