<script lang="ts">
  import { io } from "socket.io-client";
  import type { SecretWordModel } from "./models/secret-word-model";
  import GameCanvas from "./components/GameCanvas.svelte";
  import type { DrawEventModel } from "./models/draw-event-model";
  import { playerDrawings, updateDrawing } from "./stores/drawing-stores";
  import GameRoomControls from "./components/GameRoomControls.svelte";

  const socket = io("http://localhost:5000"); // Connect to the server

  let playerColor; // Variable to store the player's assigned color

  let room = ""; // To store the current room name
  let secretWord: SecretWordModel = { Text: "", Category: "" }; // To store the random word
  let joinedRoom = false;
  let isFakeArtist = true;
  let hasGameStarted = false;
  let isSpectator = false;
  let playerId: string = "";

  async function createRoom(event: CustomEvent<string>) {
    if (event.detail.trim() === "") return;

    var playerId = event.detail;
    var requestBody = JSON.stringify({ playerId: `${playerId}` });

    var response = await fetch(`http://localhost:5000/api/v1/rooms`, {
      method: "POST",
      body: requestBody,
    });
    var newRoomDetails = await response.json();
    room = newRoomDetails.accessCode;
    playerId = newRoomDetails.playerId;
    sessionStorage.setItem("playerId", playerId);

    joinedRoom = true;
  }

  // Event handler for joining a room
  function joinRoom(event: CustomEvent<{ roomId: string; playerId: string }>) {
    if (event.detail.roomId.trim() === "") return;
    room = event.detail.roomId;
    socket.emit("join-room", event.detail);
    joinedRoom = true;
  }

  // Event handler for leaving the current room
  function leaveRoom(event: CustomEvent<string>) {
    socket.emit("leave-room", event.detail);
    room = "";
    playerColor = undefined;
    secretWord.Text = "";
    joinedRoom = false;
  }

  function handleCanvasEvent(event: CustomEvent<DrawEventModel>) {
    if (isSpectator) {
      return;
    }

    socket.emit("draw", event.detail);
  }

  socket.on("set-session-data", (data) => {
    sessionStorage.setItem("playerId", data.playerId);
    playerId = data.playerId;
  });

  $: if (room) {
    console.log(
      "Create the canvas and set up listeners when the room is joined"
    );

    socket.on("draw", (data) => {
      drawOnCanvas(data);
    });

    socket.on("existing-drawings", (existingDrawings) => {
      existingDrawings.forEach((data) => {
        if (data.color !== playerColor) {
          drawOnCanvas(data);
        }
      });
    });

    function drawOnCanvas(data: DrawEventModel) {
      if (data) {
        updateDrawing(data);
      }
    }

    socket.on("game-started", (gameData) => {
      hasGameStarted = true;
      var currentPlayerId = sessionStorage.getItem("playerId");
      isFakeArtist = gameData.fakeArtistPlayerId == currentPlayerId;
      secretWord = gameData.secretWord;
      isSpectator = gameData.isSpectator;

      gameData.playersToColors.forEach((v) => {
        if (v.playerId == currentPlayerId) {
          playerColor = v.color;
        }
      });
    });
  }

  socket.on("game-ended", (gameData) => {
    hasGameStarted = false;
  });

  function requestStartGame() {
    var playerId = sessionStorage.getItem("playerId");
    socket.emit("start-game", {room,playerId: playerId});
  }

  function requestEndGame() {
    var playerId = sessionStorage.getItem("playerId");
    socket.emit("end-game", {room,playerId: playerId});
  }

  async function requestFromServerDemo() {
    var response = await fetch(`http://localhost:5000/api/v1/rooms/${room}`);
    var currentPlayerDetails = await response.json();

    var playerId = sessionStorage.getItem("playerId");
    var response = await fetch(
      `http://localhost:5000/api/v1/players/${playerId}`
    );
    var currentPlayerDetails = await response.json();
    isFakeArtist = currentPlayerDetails.isFakeArtist;
    if (hasGameStarted === false) {
      hasGameStarted = true;
      socket.emit("start-game");
    }
  }
</script>

<div>
  <GameRoomControls
    {joinedRoom}
    {room}
    {playerId}
    on:create-room={createRoom}
    on:join-room={joinRoom}
    on:leave-room={leaveRoom}
  />
  
  {#if joinedRoom}
    {#if !hasGameStarted}
      <button on:click={requestStartGame}>Start Game</button>
    {:else}
      <button on:click={requestEndGame}>End Game</button>
      <div>
        Role:
        {#if isFakeArtist}
          Fake-Artist
        {:else if isSpectator}
          Spectator
        {:else}
          Real Artist
        {/if}
      </div>

      {#if secretWord.Text}
        <div>
          <p>
            Category: {secretWord.Category}
          </p>
          <p>
            Word:
            {#if isFakeArtist}
              ???
            {:else}
              {secretWord.Text}
            {/if}
          </p>
        </div>
      {/if}
      <GameCanvas
        {playerColor}
        {room}
        {isSpectator}
        on:canvasChange={handleCanvasEvent}
      />
    {/if}
  {/if}
</div>
