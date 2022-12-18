const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {userJoin,getCurrentUser, userLeave, getRoomUsers} = require('./utils/users');  

const appp = express();
const Server = http.createServer(appp);
const io = socketio(Server);



//Set static folder
appp.use(express.static(path.join(__dirname, '')));

const botName = 'Akazaya';

//run when client connects
io.on('connection', socket =>{
    socket.on('joinRoom',({username, room})=> {
        const user = userJoin(socket.id, username, room);
        
        socket.join(user.room);

        //Welcome current user
    socket.emit('message',formatMessage(botName,'Welcome to Oden!'));

    //Broadcast When a user connects
    socket.broadcast.to(user.room).emit('message', formatMessage(botName,`${user.username} has joined the chat`));

        //Send user and room info
        io.to(user.room).emit('roomUsers',{
            room: user.room,
            users: getRoomUsers(user.room)
        });

    });

    console.log('New Ws Connection');

    //Listen for chat message
    socket.on('chatMessage', msg=>{
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username,msg));
    });

    //Runs when client disconects
    socket.on('disconnect', () =>{
        const user = userLeave(socket.id);

        if(user) {
            io.to(user.room).emit('message', formatMessage(botName,`${user.username} has left the chat`));
            //Send user and room info
            io.to(user.room).emit('roomUsers',{
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });
});

const PORT = 3000 || process.env.PORT;

Server.listen(PORT, ()  => console.log(`Server running on port${PORT}`));