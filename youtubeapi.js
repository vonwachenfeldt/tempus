// 1. This code loads the IFrame Player API code asynchronously.
var tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

function onPlayerStateChange(event) {

  // function found in communications.js
  sendChange(event.data);
}

// 2. This function creates an <iframe> (and YouTube player)
//    after the API code downloads.
var player;
function onYouTubeIframeAPIReady() {
  player = new YT.Player('player', {
    height: '390',
    width: '640',
    videoId: 'j5v8D-alAKE',
    playerVars: {
      'autoplay': 0,
      //'origin': "https://tempus-luddet.vercel.app",
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

// 3. The API will call this function when the video player is ready.
function onPlayerReady(event) {
  event.target.stopVideo();
}

var done = false;

function stopVideo() {
  player.stopVideo();
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