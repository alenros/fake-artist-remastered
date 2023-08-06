const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Enable CORS
app.use(cors());

app.get('/', function (req, res, next) {
  res.json({msg: 'This is CORS-enabled for all origins!'})
})

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('draw', (data) => {
    socket.broadcast.emit('draw', data);
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
