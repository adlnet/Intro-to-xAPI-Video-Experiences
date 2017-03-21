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