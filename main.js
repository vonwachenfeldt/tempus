function queueVideo(event, url) {
    event.preventDefault();
    send({type: "get-video-metadata", data: {url}});
}