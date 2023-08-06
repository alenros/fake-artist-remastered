const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  }
});

// Enable CORS
// app.use(cors());

app.get('/', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (room) => {
    console.log(`Client ${socket.id} joined room ${room}`);
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }
    socket.currentRoom = room;
    socket.join(room);

     // Send existing drawing data to the client
     if (roomDrawingData[room]) {
      socket.emit('existing-drawings', roomDrawingData[room]);
    }
  });

  socket.on('leave-room', (room) => {
    console.log(`Client ${socket.id} trying to leave room ${room}`);
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      console.log(`Client ${socket.id} left room ${socket.currentRoom}`);
      socket.currentRoom = undefined;
    }
  });

  socket.on('draw', (data) => {
    console.log(`Client ${socket.id} drawing in room ${data.room} and data is ${data.room}`);
    if (socket.currentRoom && socket.currentRoom === data.room) {
      io.to(socket.currentRoom).emit('draw', data);

      // Store the drawing data for the room
      if (!roomDrawingData[data.room]) {
        roomDrawingData[data.room] = [];
      }
      roomDrawingData[data.room].push(data);
    }
    });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// app.get('/', (req, res) => {
//   res.send('Server is up and running!');
// });

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});