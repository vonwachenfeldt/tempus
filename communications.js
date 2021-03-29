
// Websockets
class Connection {
    //wss://tempus.cloudno.de/ws
    constructor(url) {
        this.clientId = null;
        this.sessionId = null;

        this.ignoreEventChange = false;

        this.url = url;
        this.conn = new WebSocket(url);
        this.conn.onopen = this.handleConnected.bind(this);

        // Receiving message
        this.conn.onmessage = this.handleMessage.bind(this);
    }

    send(data) {
        if (data.type != "pong")
            console.log("Sending message", data.type);

        console.log(data)

        this.conn.send(JSON.stringify(data));
    }

    // Send a client decided change to the server
    sendChange(event) {
        if (this.ignoreEventChange) return;

        if (event === YT.PlayerState.PLAYING) {
            console.log("Playing");
            updateTitle(`Playing: ${player.getVideoData().title}`)

            this.send({
                type: "state-update",
                data: getVideoData(),
                date: Date.now()
            });
        }
        if (event === YT.PlayerState.PAUSED) {
            console.log("Paused");
            updateTitle(`Paused: ${player.getVideoData().title}`)

            this.send({
                type: "state-update",
                data: getVideoData(),
                date: Date.now()
            });
        }
        if (event === YT.PlayerState.ENDED) {
            console.log("Video ended");


            // Try to play the next video in the queue (use the queue on the server to avoid desync)
            this.send({
                type: "play-next-video",
                date: Date.now()
            });
        }
        if (event === YT.PlayerState.CUED) {
            console.log("Que:ed");
        }
    }

    handleConnected() {
        console.log("Connected to", this.url);

        console.log(this)

        this.send({
            type: "join-session",
            data: { sessionId: window.location.hash.slice(1) }
        });
    }

    handleMessage(msg) {
        var message = JSON.parse(msg.data);

        if (message.type != "ping") console.log("Recieved message", message);

        switch (message.type) {
            case "join-session": {
                if (!message.success) return console.log("Failed to join session");

                this.sessionId = message.data.sessionId;
                this.clientId = message.data.clientId;
                updateHash(message.data.sessionId);

                // Set video state
                if (message.data.state.timestamp != 0)
                    player.seekTo(message.data.state.timestamp + 0.5, true);

                // Playback speed
                player.setPlaybackRate(message.data.state.playbackSpeed);

                // Set paused or played
                if (message.data.state.isPaused)
                    player.pauseVideo();
                else
                    player.playVideo();

                console.log("Joined session:", this.sessionId);

                break;
            }
            case "ping": {
                this.send({ type: "pong" });

                break;
            }
            case "state-update": {
                if (!message.success)
                    return console.log("state-update failed");

                this.ignoreEventChange = true;
                setTimeout(() => this.ignoreEventChange = false, 100);

                // Check if the message was sent by me
                if (message.originalMessage.sentBy == this.clientId)
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
            case "play-next-video": {

                player.loadVideoById(message.data.video.videoId);

                break;
            }
            case "queue-video": {

                // Get the last element
                const newQueueEntry = message.data.queue[message.data.queue.length - 1];

                var toAdd = "";
                if (newQueueEntry.duration < 1) // Duration is less than one minute 
                    toAdd = `<div data-id=${message.data.id} class="video-div"><p class="video">${newQueueEntry.title} by ${newQueueEntry.channel} (${Math.round(newQueueEntry.duration * 60)} seconds)<span class="video-title">${newQueueEntry.url}</span></p><button onclick="deleteVideo(${message.data.id})" class="del-video">🗑️</button></div>`;
                else
                    toAdd = `<div data-id=${message.data.id} class="video-div"><p class="video">${newQueueEntry.title} by ${newQueueEntry.channel} (${Math.round(newQueueEntry.duration)} minutes)<span class="video-title">${newQueueEntry.url}</span></p><button onclick="deleteVideo(${message.data.id})" class="del-video">🗑️</button></div>`;

                document.getElementById('queue').innerHTML += toAdd;
                document.getElementById('addVid').value = "";

                break;
            }
            case "delete-video": {
                break;
            }
            case "get-video-metadata": {
                if (!message.success) return console.log(message.error);

                var toAdd = "";
                if (message.data.duration < 1) // Duration is less than one minute 
                    toAdd = `<div data-id=${message.data.id} class="video-div"><p class="video">${message.data.title} by ${message.data.channel} (${Math.round(message.data.duration * 60)} seconds)<span class="video-title">${message.data.url}</span></p><button onclick="deleteVideo(${message.data.id})" class="del-video">🗑️</button></div>`;
                else
                    toAdd = `<div data-id=${message.data.id} class="video-div"><p class="video">${message.data.title} by ${message.data.channel} (${Math.round(message.data.duration)} minutes)<span class="video-title">${message.data.url}</span></p><button onclick="deleteVideo(${message.data.id})" class="del-video">🗑️</button></div>`;

                document.getElementById('queue').innerHTML += toAdd;
                document.getElementById('addVid').value = "";

                break;
            }
            case "broadcast-clients": {
                if (!message.success) return console.log(message.error);
                displayWatchers(message.data.watchers);
                break;
            }
            default: {
                console.log("Other message:", message.type);
                break;
            }
        }
    }
}