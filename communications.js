// Send a client decided change to the server
function sendChange(event) {
    var currentTimestamp = player.getCurrentTime(); // Seconds into the video, e.g 60s
    var playbackSpeed = player.getPlaybackRate(); // Playback rate, e.g 1.0 or 2.0
    console.log(event)

    if (event === YT.PlayerState.PLAYING) {
        // Play
    }
    if (event === YT.PlayerState.PAUSED) {
        // Pause
    }
    if (event === YT.PlayerState.BUFFERING) {
        // Buffer
    }
}

// Websockets
const connection = new WebSocket("ws://localhost:3500");

connection.onmessage = function (msg) {
    console.log(JSON.parse(msg.data));
}

const send = (data) => connection.send(JSON.stringify(data));