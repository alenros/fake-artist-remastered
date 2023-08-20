<script lang="ts">
  import { io } from "socket.io-client";
  import type { SecretWordModel } from "./models/secret-word-model";
  import GameCanvas from "./components/GameCanvas.svelte";
  import type { DrawEventModel } from "./models/draw-event-model";
  import { playerDrawings } from "./stores/drawing-stores";

  const socket = io("http://localhost:5000"); // Connect to the server

  let drawing = false;
  let playerColor; // Variable to store the player's assigned color

  let canvas;
  let context;

  let room = ""; // To store the current room name
  let secretWord: SecretWordModel = { Text: "", Category: "" }; // To store the random word

  // Event handler for joining a room
  function joinRoom() {
    if (room.trim() === "") return;
    socket.emit("join-room", room);
  }

  // Event handler for leaving the current room
  function leaveRoom() {
    socket.emit("leave-room", room);
    room = "";
    playerColor = undefined;
    secretWord.Text = "";
  }

  function handleCanvasEvent(event: CustomEvent<DrawEventModel>) {
    socket.emit("draw", event.detail);
  }

  $: if (room) {
    console.log(
      "Create the canvas and set up listeners when the room is joined"
    );

    socket.on("draw", (data) => {
      drawOnCanvas(data);
    });

    socket.on("existing-drawings", (existingDrawings) => {
      existingDrawings.forEach((data) => {
        drawOnCanvas(data);
      });
    });

    socket.on("player-color", (color) => {
      console.log("player color", color);
      playerColor = color;
    });

    socket.on("random-word", (word) => {
      console.log("random word", word);
      secretWord = word;
    });
  }

  function drawOnCanvas(data: DrawEventModel) {
    if(data){
      console.log("drawing on canvas");
      playerDrawings.set(data);
    }
  }
</script>

<div>
  <h2>Enter Room Name:</h2>
  <input bind:value={room} placeholder="Room name" />
  <button on:click={joinRoom}>Join Room</button>
  {#if room}
    <button on:click={leaveRoom}>Leave Room</button>
    {#if secretWord.Text}
      The category is {secretWord.Category} and the word is {secretWord.Text}
    {/if}
    <GameCanvas {playerColor} {room} on:canvasChange={handleCanvasEvent} />
  {/if}
</div>
