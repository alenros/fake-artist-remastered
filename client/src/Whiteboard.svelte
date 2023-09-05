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

  // Event handler for joining a room
  function joinRoom(event: CustomEvent<string>) {
    if (event.detail.trim() === "") return;
    room = event.detail;
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
        if(data.color !== playerColor){
          drawOnCanvas(data);
        }
      });
    });

    socket.on("player-color", (color) => {
      console.log("player color", color);
      playerColor = color;

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
    socket.emit("start-game", room);
  }

  function requestEndGame() {
    socket.emit("end-game", room);
  }
    }
  }
</script>

<div>
  <GameRoomControls {joinedRoom} {room} on:join-room={joinRoom} on:leave-room={leaveRoom} />
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
