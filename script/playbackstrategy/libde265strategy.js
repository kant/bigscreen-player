define('bigscreenplayer/playbackstrategy/libde265strategy',
  [
    'bigscreenplayer/models/mediastate',
    'bigscreenplayer/debugger/debugtool',
    'bigscreenplayer/models/livesupport',

    // static imports
    '../lib/libde265.min'
  ],
  function (MediaState, DebugTool, LiveSupport) {
    var libde265Strategy = function (mediaSources, windowType, mediaKind, playbackElement, isUHD, device) {
      var canvasElement;
      var player;

      var eventCallbacks = [];
      var errorCallback;
      var timeUpdateCallback;

      var isEnded;

      function onPlaying () {
        isEnded = false;
        publishMediaState(MediaState.PLAYING);
      }

      // TODO: Pausing
      function onPaused () {
        publishMediaState(MediaState.PAUSED);
      }

      function onBuffering () {
        isEnded = false;
        publishMediaState(MediaState.WAITING);
      }

      function onEnded () {
        isEnded = true;
        publishMediaState(MediaState.ENDED);
      }

      // TODO: TImeupdates
      function onTimeUpdate () {
        publishTimeUpdate();
      }

      // TODO: Errors
      function onError (event) {
        publishError(event);
      }

      function publishMediaState (mediaState) {
        for (var index = 0; index < eventCallbacks.length; index++) {
          eventCallbacks[index](mediaState);
        }
      }

      function publishTimeUpdate () {
        if (timeUpdateCallback) {
          timeUpdateCallback();
        }
      }

      function publishError (errorEvent) {
        if (errorCallback) {
          errorCallback(errorEvent);
        }
      }

      return {
        transitions: {
          //TODO: Pausing and seeking
          canBePaused: function () { return false; },
          canBeginSeek: function () { return false; }
        },
        addEventCallback: function (thisArg, newCallback) {
          var eventCallback = function (event) {
            newCallback.call(thisArg, event);
          };
          eventCallbacks.push(eventCallback);
        },
        removeEventCallback: function (callback) {
          var index = eventCallbacks.indexOf(callback);
          if (index !== -1) {
            eventCallbacks.splice(index, 1);
          }
        },
        addErrorCallback: function (thisArg, newErrorCallback) {
          errorCallback = function (event) {
            newErrorCallback.call(thisArg, event);
          };
        },
        addTimeUpdateCallback: function (thisArg, newTimeUpdateCallback) {
          timeUpdateCallback = function () {
            newTimeUpdateCallback.call(thisArg);
          };
        },
        load: function (mimeType, playbackTime) {
          // TODO: Implement playbackTime handling

          canvasElement = document.createElement('canvas');
          playbackElement.insertBefore(canvasElement, playbackElement.firstChild);

          player = new libde265.RawPlayer(canvasElement);
          player.set_status_callback(function(msg, fps) {
              player.disable_filters(true);
              switch (msg) {
              case "loading":
                DebugTool.info('Loading movie...');
                onBuffering();
                break;
              case "initializing":
                DebugTool.info('Initializing...');
                onBuffering();
                break;
              case "playing":
                DebugTool.info('Playing...');
                onPlaying();
                break;
              case "stopped":
                DebugTool.info('Stopped');
                onEnded();
                break;
              case "fps":
                DebugTool.fps(fps);
                break;
              default:
                DebugTool.info('Other: ' + msg);
              }
          });
          player.playback(mediaSources.currentSource());
        },
        getSeekableRange: function () {
          // TODO
        },
        getCurrentTime: function () {
          // TODO
        },
        getDuration: function () {
          // TODO
        },
        tearDown: function () {
          eventCallbacks = [];
          errorCallback = undefined;
          timeUpdateCallback = undefined;
        },
        reset: function () {
          player.stop();
          player = undefined;

          canvasElement.parentElement.removeChild(canvasElement);
          canvasElement = undefined;
        },
        isEnded: function () {
          return isEnded;
        },
        isPaused: isPaused,
        pause: function (opts) {
          // TODO
        },
        play: function () {
          // TODO
        },
        setCurrentTime: function (time) {
          // TODO
        }
      };
    };

    libde265Strategy.getLiveSupport = function () {
      return LiveSupport.SEEKABLE;
    };

    return libde265Strategy;
  }
);
