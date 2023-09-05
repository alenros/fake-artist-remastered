<script lang="ts">
    import { createEventDispatcher } from "svelte";
    
    export let room: string;
    export let joinedRoom: boolean;
    export let playerId: string;

    const createRoomDispatcher = createEventDispatcher();
    const joinRoomDispatcher = createEventDispatcher();
    const leaveRoomDispatcher = createEventDispatcher();

    function joinRoom() {
        if (room.trim() === "") return;        
        joinRoomDispatcher("join-room", {roomId: room,playerId: playerId});
    }

    function leaveRoom() {
        leaveRoomDispatcher("leave-room", {room, playerId});
    }

    function createRoom() {
        if(playerId.trim() === "") return;
        createRoomDispatcher("create-room", playerId);
    }
</script>
<form>
    {#if !joinedRoom}
    <div>
        <p>
            <button type="button" on:click={createRoom}>Create Room</button>
        </p>
        <p>
            <label for="room">Room Number:</label>
            <input
                type="text"
                id="room"
                bind:value={room}
                readonly={joinedRoom}
            />
        <button type="button" on:click={joinRoom}>Join Room</button>
        </p>
    </div>
    {/if}
    {#if joinedRoom}
        <button type="button" on:click={leaveRoom}>Leave Room</button>
    {/if}
</form>

<style>

</style>