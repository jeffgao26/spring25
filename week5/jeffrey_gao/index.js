const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.use(express.static(__dirname));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

let users = {};

io.on('connection', (socket) => {
    socket.on('set username', (username) => {
        users[socket.id] = username;
        io.emit('user joined', username);
    });

    socket.on('chat message', (msg) => {
        const date = new Date();
        const timeString = date.toLocaleTimeString();
        const dateString = date.toLocaleDateString();
        io.emit('chat message', { user: users[socket.id] || 'Anonymous', text: msg, time: dateString + " " + timeString });
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
  console.log('listening on *:3000'); 
});
