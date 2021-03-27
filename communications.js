// Send a client decided change to the server
function sendChange(event) {
    console.log(event);
    if (event === YT.PlayerState.PLAYING) {
        // Play
    }
    if (event === YT.PlayerState.PAUSED) {
        // Pause
    }
    if (event === YT.PlayerState.BUFFERING) {
        // Buffer
        var currentTimestamp = player.getCurrentTime();
    }
}