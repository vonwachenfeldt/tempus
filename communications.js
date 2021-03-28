var myClientId;
var sessionId;

const send = (data) => {
    if (data.type != "pong")
        console.log("Sending message", data.type);

    connection.send(JSON.stringify(data));
}

// Send a client decided change to the server
var ignoreEventChange = false;
function sendChange(event) {
    if (ignoreEventChange) return;

    if (event === YT.PlayerState.PLAYING) {
        console.log("Playing");

        send({
            type: "state-update",
            data: getVideoData(),
            date: Date.now()
        });
    }
    if (event === YT.PlayerState.PAUSED) {
        console.log("Paused");

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
const connection = new WebSocket("wss://tempus.cloudno.de/ws");
connection.onopen = function () {
    console.log("connected");
    send({ type: "join-session", data: { sessionId: window.location.hash.slice(1) } })
}

// Receiving message
connection.onmessage = function (msg) {
    var message = JSON.parse(msg.data);

    if (message.type != "ping") console.log("Recieved message", message);

    switch (message.type) {
        case "join-session": {
            if (!message.success) return console.log("Failed to join session");

            sessionId = message.data.sessionId;
            myClientId = message.data.clientId;
            updateHash(message.data.sessionId);

            console.log("Joined session:", sessionId);

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
            setTimeout(() => ignoreEventChange = false, 100);

            // Check if the message was sent by me
            if (message.originalMessage.sentBy == myClientId)
                return console.log("Received own message. Ignoring");
            
             // Set timestamp
            const timeDiff = Math.abs(player.getCurrentTime() - message.data.timestamp);
            const maxTimeDesync = 0.5; // in seconds

            if (timeDiff > maxTimeDesync)
                player.seekTo(message.data.timestamp + 0.5, true);

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
        case "get-video-metadata": {
            if(!message.success) return console.log(message.error);
            toAdd = `<p class="video">${message.data.title} by ${message.data.channel} (${message.data.duration} seconds long)<span class="video-title">${message.data.url}</span></p>`;
            document.getElementById('queue').innerHTML += toAdd;
            document.getElementById('addVid').value = "";
            break;
        }
        case "broadcast-clients": {
            if(!message.success) return console.log(message.error);
            displayWatchers(message.data);
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