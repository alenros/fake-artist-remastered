<script>
  import { onMount } from 'svelte';
  import io from 'socket.io-client';

  const socket = io('http://localhost:5000'); // Connect to the server

  let drawing = false;
  let context;

  onMount(() => {
    const canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');

    socket.on('draw', (data) => {
      drawOnCanvas(data);
    });
  });

  function handleMouseDown(event) {
    const { offsetX, offsetY } = event;
    drawing = true;

    socket.emit('draw', { type: 'start', x: offsetX, y: offsetY });
  }

  function handleMouseMove(event) {
    if (!drawing) return;
    const { offsetX, offsetY } = event;

    socket.emit('draw', { type: 'move', x: offsetX, y: offsetY });
  }

  function handleMouseUp(event) {
    drawing = false;
  }

  function drawOnCanvas(data) {
    const { type, x, y } = data;

    if (type === 'start') {
      context.beginPath();
      context.moveTo(x, y);
    } else if (type === 'move') {
      context.lineTo(x, y);
      context.stroke();
    }
  }
</script>

<canvas
  id="canvas"
  width="800"
  height="600"
  style="border: 1px solid black;"
  on:mousedown={handleMouseDown}
  on:mousemove={handleMouseMove}
  on:mouseup={handleMouseUp}
/>
