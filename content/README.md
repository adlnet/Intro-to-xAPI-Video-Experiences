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