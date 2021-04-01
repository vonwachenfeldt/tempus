var serverUrl = window.location.port ? "ws://localhost:8080/tempus" : "wss://ludvig.cloudno.de/tempus";

var connection = new Connection(serverUrl);
var player;

var youtubeIframeReady = false;
var youtubeIgnoreEventChange = true;

function createYoutubeIframe() {
    if (!connection.sessionState.currentVideoId) return;
    if (youtubeIframeReady) return; // Don't create duplicate iframes

    var tag = document.createElement('script');

    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('player', {
        height: '390',
        width: '640',
        videoId: connection.sessionState.currentVideoId,
        playerVars: {
            'autoplay': 0,
            'origin': "https://tempus-luddet.vercel.app",
            "rel": 0,
            "modestbranding": 1,
            'sandbox': "allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation"
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function onPlayerReady() {
    youtubeIframeReady = true;

    youtubeIgnoreEventChange = true;
    setTimeout(() => youtubeIgnoreEventChange = false, 100);

    // Set video state
    if (connection.sessionState.timestamp != 0)
        player.seekTo(connection.sessionState.timestamp, true);

    // Playback speed
    player.setPlaybackRate(connection.sessionState.playbackSpeed);

    // Set paused or played
    if (connection.sessionState.isPaused)
        player.pauseVideo();
    else
        player.playVideo();

    player.playVideo();
}

function onPlayerStateChange(event) {
    if (youtubeIgnoreEventChange) return;

    if (event.data === YT.PlayerState.PLAYING) {
        console.log("Playing");
        updateTitle(`Playing: ${player.getVideoData().title}`)

        connection.send({
            type: "state-update",
            data: getVideoData(),
            date: Date.now()
        });
    }
    if (event.data === YT.PlayerState.PAUSED) {
        console.log("Paused");
        updateTitle(`Paused: ${player.getVideoData().title}`)

        connection.send({
            type: "state-update",
            data: getVideoData(),
            date: Date.now()
        });
    }
    if (event.data === YT.PlayerState.ENDED) {
        console.log("Video ended");

        // Try to play the next video in the queue (use the queue on the server to avoid desync)
        connection.send({
            type: "play-next-video",
            date: Date.now()
        });
    }
    if (event.data === YT.PlayerState.CUED) {
        console.log("Que:ed");
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

const invite = str => {
    const el = document.createElement('textarea');
    el.value = str;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showSnack("Copied", 1000)
};

function showSnack(message, ms) {
    var snack = document.getElementById("snackbar");

    snack.className = "show";
    snack.textContent = message;

    setTimeout(function () { snack.className = snack.className.replace("show", ""); }, ms);
}

function queueVideo(event, url) {
    event.preventDefault();
    connection.send({ type: "queue-video", data: { url } });
}

function updateHash(room) {
    window.location.hash = room;
}

function displayWatchers(amount) {
    switch (amount) {
        case 1: {
            document.getElementById("watching").textContent = `You're watching by yourself.`
            break;
        }
        default: {
            document.getElementById("watching").textContent = `${amount} people watching.`
            break;
        }
    }
}

function showInputfield(inputSwitch) { // true = join a room with id, false = create a room with id
    document.getElementById("input-div").style.visibility = "visible";
    if (inputSwitch == true) {
        document.getElementById('type-title').textContent = "Join a session"
    } else if (inputSwitch == false) {
        document.getElementById('type-title').textContent = "Create a session"
    }
}

function attemptTojoinSession(event) {
    event.preventDefault();
    console.log(`session.html#${document.getElementById('session-input').value}`);
    window.location = (`${window.location.origin}/session.html#${document.getElementById('session-input').value}`);
}

function updateTitle(title) {
    document.title = `${title}`;
}

function deleteVideo(id) {
    connection.send({type: "delete-queue-entry", data: {id: id}});
}