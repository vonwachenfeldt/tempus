const addVideoToQueueHtml = (video) => {
    var title = video.title//(video.title.length > 50) ? video.title.slice(0, 50) + "..." : video.title;
    var channel = video.channel;//(video.channel.length > 20) ? video.channel.slice(0, 20) + "..." : video.channel
    var durationStr = video.duration < 1 ? (Math.round(video.duration * 60) + "s") : (Math.round(video.duration) + " min"); 
    var thumbnail = video.thumbnail.url;

    var toAdd = 
        `<div data-id=${video.id} class="video-div video">
            <!--<p class="video">-->
                <img class="thumbnail" src="${thumbnail}">
                <span class="overlay">${durationStr}</span>
                <div class="video-text-container">
                    <div>
                        <div class="queue-title line-clamp" onclick="playVideo('${video.id}')">${title}</div>
                        <div class="channel-name">${channel}</div>
                    </div>
                    <div class="video-button-container small">
                        <button class="mini-button" onclick="playVideo('${video.id}')">▶</button>
                        <button class="mini-button" onclick="deleteVideo('${video.id}')">🗑️</button>
                    </div>
                </div>
                <div class="video-button-container video-large">
                    <button class="mini-button" onclick="playVideo('${video.id}')">▶</button>
                    <button class="mini-button" onclick="deleteVideo('${video.id}')">🗑️</button>
                </div>
                <!--<br>
                <span class="channel-name">${channel}</span>
                <br>
                <button class="mini-button" onclick="playVideo('${video.id}')">▶</button>
                <button class="mini-button" onclick="deleteVideo('${video.id}')">🗑️</button>-->
            <!--</p>-->
        </div>`;

    document.getElementById('queue').innerHTML += toAdd;
    showSnack(`"${title}" added to queue`, 1000)
}

function showSnack(message, ms) {
    var snack = document.getElementById("snackbar");

    snack.className = "show";
    snack.textContent = message;

    setTimeout(function () { snack.className = snack.className.replace("show", ""); }, ms);
}