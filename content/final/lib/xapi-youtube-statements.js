(function(ADL){

    // -- step 4.3 --
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
    // -- end step 4.3 --

    XAPIYoutubeStatements = function() {

      // -- step 3.1 --
      var actor = {"mbox":"mailto:anon@example.com", "name":"anonymous"};
      var videoActivity = {};
      // -- end step 3.1 --

      // -- step 4.1 --
      var started = false;
      var seeking = false;
      var prevTime = 0.0;
      var completed = false;
      // -- end step 4.1 --

      // -- step 3.2 --
      this.changeConfig = function(options) {
        actor = options.actor;
        videoActivity = options.videoActivity;
      }
      // -- end step 3.2 --

      // -- step 3.3 --
      this.onPlayerReady = function(event) {
        var message = "yt: player ready";
        log(message);
        ADL.XAPIYoutubeStatements.onPlayerReadyCallback(message);
        window.onunload = exitVideo;
      }
      // -- end step 3.3 --

      // -- step 3.4 --
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
      // -- end step 3.4 --

      // -- step 4.2 --
      function buildStatement(stmt) {
        if (stmt){
          var stmt = stmt;
          stmt.actor = actor;
          stmt.object = videoActivity;
        }
        return stmt;
      }
      // -- end step 4.2 --

      var convertISOSecondsToNumber = function(time) { return Number(time.slice(2, -1)); };

      // -- step 5.1 --
      function initializeVideo(ISOTime) {
        var stmt = {};

        stmt.verb = {
          id: ADL.videoprofile.references.initialized['@id'],
          display: {"en-US": "initialized"}
        };

        return buildStatement(stmt);
      }
      // -- end step 5.1 --

      // -- step 5.2 --
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
      // -- end step 5.2 --

      // -- step 5.3 --
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
      // -- end step 5.3 --

      // -- step 5.6 --
      function seekVideo(ISOTime) {
        var stmt = {};

        stmt.verb = {
          id: ADL.videoprofile.verbs.seeked['@id'],
          display: ADL.videoprofile.verbs.seeked.prefLabel
        }
        stmt.result = {"extensions":{"resultExt:seeked":ISOTime}};

        return buildStatement(stmt);
      }
      // -- end step 5.6 --

      // -- step 5.4 --
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
      // -- end step 5.4 --

      // -- step 5.5 --
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
      // -- end step 5.5 --

    }

    ADL.XAPIYoutubeStatements = new XAPIYoutubeStatements();

    ADL.XAPIYoutubeStatements.onPlayerReadyCallback = function(message) {};
    ADL.XAPIYoutubeStatements.onStateChangeCallback = function(stmt) {};

}(window.ADL = window.ADL || {}));
