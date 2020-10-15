define('bigscreenplayer/subtitles/renderer',
  [
    'bigscreenplayer/debugger/debugtool',
    'bigscreenplayer/domhelpers',
    'smp-imscjs'
  ],
  function (DebugTool, DOMHelpers, IMSC) {
    'use strict';

    // This requires IMSC being available at runtime
    var generateISD = IMSC.generateISD;
    var fromXML = IMSC.fromXML;
    var renderHTML = IMSC.renderHTML;

    var Renderer = function (id, uri, media) {
      var outputElement;
      var currentElement;
      var previousState;
      var xml;
      var times;

      var videoElement = document.getElementsByTagName('video')[0];
      var track = videoElement.addTextTrack('captions');
      track.mode = 'hidden';

      if (!outputElement) {
        outputElement = document.createElement('div');
        outputElement.id = id;
        outputElement.style.position = 'absolute';
        outputElement.style.width = '100%';
        outputElement.style.height = '100%';
      }

      loadData(uri);

      DebugTool.info('Loading captions from: ' + uri);

      function loadData (dataFeedUrl) {
        var req = new XMLHttpRequest();

        req.onreadystatechange = function () {
          if (req.readyState === 4) {
            req.onreadystatechange = null;
            if (req.status >= 200 && req.status < 300) {
              if (req.response) {
                try {
                  xml = fromXML(req.responseText, function (error) {
                    DebugTool.info(error);
                  }, function (error) {
                    DebugTool.info(error);
                  });

                  times = xml.getMediaTimeEvents();

                  var Cue = window.VTTCue || window.TextTrackCue;
                  for (var i = 0; i < times.length; i++) {
                    var cue = new Cue(times[i], times[i], '');
                    cue.onenter = function () { update(this.startTime); };
                    track.addCue(cue);
                  }
                } catch (e) {
                  DebugTool.info('Error transforming captions response: ' + e);
                }
              }
            } else {
              DebugTool.info('Response Code ' + req.status + '; Error loading captions data: ' + req.responseText);
            }
          }
        };

        try {
          req.open('GET', dataFeedUrl, true);
          req.send(null);
        } catch (e) {
          DebugTool.info('Error transforming captions response: ' + e);
        }
      }

      function render () {
        return outputElement;
      }

      function start () {
        if (outputElement) {
          outputElement.style.display = 'block';
        }
      }

      function stop () {
        if (outputElement) {
          outputElement.style.display = 'none';
        }
      }

      function update (time) {
        if (!media) {
          stop();
        }

        // generateISD(tt, offset, errorHandler)
        var isd = generateISD(xml, time);
        if (currentElement) {
          DOMHelpers.safeRemoveElement(currentElement);
        }

        currentElement = document.createElement('div');
        currentElement.id = 'bsp_captions';
        outputElement.appendChild(currentElement);
        // renderHTML(isd, element, imgResolver, eheight, ewidth, displayForcedOnlyMode, errorHandler, previousISDState, enableRollUp)
        previousState = renderHTML(isd, currentElement, null, outputElement.clientHeight, outputElement.clientWidth, false, function () {}, previousState, true);
      }

      return {
        render: render,
        start: start,
        stop: stop,
        update: update,
        loadData: loadData
      };
    };

    return Renderer;
  });
