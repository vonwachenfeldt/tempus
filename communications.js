// Send a client decided change to the server
function sendChange(event) {
    console.log(event);
    if(event === 1) {
        // Play
    }
    if(event === 2) {
        // Pause
    }
    if(event === 3) {
        // Buffer
        var currentTimestamp = player.getCurrentTime();
    }
}