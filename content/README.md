# Intro to xAPI Video Experiences

## Purpose
This tutorial will allow you to see how to build and dispatch statements using 
[Youtube iframe API](https://developers.google.com/youtube/iframe_api_reference).
This tutorial shows you how to:
  1. include xAPI Youtube scripts in an HTML page,
  2. configure Youtube's iframe API,
  3. create and initialize content in a JAVASCRIPT file,
  4. send Youtube statements to the LRS.

## Step 1 - Include xAPI Youtube scripts in index.html
First add a `<script>` tag in the `<body>` of `index.html` to include necessary scripts.

  ``` html
  ...
      <script type="text/javascript" src="lib/videoprofile.js"></script>
      <script type="text/javascript" src="lib/xapi-youtube-statements.js"></script>
  ...
  ```

## Step 2 - Configuring Youtube's iframe API
Next we need to configure the iframe API. This will be done inside the `<body>` of our `index.html`.

  1. Create a `video` object and initialize it to the video ID you wish to use.
  ``` javascript
  ...
    <script>

      var video = "tlBbt5niQto"; // Change this to your video ID
  ...
  ```

  2. Next we need to assign our global variables by calling `ADL.XAPIYoutubeStatements.changeConfig`. Set the `actor` properties to default values and the `videoActivity` properties to the concatenated `id` and `definition` objects made with our `video` variable.
  ``` javascript
  ...
      // "global" variables read by ADL.XAPIYoutubeStatements
      ADL.XAPIYoutubeStatements.changeConfig({
        "actor":  {"mbox":"mailto:anon@example.com", "name":"anonymous"},
        "videoActivity": {"id":"https://www.youtube.com/watch?v=" + video, "definition":{"name": {"en-US":video}} }
      });
  ...
  ```

  3. Add an `initYT` function next. This function will create a new `<script>` tag, initialize it's `src` attribute to include the [iframe API](https://www.youtube.com/iframe_api) script, and insert it above all the current `<script>` tags.
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

  4. Create a `player` object and a new function called `onYoutubeIframeAPIReady` right below it. Then initialize our `player` to a new instance of the Youtube Player. Here you can specify the iframe's `id`, `height`, `width`, `src`, `options`, and `event` parameters. Once you have your newly created `player`, call the `initYT` function to create and insert the `<iframe>` tag.
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

  5. Create a `conf` object storing our `endpoint` and `auth` properties. Call `ADL.XAPIWrapper.changeConfig` passing in your `conf` object to successfully configure the [xAPI Wrapper](https://github.com/adlnet/xAPIWrapper).
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
Once the xAPI Wrapper is configured, we need to initialize our `XAPIYoutubeStatements` object by defining our global variables, functions, and events.

  1. Create an `actor` initializing it to default values, and a `videoActivity` object.
  ``` javascript
  ...
    XAPIYoutubeStatements = function() {

      var actor = {"mbox":"mailto:anon@example.com", "name":"anonymous"};
      var videoActivity = {};      
  ...
  ```

  2. Create a `this.changeConfig` function that will set our `actor` and `videoActivity` objects. Make sure you specify `this` on the function name to allow global access.
  ``` javascript
  ...
      this.changeConfig = function(options) {
        actor = options.actor;
        videoActivity = options.videoActivity;
      }
  ...
  ```

  3. Add the `this.onPlayerReady` event next. This function will output a message to our `log` and attach our `exitVideo` function to the `window.onunload` event.
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

  4.  Next add the `this.onStateChange` event. Here we will get the video's current playing time, and parse it into a string for the statement's `extensions` property. You will then create a `stmt` object to send to the LRS. Make a switch statement for the `event.data` to determine the `player' object's current state. Look closely at `case 2:`. When you 'seek' or skip part of the video, `paused` and `played` statements would normally be sent to the LRS. Because you can't detect when the user 'seeked' directly, you will have to delay sending the `paused` statement by using `setTimeout` to wait 100 milliseconds before calling `pauseVideo`. Before you call `setTimeout`, get the current time(in milliseconds) with the `Date.now` function and store it in our `prevTime` object. After our `switch` statement, send the `stmt` to the LRS using `ADL.XAPIWrapper.sendStatement` if its valid.
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
Now that we have our events initialized, we need to create some helper functions and variables in order to properly send our statements.

  1. Start by creating 4 objects named `started`, `seeking`, `prevTime`, `completed`. These objects will help us determine the statement to send. `started` and `completed` are used for determining when we started or completed the video. `seeked` is used for skipping sections of the video. `prevTime` is used for calculating the elapsed time between function calls.
  ``` javascript
  ...
      var started = false;
      var seeking = false;
      var prevTime = 0.0;
      var completed = false;
  ...
  ```

  2. Create a function called `buildStatement` just below our `onStateChange` event. This function will create a new `stmt` object for the current `actor` and `videoActivity`. It will then return the final built statement or `null`.
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

  3. Add a `log` function at the very top of our script just above `XAPIYoutubeStatements` function body. This will be used for outputing data sent to the LRS from our app.
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

    XAPIYoutubeStatements = function() {
  ...
  ```

## Step 5 - Sending statements
Next we need to create some functions that will handle sending the statements to the LRS. The functions 
`initializeVideo`, `playVideo`, `pauseVideo`, and `completeVideo` are called from our `onStateChange` event.
Other functions such as `seekVideo` and `exitVideo` will be called elsewhere.

  1. Create a function called `initializeVideo` after our helper functions. Then create a `stmt` object and set its `verb` properties to that of an 'initialized' statement and return the final built statement.
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

  2. Create a `playVideo` function. This is where we calculate elapsed times between statements. Create your `stmt` object. Since the `paused` and `played` statements are sent so quickly when `seeked`, you have to calculate the time it took to reach this function from the `pauseVideo` function. Since we already stored the current time in our `prevTime` object before `pauseVideo` was called, we can subtract `prevTime` from `Date.now` to get the elapsed time. Be aware that this is stored in milliseconds, so you will have to `/1000.0` to get actual seconds. If the video is starting for the first time or the `elapTime` is more than 0.3 seconds, set the `stmt` object's `verb` properties to that of an 'played' statement and return the final built statement. Make sure to set the `started` boolean to true if the user started the video. Otherwise, we are in a `seeked` state. Before calling the `seekVideo` function, we need to set our `seeking` boolean to true. Remember, if we are `seeked`, the `pauseVideo` function call was delayed. Setting this value to true before the `pauseVideo` delay expires will stop the `paused` statement from being sent.
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

  3. Create a function named `pauseVideo`. Create the `stmt` object. The video will `pause` under 2 conditions: clicking the video window or pause button, skipping or rewinding the video. When you `seek`, the video will quickly be paused and played at the new time. Delaying this function call gives the computer a chance to determine if the user `paused` or `seeked` before sending any statements. If the user is NOT `seeking`, set the `stmt` object's `verb` properties to that of an 'paused' statement. Since this function is delayed, you will have to call `ADL.XAPIWrapper.sendStatement` to send the statement to the LRS. If the user is `seeked`, reset the `seeking` boolean for future use.
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

  4. Add a `completeVideo` function for sending a `completed` statement. This statement will ONLY send the first time the video is completed. After checking the `completed` boolean, create a `stmt` object and set its `verb` properties to that of an `completed` statement and return the final built statement. Make sure the `completed` object is set to true to avoid sending this statement again.
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

  5. Create a `exitVideo` function. In our `onPlayerReady` function, we attach this function to the `window.onunload` event. This function will get called when the user leaves the current page. We only want to send a statement if our video was `started`. Create a `stmt` object. If the video was completed, set its `verb` properties to that of a `terminated` statement. If it was not completed, then set its `verb` properties to that of an `abandoned` statement. Since this function is called from outside `XAPIYoutubeStatements`, you will have to call `ADL.XAPIWrapper.sendStatement` to send the statement to the LRS. Otherwise statements from the next page will be sent before this one.
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

  6. Finally, create a function called `seekVideo`. This statement is sent when the user decides to skip or rewind part of the video. This function will only be called from inside the `playVideo` function. Create a `stmt` object and set its `verb` properties to that of an `seeked` statement and return the final built statement.
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
The app should report your statements to the [ADL LRS](http://adlnet.github.io/xapi-statement-viewer/).