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
  res.json({ msg: 'This is CORS-enabled for all origins!' })
})

app.post('/api/v1/rooms', (req, res, next) => {
  var playerId = req.params.playerId;
  if (playerId === undefined) {
    var playerId = generateUserID();
  }

  var accessCode = generateAccessCode();

  console.log(`creating room ${accessCode} requested by ${playerId}`);

  // io.socket.currentRoom = accessCode;
  // io.socket.join(accessCode);

  enterRoom(accessCode, playerId);

  res.json({ accessCode, playerId });
});

const colors = ['#e4007f', '#009933', '#D62828', '#F77F00', '#88D18A', '#8A5CFF', '#F1D302', '#235789', '#00C49A']; // List of available colors

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

function generateAccessCode() {
  let accessCodeLength = 5;
  let accessCode = "";

  for (var i = 0; i < accessCodeLength; i++) {
    let randomDigit = Math.floor(Math.random() * 10);
    accessCode = accessCode + randomDigit;
  }

  return accessCode;
}

function generateUserID() {
  return "player-" + generateAccessCode();
}

function enterRoom(room, playerId) {
  // Add Player to room
  if (!roomPlayers[room]) {
    roomPlayers[room] = [];
  }

  roomPlayers[room].push(playerId);

  if (roomGameHasStarted[room]) {
    // Set spectator color to grey
    var playersToColors = { playerId: socket.id, color: "#33ff33" };

    var gameData = { secretWord: roomWords[room], fakeArtistPlayerId: "", playersToColors: playersToColors, isSpectator: true }

    io.socket.to(room).emit("game-started", gameData);
  }

  // Send existing drawing data to the client
  if (roomDrawingData[room]) {
    io.socket.to(room).emit('existing-drawings', roomDrawingData[room]);
  }
}

io.on('connection', (socket) => {

  console.log('New client connected:', socket.id);

  let sessionData = { "playerId": socket.id };
  socket.emit("set-session-data", sessionData);

  socket.on('join-room', ({ roomId, playerId }) => {
    console.log(`Client ${playerId} joined room ${roomId}`);
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }
    socket.currentRoom = roomId;
    socket.join(roomId);

    enterRoom(roomId, playerId);
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
    if (socket.currentRoom && socket.currentRoom === data.room) {
      io.to(socket.currentRoom).emit('draw', data);

      // Store the drawing data for the room
      if (!roomDrawingData[data.room]) {
        roomDrawingData[data.room] = [];
      }
      roomDrawingData[data.room].push(data);
    }
  });

  socket.on('start-game', ({room, playerId}) => {
    console.log(`got start game request for room ${room} by player ${playerId}`);

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

  socket.on('end-game', ({room, playerId}) => {
    console.log(`got end game request for for room ${room} by player ${playerId}`);

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
