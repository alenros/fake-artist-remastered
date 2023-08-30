<script lang="ts">
  import { onMount, createEventDispatcher, onDestroy } from "svelte";
  import type { DrawEventType } from "../models/draw-event-model";
  import { playerDrawings } from "../stores/drawing-stores";

  export let playerColor: string;
  export let room: string;

  const canvasId = "game-canvas";
  let canvas;
  let ctx: CanvasRenderingContext2D;
  let lastX = 0;
  let lastY = 0;
  let isDrawing = false;
  const canvasBackgroundColor = "#FFF";
  let lastRX = 0;
  let lastRY = 0;
  let brushSize = 2;
  let isErasing = false;
  const drawingSubscriptions = playerDrawings.subscribe((drawing) => {
    if (ctx) {
      if (drawing && drawing.room === room) {
        if (drawing.type === "start") {
          drawDot(drawing.x, drawing.y, drawing.color);
          lastRX = drawing.x;
          lastRY = drawing.y;
        } else {
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(lastRX, lastRY);
          ctx.lineTo(drawing.x, drawing.y);
          ctx.strokeStyle = drawing.color;
          ctx.lineWidth = brushSize;
          ctx.stroke();
          lastRX = drawing.x;
          lastRY = drawing.y;
        }
      }
    }
  });

  const onCanvasChange = createEventDispatcher();

  // Emit the canvas image data when the canvas changes
  function emitCanvasChange(drawActiontype: DrawEventType) {
    if (!ctx) return;

    // might need to change this to a different type later
    onCanvasChange("canvasChange", {
      type: drawActiontype,
      x: lastX,
      y: lastY,
      room,
      color: playerColor,
    });
  }

  // On mount, set up the canvas and listeners
  onMount(() => {
    ctx = canvas.getContext("2d");

    window.addEventListener("mouseup", () => {
      handleMouseUp();
    });
  });

  onDestroy(drawingSubscriptions);

  // Draw a dot on the canvas
  function drawDot(x: number, y: number, brushColor: string = playerColor) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = !isErasing ? brushColor : canvasBackgroundColor;
    ctx.fill();
  }

  // Get the canvas coordinates from the mouse or touch event
  function GetCanvasXY(event: MouseEvent | TouchEvent) {
    let clientX;
    let clientY;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      // Assume it's a TouchEvent
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    const canvasX = (clientX - rect.left) * scaleX;
    const canvasY = (clientY - rect.top) * scaleY;
    return { canvasX, canvasY };
  }

  function handleMouseDown(event: MouseEvent | TouchEvent) {
    if (ctx) {
      event.preventDefault();
      const { canvasX, canvasY } = GetCanvasXY(event);
      isDrawing = true;
      [lastX, lastY] = [canvasX, canvasY];

      drawDot(canvasX, canvasY);
      emitCanvasChange("start");
    }
  }

  function handleMouseMove(event: MouseEvent | TouchEvent) {
    if (!isDrawing || !ctx) return;
    event.preventDefault();
    const { canvasX, canvasY } = GetCanvasXY(event);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(canvasX, canvasY);
    ctx.strokeStyle = !isErasing ? playerColor : canvasBackgroundColor;
    ctx.lineWidth = brushSize;
    ctx.stroke();
    [lastX, lastY] = [canvasX, canvasY];
    emitCanvasChange("move");
  }

  function handleMouseUp() {
    isDrawing = false;
  }
</script>

<canvas
  id={canvasId}
  bind:this={canvas}
  style="border: 1px solid {playerColor};"
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
  on:touchstart={handleMouseDown}
  on:touchmove={handleMouseMove}
  on:touchend={handleMouseUp}
/>

<style>
  canvas {
    width: 100%;
    height: 100%;
    background: #fff;
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.3);
    border-radius: 0.25rem;
  }
</style>
