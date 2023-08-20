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

const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']; // List of available colors

const roomPlayerColors = {}; // Object to store the assigned color for each player in a room
const roomDrawingData = {}; // Object to store drawing data for each room
const roomWords = {}; // Object to store the random word for each room

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

  socket.on('join-room', (room) => {
    console.log(`Client ${socket.id} joined room ${room}`);
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
    }
    socket.currentRoom = room;
    socket.join(room);

    const playerColor = colors[Object.keys(roomPlayerColors).length % colors.length];
    roomPlayerColors[socket.id] = playerColor;
    socket.emit('player-color', playerColor);

    // Generate and assign a random word to the room
    if (!roomWords[room]) {
      const randomWord = generateRandomWord();
      roomWords[room] = randomWord;
    }

    socket.emit('random-word', roomWords[room]);

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
