<script lang="ts">
  import { io } from "socket.io-client";
  import type { SecretWordModel } from "./models/secret-word-model";
  import GameCanvas from "./components/GameCanvas.svelte";
  import type { DrawEventModel } from "./models/draw-event-model";
  import { playerDrawings } from "./stores/drawing-stores";
  import GameRoomControls from "./components/GameRoomControls.svelte";

  const socket = io("http://localhost:5000"); // Connect to the server

  let drawing = false;
  let playerColor; // Variable to store the player's assigned color

  let canvas;
  let context;

  let room = ""; // To store the current room name
  let secretWord: SecretWordModel = { Text: "", Category: "" }; // To store the random word
  let joinedRoom = false;

  // Event handler for joining a room
  function joinRoom(event: CustomEvent<string>) {
    if (event.detail.trim() === "") return;
    room = event.detail;
    socket.emit("join-room", event.detail);
  }

  // Event handler for leaving the current room
  function leaveRoom(event: CustomEvent<string>) {
    socket.emit("leave-room", event.detail);
    room = "";
    playerColor = undefined;
    secretWord.Text = "";
    joinedRoom = false;
  }

  function handleMouseDown(event) {
    if (!canvas) return;
    const { offsetX, offsetY } = event;
    drawing = true;

    socket.emit("draw", {
      type: "start",
      x: offsetX,
      y: offsetY,
      room,
      color: playerColor,
    });
  }

  function handleMouseMove(event) {
    if (!canvas) return;
    if (!drawing) return;
    const { offsetX, offsetY } = event;

    socket.emit("draw", {
      type: "move",
      x: offsetX,
      y: offsetY,
      room,
      color: playerColor,
    });
  }

  function handleMouseUp(event) {
    if (!canvas) return;
    drawing = false;
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
      joinedRoom = true;
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
  <GameRoomControls {joinedRoom} {room} on:join-room={joinRoom} on:leave-room={leaveRoom} />
  {#if joinedRoom}
    {#if secretWord.Text}
      The category is {secretWord.Category} and the word is {secretWord.Text}
    {/if}
    <GameCanvas {playerColor} {room} on:canvasChange={handleCanvasEvent} />
  {/if}
</div>
