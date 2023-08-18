<script lang="ts">
  import { io } from "socket.io-client";
  import type { SecretWordModel } from "./models/secret-word-model";

  const socket = io("http://localhost:5000"); // Connect to the server

  let drawing = false;
  let playerColor; // Variable to store the player's assigned color

  let canvas;
  let context;

  let room = ""; // To store the current room name
  let secretWord: SecretWordModel = {Text: "", Category: ""}; // To store the random word

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

  function handleMouseDown(event) {
    if (!canvas) return;
    const { offsetX, offsetY } = event;
    drawing = true;

    socket.emit("draw", { type: "start", x: offsetX, y: offsetY, room, color: playerColor });
  }

  function handleMouseMove(event) {
    if (!canvas) return;
    if (!drawing) return;
    const { offsetX, offsetY } = event;

    socket.emit("draw", { type: "move", x: offsetX, y: offsetY, room, color: playerColor });
  }

  function handleMouseUp(event) {
    if (!canvas) return;
    drawing = false;
  }

  $: if (room) {
    console.log(
      "Create the canvas and set up listeners when the room is joined"
    );
    // Create the canvas and set up listeners when the room is joined
    canvas = document.getElementById("canvas");
    context = canvas.getContext("2d");

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

  function drawOnCanvas(data) {
    console.log("drawing on canvas");
    const { type, x, y } = data;

    if (!context) return;
    context.strokeStyle = data.color;
    context.lineWidth = 2;

    if (type === "start") {
      context.beginPath();
      context.moveTo(x, y);
    } else if (type === "move") {
      context.lineTo(x, y);
      context.stroke();
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
    <canvas
      id="canvas"
      width="800"
      height="600"
      style="border: 1px solid {playerColor}};"
      on:mousedown={handleMouseDown}
      on:mousemove={handleMouseMove}
      on:mouseup={handleMouseUp}
    />
  {:else}
    <canvas id="canvas" />
  {/if}
</div>
