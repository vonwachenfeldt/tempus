
// Websockets

const defaultSessionState = {
    timestamp: 0,
    playbackSpeed: 1,
    isPaused: true,
    currentVideoId: "",
    queue: []
};

class Connection {
    constructor(url) {
        this.sessionState = {};

        this.isAdmin = false;
        this.sessionId = null;
        this.clientId = null;
        this.watchers = 0;

        this.url = url;
        this.conn = new WebSocket(url);
        this.conn.onopen = this.handleConnected.bind(this);

        // Receiving message
        this.conn.onmessage = this.handleMessage.bind(this);
    }

    send(data) {
        if (data.type != "pong")
            console.log("Sending message", data);

        this.conn.send(JSON.stringify(data));
    }

    handleConnected() {
        console.log("Connected to", this.url);

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
                this.isAdmin = message.data.isAdmin;
                updateHash(message.data.sessionId);

                // Load the youtube player
                this.sessionState = message.data.state;
                if (this.sessionState.queue.length > 0) createYoutubeIframe();

                // Set the queue
                this.sessionState.queue.forEach(video => addVideoToQueueHtml(video));

                console.log("Joined session:", this.sessionId);

                break;
            }
            case "ping": {
                this.send({ type: "pong" });

                break;
            }
            case "state-update": {
                if (!message.success) return console.log(message.error);

                youtubeIgnoreEventChange = true;
                setTimeout(() => youtubeIgnoreEventChange = false, 100);

                this.sessionState = message.data.state;

                if (!youtubeIframeReady)
                    return createYoutubeIframe();

                // Check if the message was sent by me
                if (this.sentByMe(message))
                    return;

                const video = this.getVideoToPlay();

                // Set timestamp
                const timeDiff = Math.abs(player.getCurrentTime() - video.timestamp);
                const maxTimeDesync = 0.5; // in seconds

                if (timeDiff > maxTimeDesync)
                    player.seekTo(video.timestamp + maxTimeDesync, true);

                // Playback speed
                player.setPlaybackRate(video.playbackSpeed);

                // Set paused or played
                if (video.isPaused)
                    player.pauseVideo();
                else
                    player.playVideo();

                break;
            }
            case "play-video-from-queue": {
                this.sessionState = message.data.state;
                const videoToPlay = this.sessionState.queue[this.sessionState.currentQueueIndex];

                if (!youtubeIframeReady)
                    createYoutubeIframe();
                else {
                    console.log(videoToPlay.timestamp)
                    player.loadVideoById(videoToPlay.id, videoToPlay.timestamp);
                    youtubeShouldSeekToStart = true;
                    // player.playVideo();

                    // youtubeIgnoreEventChange = true;
                    // setTimeout(() => youtubeIgnoreEventChange = false, 100);
    
                    //player.seekTo(videoToPlay.timestamp, false);
                    // Playback speed
                    //player.setPlaybackRate(videoToPlay.playbackSpeed);
    
                    // Set paused or played
                    // if (videoToPlay.isPaused)
                    //     player.pauseVideo();
                    // else
                        // player.playVideo();
                }

                break;
            }
            case "play-next-video": {
                if (!message.success) return console.log(message.error);

                this.sessionState = message.data.state;

                if (!youtubeIframeReady)
                    createYoutubeIframe();
                else
                    player.loadVideoById(this.getVideoToPlay().id);

                break;
            }
            case "add-video-to-queue": {
                if (!message.success) return console.log(message.error);

                // Get the last element
                const newQueueEntry = message.data.video;
                if (!newQueueEntry) return;

                this.sessionState.queue.push(newQueueEntry);

                if (document.body.contains(document.getElementById("queue-info"))) {
                    document.getElementById("queue-info").remove();
                }

                addVideoToQueueHtml(newQueueEntry);

                break;
            }
            case "delete-video-from-queue": {
                if (!message.success) return console.log(message.error);

                this.sessionState.queue = message.data.queue;

                console.log(message.data)
                document.getElementById('queue').removeChild(document.querySelector(`[data-id='${message.data.deleted}']`));

                console.log("This is the deleted id: " + message.data.deleted)
                console.log(getVideoData().currentVideoId)

                if(connection.sessionState.queue != "") {
                    if(message.data.deleted == getVideoData().currentVideoId) {
                        connection.send({
                            type: "play-video-from-queue",
                            data: { queueIndex: 0},
                            date: Date.now()
                        });
                    }
                }

                if(connection.sessionState.queue == "") {
                    document.getElementById('player').remove();
                    document.querySelector(`[class='player-container']`).innerHTML += `<div id="player"><h1 id="no-video">Please queue using the input above</h1></div>`;
                }

                break;
            }
            case "broadcast-clients": {
                if (!message.success) return console.log(message.error);

                this.watchers = message.data.watchers;

                displayWatchers(message.data.watchers);

                break;
            }
            default: {
                console.log("Other message:", message.type);
                break;
            }
        }
    }

    getVideoToPlay() {
        return this.sessionState.queue[this.sessionState.currentQueueIndex];
    }

    sentByMe(message) {
        return message.originalMessage.sentBy == this.clientId;
    }
}