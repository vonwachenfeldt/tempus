function queueVideo(url) {
    toAdd = `<p class="video">Here goes the video title!<span class="video-title">${url}</span></p>`;
    document.getElementById('queue').innerHTML += toAdd;
    document.getElementById('addVid').value = "";
}