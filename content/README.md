# Intro to xAPI Video Experiences

## Purpose
This tutorial will allow you to see how to build and dispatch statements using 
[Youtube iframe API](https://developers.google.com/youtube/iframe_api_reference).
This tutorial shows you how to:
  1. include xAPI Youtube scripts in an HTML page,
  2. include xAPI Wrapper in an HTML page,
  3. configure the xAPI Wrapper with the LRS and client credentials,
  4. configure Youtube's iframe API,
  5. create and initialize content in a JAVASCRIPT file,
  6. send Youtube statements to the LRS

  ## Step 1 - Include xAPI Youtube scripts in index.html
  First add a `<script>` tag in the `<body>` of `index.html` to include necessary scripts.

  ``` html
  ...
      <script type="text/javascript" src="lib/videoprofile.js"></script>
      <script type="text/javascript" src="lib/xapi-youtube-statements.js"></script>
  ...
  ```

  ## Step 2 - Include the xAPI Wrapper in reports.html
  The second step is to include the xAPI Wrapper file.

  ``` html
  ...
      <script type="text/javascript" src="lib/xapiwrapper.min.js"></script>
  ...
  ```

  ## Step 3 - Configure the xAPI Wrapper
  Next you have to configure the xAPI Wrapper. By default, the xAPI Wrapper is configured to communicate with an LRS at localhost. We want to have xAPI Launch tell the content what configuration to use, instead of hardcoding the LRS and authentication details. By calling ADL.launch, the xAPIWrapper will do the handshake with xAPI Launch and pass a configured object to the callback. As a fallback, or if there is an error, we have hardcoded default values to use.

  1. Create a `video` object and initialize it to the video ID you wish to use.
  ``` javascript
  ...
      var video = "tlBbt5niQto"; // Change this to your video ID
  ...
  ```
  
  2. Create an `myXAPI` object just above the launch callback.
  ``` javascript
  ...
      var myXAPI = {};
  ...
  ```

  3. xAPI Launch sends information (launch data) to the content, which the `ADL.launch` function sends to the callback. The `launchdata.customData` object contains content that can be configured in the xAPI Launch server, allowing us to enter a base URI we can use for all places that need a URI. If we're not using launch, we can set our endpoint manually. We can also set the `actor` and `context` properties to default values. Then set the `object` variable to the concatenated `id` and `definition` properties made with our `video` object.
  ``` javascript
  ...
    ADL.launch(function (err, launchdata, xAPIWrapper) {
      if (!err) {
        ADL.XAPIWrapper = xAPIWrapper;
        myXAPI.actor = launchdata.actor;
        myXAPI.context = launchdata.customData.content;
      } else {
        ADL.XAPIWrapper.changeConfig({
          "endpoint":"https://lrs.adlnet.gov/xapi/",
          "user":"xapi-workshop",
          "password":"password1234"
        });
        myXAPI.actor = {account: {homePage:"http://example.com/watch-video", name: "youtube"}};
        myXAPI.context = {contextActivities: {grouping: [{id: "http://adlnet.gov/event/xapiworkshop/non-launch"}]}};
      }
    
      myXAPI.object = {id: "https://www.youtube.com/watch?v="+video, definition: {name: {"en-US": video}}};
  ...
  ```

## Step 4 - Configure Youtube's iframe API
Next we need to configure the iframe API. This will be done inside the `<body>` of our `index.html`.

  1. At the very last line of our `ADL.launch`, call `ADL.XAPIYoutubeStatements.changeConfig` passing in our `myXAPI` object. This will initialize the objects for our base statement.
  ``` javascript
  ... 
        ADL.XAPIYoutubeStatements.changeConfig(myXAPI);
      }, true);
  ...
  ```

  2. Add an `initYT` function next. This function will create a new `<script>` tag, initialize it's `src` attribute to include the [iframe API](https://www.youtube.com/iframe_api) script, and insert it above all the current `<script>` tags.
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

  3. Create a `player` object and a new function called `onYoutubeIframeAPIReady` right below it. Then initialize our `player` to a new instance of the Youtube Player. Here you can specify the iframe's `id`, `height`, `width`, `src`, `options`, and `event` parameters. Once you have your newly created `player`, call the `initYT` function to create and insert the `<iframe>` tag.
  ``` javascript
  ...
      var player;
      function onYouTubeIframeAPIReady() {
        player = new YT.Player('player', {
          height: '400',
          width: '700',
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

## Step 5 - Initializing content in xapi-youtube-statements.js
Once the xAPI Wrapper is configured, we need to initialize our `XAPIYoutubeStatements`object by defining our global variables, functions, and events.

  1. Create an `actor`, `object`, and `context` variables. These will represent our base statement properties when we first configure. These objects will never change, unless specified, for the length of our application.
  ``` javascript
  ...
    XAPIYoutubeStatements = function() {

      var actor = {};
      var object = {};
      var context = {};
  ...
  ```

  2. Create a `this.changeConfig` function that will set our `actor`, `object`, and `context` variables. Make sure you specify `this` on the function name to allow global access.
  ``` javascript
  ...
      this.changeConfig = function(myXAPI) {
        actor = myXAPI.actor;
        object = myXAPI.object;
        context = myXAPI.context;
      }
  ...
  ```

  3. Add the `this.onPlayerReady` event next. This function will output a message to our `log` and attach our `exitVideo` function to the `window.onunload` event.
  ``` javascript
  ...
      this.onPlayerReady = function(event) {
        var message = "yt: player ready";
        log(message);
        window.onunload = exitVideo;
      }
  ...
  ```

  4.  Next add the `this.onStateChange` event. Here we will get the video's current playing time, and parse it into a string for the statement's `extensions` property. You will then create a `stmt` object to send to the LRS. Make a switch statement for the `event.data` to determine the `player` object's current state. Look closely at `case 2:`. When you `seek` or skip part of the video, `paused` and `played` statements would normally be sent to the LRS. Because you can't detect when the user 'seeked' directly, you will have to delay sending the `paused` statement by using `setTimeout` to wait 100 milliseconds before calling `pauseVideo`. Before you call `setTimeout`, get the current time(in milliseconds) with the `Date.now` function and store it in our `prevTime` object. After our `switch` statement, send the `stmt` to the LRS using `ADL.XAPIWrapper.sendStatement` if its valid.
  ``` javascript
  ...
      this.onStateChange = function(event) {
        var curTime = player.getCurrentTime().toString();
        var ISOTime = "PT" + curTime.slice(0, curTime.indexOf(".")+3) + "S";
        var stmt = null;
        var e = "";
  ...
  ```

