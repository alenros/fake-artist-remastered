<script lang="ts">
    import { createEventDispatcher } from "svelte";
    
    export let room: string;
    export let joinedRoom: boolean;

    const joinRoomDispatcher = createEventDispatcher();
    const leaveRoomDispatcher = createEventDispatcher();


    function joinRoom(){
        if (room.trim() === "") return;        

        joinRoomDispatcher("join-room", room);
    }

    function leaveRoom(){
        leaveRoomDispatcher("leave-room", room);
    }

</script>

<form>
    <label for="room">Room:</label>
    <input type="text" id="room" bind:value={room} readonly={joinedRoom} />
    {#if !joinedRoom}
        <button type="button" on:click={joinRoom}>Join Room</button>
    {/if}
    {#if joinedRoom}
        <button type="button" on:click={leaveRoom}>Leave Room</button>
    {/if}
</form>

<style>

</style>