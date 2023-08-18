<script lang="ts">
  import { onMount } from "svelte";
  export let playerColor: string;

  const canvasId = "game-canvas";
  let canvas;
  let ctx: CanvasRenderingContext2D;
  let lastX = 0;
  let lastY = 0;
  let isDrawing = false;
  const canvasBackgroundColor = "#FFF";

  let brushSize = 2;
  let brushColor = "#000000";
  let isErasing = false;

  onMount(() => {
    canvas = document.getElementById(canvasId);
    ctx = canvas.getContext("2d");

    window.addEventListener("mouseup", () => {
      handleMouseUp();
    });
  });

  // Draw a dot on the canvas
  function drawDot(x: number, y: number) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = !isErasing ? playerColor : canvasBackgroundColor;
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
  }

  function handleMouseUp() {
    isDrawing = false;
  }
</script>

<div class="canvas-container">
  <canvas
    id={canvasId}
  style="border: 1px solid {playerColor};"
    on:mousedown={handleMouseDown}
    on:mousemove={handleMouseMove}
    on:mouseup={handleMouseUp}
    on:touchstart={handleMouseDown}
    on:touchmove={handleMouseMove}
    on:touchend={handleMouseUp}
  />
</div>

<style>
    .canvas-container{
        display: grid;
        padding: 1rem;
    }
  canvas {
    width: 100%;
    height: 100%;
    background: #fff;
    box-shadow: 0 0 0.5rem rgba(0, 0, 0, 0.8);
  }
</style>
