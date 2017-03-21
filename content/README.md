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