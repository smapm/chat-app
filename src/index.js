const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages');
const {addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;

const publicDirectory = path.join(__dirname, '../public'); 

app.use(express.static(publicDirectory));

io.on('connection', (socket)=>{
    console.log('New connection');

    socket.on('join', ({username, room}, callback) =>{
        const {error, user} = addUser({id: socket.id, username, room})
        if(error){
            return callback(error)
        }
        socket.join(user.room);
        socket.emit('message', generateMessage('Admin','Welcome'));
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`));
        io.to(user.room).emit('activeUsers', {
            room: user.room,
            users: getUsersInRoom(user.room)
        });
        callback();
    });

    socket.on('newMessage', (msg, callback)=>{
        const filter = new Filter();
        if(filter.isProfane(msg)){
            socket.emit('message', generateMessage('Admin','profane language is not allowed'));
            return callback('profane language is not allowed');        
        }
        const user = getUser(socket.id);
        io.to(user.room).emit('message', generateMessage(user.username,msg))
        callback();
    });

    socket.on('sendLocation', (location, callback) =>{  
        const user = getUser(socket.id);      
        io.to(user.room).emit('locationMessage', generateLocationMessage(user.username,`https://google.com/maps?q=${location.latitude},${location.longitude}`));
        callback('Location shared');
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id);
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} left!`));
            io.to(user.room).emit('activeUsers', {
                room: user.room,
                users: getUsersInRoom(user.room)
            });
        }
    })

});

server.listen(port, ()=>{
    console.log(`server up and running on port ${port}`);
})