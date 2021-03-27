// Send a client decided change to the server
var ignoreEventChange = false;

var myClientId;
var sessionId;
var lastSentStateUpdateData = 0;
function sendChange(event) {
    if (ignoreEventChange) return;

    if (event === YT.PlayerState.PLAYING) {
        console.log("Playing");

        lastSentStateUpdateData = Date.now();

        send({
            type: "state-update",
            data: getVideoData(),
            date: Date.now()
        });
    }
    if (event === YT.PlayerState.PAUSED) {
        console.log("Paused");

        lastSentStateUpdateData = Date.now();

        send({
            type: "state-update",
            data: getVideoData(),
            date: Date.now()
        });
    }
    if (event === YT.PlayerState.BUFFERING) {
        console.log("Buffering");

        lastSentStateUpdateData = Date.now();

        send({
            type: "state-update",
            data: getVideoData(),
            date: Date.now()
        });
    }
    if (event === YT.PlayerState.CUED) {
        console.log("Que:ed");
    }
}

// Websockets
const connection = new WebSocket("ws://localhost:3500");
connection.onopen = function () {
    console.log("connected");
    send({ type: "join-session", data: { sessionId: window.location.hash.slice(1) } })
}

// Receiving message
connection.onmessage = function (msg) {
    var message = JSON.parse(msg.data);
    console.log("Recieved message", message);
    switch (message.type) {
        case "join-session": {
            if (!message.success) return console.log("Failed to join session");
            
            sessionId = message.data.sessionId;
            myClientId = message.data.clientId;

            console.log("Joined session: ", sessionId);
            
            break;
        }
        case "ping": {
            send({ type: "pong" });
            break;
        }
        case "state-update": {

            if (!message.success)
                return console.log("state-update failed");

            ignoreEventChange = true;
            setTimeout(() => ignoreEventChange = false, 5000);

            // If the latest message that I sent is more recent than the one I received
            if (lastSentStateUpdateData > message.date)
                return console.log("Ignoring message. A newer state update exists");

            // Check if the message was sent by me
            // if (message.originalMessage.sentBy == myClientId)
            //     return console.log("Ignoring state-update");

            // Set timestamp
            player.seekTo(message.data.timestamp, true);

            // Playback speed
            player.setPlaybackRate(message.data.playbackSpeed);

            // Set paused or played
            if (message.data.isPaused)
                player.pauseVideo();
            else
                player.playVideo();

            break;
        }
        case "play-video": {
            break;
        }
        case "queue-video": {
            break;
        }
        default: {
            console.log("Other message:", message.type);
            break;
        }
    }
}

function getVideoData() {
    var currentTimestamp = player.getCurrentTime(); // Seconds into the video, e.g 60s
    var playbackSpeed = player.getPlaybackRate(); // Playback rate, e.g 1.0 or 2.0
    var videoId = player.getVideoData()['video_id'];
    var isPaused = (player.getPlayerState() == YT.PlayerState.PAUSED);
    if (player.getPlayerState() == YT.PlayerState.PLAYING) {
        isPaused = false;
    }
    return {
        timestamp: currentTimestamp,
        playbackSpeed: playbackSpeed,
        isPaused: isPaused,
        currentVideoId: videoId
    };
}

const send = (data) => connection.send(JSON.stringify(data));