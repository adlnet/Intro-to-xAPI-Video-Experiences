# Sending statements with xAPI-Youtube

## Purpose
This small tutorial will allow you to see how to build and dispatch statements using 
[Youtube's iframe API](https://developers.google.com/youtube/iframe_api_reference). These 
statements can be dispatched to an LRS with xapiwrapper.min.js using a custom ADL.XAPIYoutubeStatements.onStateChangeCallback function.
This tutorial shows you how to:
  1. include xAPI Youtube scripts in an HTML page,
  2. configure Youtube's iframe API,
  3. create and initialize content in a JAVASCRIPT file,
  4. send Youtube statements to the LRS.

## Step 1 - Include xAPI Youtube scripts in index.html
Add a `<script>` tag in the `<body>` of `index.html` to include necessary scripts.
  ``` html
  ...
      <script type="text/javascript" src="lib/xapiwrapper.min.js"></script>
      <script type="text/javascript" src="lib/videoprofile.js"></script>
      <script type="text/javascript" src="lib/xapi-youtube-statements.js"></script>
  ...
  ```

## Step 2 - Configuring Youtube's iframe API


  1. 
  ``` javascript
  ...
    <script>

      var video = "tlBbt5niQto"; // Change this to your video ID
  ...
  ```

  2. 
  ``` javascript
  ...
      // "global" variables read by ADL.XAPIYoutubeStatements
      ADL.XAPIYoutubeStatements.changeConfig({
        "actor":  {"mbox":"mailto:anon@example.com", "name":"anonymous"},
        "videoActivity": {"id":"https://www.youtube.com/watch?v=" + video, "definition":{"name": {"en-US":video}} }
      });
  ...
  ```

  3. 
  ``` javascript
  ...
      function initYT() {
        var tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
  ...
  ```

  4. 
  ``` javascript
  ...
      var player;
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          height: '390',
          width: '640',
          videoId: video,
          playerVars: { 'autoplay': 0 },
          events: {
            'onReady': ADL.XAPIYoutubeStatements.onPlayerReady,
            'onStateChange': ADL.XAPIYoutubeStatements.onStateChange
          }
        });
      }

      initYT();
  ...
  ```

  5. 
  ``` javascript
  ...
      // Auth for the LRS
      var conf = {
        "endpoint" : "https://lrs.adlnet.gov/xapi/",
        "auth" : "Basic " + toBase64("xapi-tools:xapi-tools"),
      };

      ADL.XAPIWrapper.changeConfig(conf);
  ...
  ```

## Step 3 - Initializing content in xapi-youtube-statements.js

  1. 
  ``` javascript
  ...
    XAPIYoutubeStatements = function() {

      var actor = {"mbox":"mailto:anon@example.com", "name":"anonymous"};
      var videoActivity = {};      
  ...
  ```

  2. 
  ``` javascript
  ...
      this.changeConfig = function(options) {
        actor = options.actor;
        videoActivity = options.videoActivity;
      }
  ...
  ```

  3. 
  ``` javascript
  ...
      this.onPlayerReady = function(event) {
        var message = "yt: player ready";
        log(message);
        ADL.XAPIYoutubeStatements.onPlayerReadyCallback(message);
        window.onunload = exitVideo;
      }
  ...
  ```

  4. 
  ``` javascript
  ...
      this.onStateChange = function(event) {
        var curTime = player.getCurrentTime().toString();
        var ISOTime = "PT" + curTime.slice(0, curTime.indexOf(".")+3) + "S";
        var stmt = null;
        var e = "";
        switch(event.data) {
          case -1:
            e = "unstarted";
            log("yt: " + e);
            stmt = initializeVideo(ISOTime);
            break;
          case 0:
            e = "ended";
            log("yt: " + e);
            stmt = completeVideo(ISOTime);
            break;
          case 1:
            e = "playing";
            stmt = playVideo(ISOTime);
            break;
          case 2:
            e = "paused";
            prevTime = Date.now();
            setTimeout(function() {pauseVideo(ISOTime);}, 100);
            break;
          case 3:
            e = "buffering";
            log("yt: " + e);
            break;
          case 5:
            e = "cued";
            log("yt: " + e);
            break;
          default:
        }
        if (stmt){
          ADL.XAPIWrapper.sendStatement(stmt);
        }
      }
  ...
  ```

## Step 4 - Adding helper functions & variables

  1. 
  ``` javascript
  ...
      var started = false;
      var seeking = false;
      var prevTime = 0.0;
      var completed = false;
  ...
  ```

  2. 
  ``` javascript
  ...
      function buildStatement(stmt) {
        if (stmt){
          var stmt = stmt;
          stmt.actor = actor;
          stmt.object = videoActivity;
        }
        return stmt;
      }
  ...
  ```

  3. 
  ``` javascript
  ...
    var debug = true;
    var log = function(message)
    {
      if (!debug) return false;
      try
      {
        console.log(message);
        return true;
      }
      catch(e) { return false; }
    }
  ...
  ```

  4. 
  ``` javascript
  ...
      var convertISOSecondsToNumber = function(time) { return Number(time.slice(2, -1)); };
  ...
  ```

## Step 5 - Sending statements

  1. 
  ``` javascript
  ...
      function initializeVideo(ISOTime) {
        var stmt = {};

        stmt.verb = {
          id: ADL.videoprofile.references.initialized['@id'],
          display: {"en-US": "initialized"}
        };

        return buildStatement(stmt);
      }
  ...
  ```

  2. 
  ``` javascript
  ...
      function playVideo(ISOTime) {
        var stmt = {};

        // calculate time from paused state
        var elapTime = (Date.now() - prevTime) / 1000.0;

        if (!started || elapTime > 0.3) {
          log("yt: playing");
          stmt.verb = {
            id: ADL.videoprofile.verbs.played['@id'],
            display: ADL.videoprofile.verbs.played.prefLabel
          };
          stmt.result = {"extensions":{"resultExt:resumed":ISOTime}};
          started = true;
        }
        else {
          log("yt: seeking");
          seeking = true;
          return seekVideo(ISOTime);
        }

        return buildStatement(stmt);
      }
  ...
  ```

  3. 
  ``` javascript
  ...
      function pauseVideo(ISOTime) {
        var stmt = {};

        // check for seeking
        if (!seeking) {
          log("yt: paused");
          stmt.verb = {
            id: ADL.videoprofile.verbs.paused['@id'],
            display: ADL.videoprofile.verbs.paused.prefLabel
          };
          stmt.result = {"extensions":{"resultExt:paused":ISOTime}};

          // manually send 'paused' statement because of interval delay
          ADL.XAPIWrapper.sendStatement(buildStatement(stmt));
        }
        else {
          seeking = false;
        }
      }
  ...
  ```

  4. 
  ``` javascript
  ...
      function completeVideo(ISOTime) {
        if (completed) {
          return null;
        }

        var stmt = {};

        stmt.verb = {
          id: ADL.videoprofile.references.completed['@id'],
          display: {"en-US": "completed"}
        }
        stmt.result = {"duration":ISOTime, "completion": true};
        completed = true;
      
        return buildStatement(stmt);
      }
  ...
  ```

  5. 
  ``` javascript
  ...
      function exitVideo() {
        if (!started) {
          return;
        }

        var stmt = {};
        var e = "";

        // 'terminated' statement for completed video
        if (completed) {
          e = "terminated";
          stmt.verb = {
            id: ADL.videoprofile.references.terminated['@id'],
            display: { "en-US": "terminated" }
          };
          // 'abandoned' statement for incomplete video
        } else {
          e = "abandoned";
          stmt.verb = {
            id: ADL.videoprofile.references.abandoned['@id'],
            display: { "en-US": "abandoned" }
          };
        }

        // send statement immediately to avoid event delay
        ADL.XAPIWrapper.sendStatement(buildStatement(stmt));
      }
  ...
  ```

  6. 
  ``` javascript
  ...
      function seekVideo(ISOTime) {
        var stmt = {};

        stmt.verb = {
          id: ADL.videoprofile.verbs.seeked['@id'],
          display: ADL.videoprofile.verbs.seeked.prefLabel
        }
        stmt.result = {"extensions":{"resultExt:seeked":ISOTime}};

        return buildStatement(stmt);
      }
  ...
  ```

## Step 6 - Try the app
Host the github project files on your server. Launch `index.html`. 
The app should report your statements to the ADL LRS [view here](http://adlnet.github.io/xapi-statement-viewer/).