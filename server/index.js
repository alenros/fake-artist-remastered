const express = require('express');
const http = require('http');
const cors = require('cors');

const fs = require("fs");
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
  res.json({ msg: 'This is CORS-enabled for all origins!'})
})

const colors = ['#e4007f', '#009933', '#D62828', '#F77F00', '#88D18A', '#8A5CFF', '#F1D302', '#235789','#00C49A']; // List of available colors

const roomPlayerColors = {}; // Object to store the assigned color for each player in a room
const roomDrawingData = {}; // Object to store drawing data for each room
const roomWords = {}; // Object to store the random word for each room
const roomPlayers = {};
const roomGameHasStarted = {};

function getUserLanguage() {
  // TODO Implement using navigor.language or through a users choice
  return "en";
}

function getWordsFromProvider() {
  let wordsFilename;
  switch (getUserLanguage()) {
    case "en":
      wordsFilename = "words-en.json";
      break;
    case "es":
      wordsFilename = "words-es.json";
      break;
    default:
      wordsFilename = "words-en.json";
      break;
  }
  
  const wordsData = fs.readFileSync(`data\\${wordsFilename}`, "utf-8");
  const words = JSON.parse(wordsData);

  return words;
}

function generateRandomWord() {
  const words = getWordsFromProvider();

  let randomWord = words[Math.floor(Math.random() * words.length)];
  return randomWord;
}

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  let sessionData = { "playerId": socket.id };
  socket.emit("set-session-data", sessionData);

  socket.on('join-room', (room) => {
    console.log(`Client ${socket.id} joined room ${room}`);
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }
    socket.currentRoom = room;
    socket.join(room);

    // Add Player to room
    if (!roomPlayers[room]) {
      roomPlayers[room] = [];
    }
    roomPlayers[room].push(socket.id);

    if (roomGameHasStarted[room]) {
      // Set spectator color to grey
      var playersToColors = { playerId: socket.id, color: "#33ff33" };

      var gameData = { secretWord: roomWords[room], fakeArtistPlayerId: "", playersToColors: playersToColors, isSpectator: true }

      socket.emit("game-started", gameData);
    }

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

  socket.on('start-game', (room) => {
    console.log(`got start game request for ${room}`);

    // Generate and assign a random word to the room
    const randomWord = generateRandomWord();
    roomWords[room] = randomWord;
    var playersInRoom = [];

    roomGameHasStarted[room] = true;

    roomPlayers[room].forEach(p => {
      playersInRoom.push(p);
    });

    var fakeArtistPlayerId = playersInRoom[Math.floor(Math.random() * playersInRoom.length)];

    var playersToColors = playersInRoom.map((p, index) => { return { playerId: p, color: colors[index % colors.length] } });
    var gameData = { secretWord: roomWords[room], fakeArtistPlayerId: fakeArtistPlayerId, playersToColors: playersToColors, isSpectator: false }

    // TODO Fix the dual send
    socket.to(room).emit("game-started", gameData);
    socket.emit("game-started", gameData);
  });

  socket.on('end-game', (room) => {
    console.log(`got end game request for ${room}`);

    // Generate and assign a random word to the room
    roomWords[room] = '';
    roomGameHasStarted[room] = false;
    // TODO Fix the dual send
    socket.to(room).emit("game-ended");
    socket.emit("game-ended");
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
