(function() {
  'use strict';
  window.lv = window.lv || {};

  $(document).ready(function() {
    // domino.settings({
    //   strict: true,
    //   verbose: true,
    //   displayTime: true
    // });

    var dMin = lv.tools.parseDate('1977-09-01'),
        dMax = new Date();

    lv.control = new domino({
      name: 'the-lonely-voyage',
      properties: [
        // Context:
        {
          id: 'date',
          dispatch: 'dateUpdated',
          triggers: 'updateDate',
          type: 'date',
          value: dMin
        },
        {
          id: 'speed',
          dispatch: 'speedUpdated',
          triggers: 'updateSpeed',
          type: 'number',
          value: 0 // Days per frame
        },
        {
          id: 'isPlaying',
          dispatch: 'isPlayingUpdated',
          triggers: 'updateIsPlaying',
          type: 'boolean',
          value: false
        },

        // Data:
        {
          id: 'config',
          dispatch: 'configUpdated',
          triggers: 'updateConfig',
          type: 'object',
          value: {}
        },
        {
          id: 'historicEvents',
          dispatch: 'historicEventsUpdated',
          triggers: 'updateHistoricEvents',
          type: 'array',
          value: []
        },
        {
          id: 'nearestEvents',
          dispatch: 'nearestEventsUpdated',
          triggers: 'updateNearestEvents',
          type: 'array',
          value: []
        },
        {
          id: 'contents',
          dispatch: 'contentsUpdated',
          triggers: 'updateContents',
          type: 'object',
          value: {}
        },
        {
          id: 'path',
          dispatch: 'pathUpdated',
          triggers: 'updatePath',
          type: 'array',
          value: []
        },
        {
          id: 'direction', // angle only
          dispatch: 'directionUpdated',
          triggers: 'updateDirection',
          type: 'number',
          value: Math.PI
        },
        {
          id: 'curvature', // radius only
          dispatch: 'curvatureUpdated',
          triggers: 'updateCurvature',
          type: 'number',
          value: 10e6
        },

        // Cache:
        {
          id: 'pathIndex',
          dispatch: 'pathIndexUpdated',
          triggers: 'updatePathIndex',
          type: 'object',
          value: {}
        },
        {
          id: 'eventsCursor',
          dispatch: 'eventsCursorUpdated',
          triggers: 'updateEventsCursor',
          type: 'number',
          value: 0
        }
      ],
      hacks: [
        {
          triggers: 'pathUpdated',
          method: function() {
            this.log('HACK: Index path');

            var i,
                j,
                l,
                path = this.get('path'),
                currentMonth = 0,
                pathIndex = {},
                point,
                nextMonth = 0,
                nextPointDate,
                nextPoint;

            for (i = 0, l = path.length; i < l; i++) {
              point = path[i];
              currentMonth = nextMonth;
              nextPoint = path[i + 1];

              if (!nextPoint)
                break;

              nextPointDate = lv.tools.getNewDate(nextPoint[0]);
              nextMonth = lv.tools.getMonthsDiff(dMin, nextPointDate);

              if (currentMonth === nextMonth && !pathIndex[currentMonth])
                pathIndex[currentMonth] = point;

              for (j = currentMonth; j < nextMonth; j++)
                if (!pathIndex[j])
                  pathIndex[j] = point;
            }

            this.pathIndex = pathIndex;
          }
        },
        {
          triggers: 'dateUpdated',
          method: function() {
            this.log('HACK: Compute speed');

            var i,
                l,
                e,
                events = this.get('historicEvents'),
                date = lv.tools.numDate(this.get('date')),
                eventsCount = 10,
                nearest = [];

            // Find the first event after the date:
            for (i = 0, l = events.length; i < l; i++) {
              e = events[i];

              if (e.d > date)
                break;
            }

            // Normalize the index:
            i = Math.max(i, 0);
            i = Math.min(i, l - eventsCount);

            this.nearestEvents = events.slice(i, i + eventsCount);
          }
        },
        {
          triggers: 'goNextFrame',
          method: function() {
            this.date = lv.tools.getNewDate(this.get('date'), {
              days: 3
            });
          }
        }
      ],
      services: [
        {
          id: 'historicEvents',
          url: 'samples/events_random.json',
          success: function(data) {
            this.historicEvents = data;
            this.date = dMin;
          }
        },
        {
          id: 'path',
          url: 'data/path.json',
          setter: 'path'
        },
        {
          id: 'config',
          url: 'samples/config.json',
          setter: 'config'
        }
      ]
    });

    // Custom bindings:
    $(window).resize(function() {
      lv.control.dispatchEvent('resize');
    });

    // Instanciate modules:
    lv.control.addModule(
      lv.modules.player
    );

    lv.control.addModule(
      lv.modules.playButton,
      [
        $('#timeline')
      ]
    );

    lv.control.addModule(
      lv.modules.timeline,
      [
        $('#input-container'),
        dMin,
        dMax
      ]
    );

    lv.control.addModule(
      lv.modules.renderer,
      [
        $('#visualization')
      ]
    );

    lv.control.addModule(
      lv.modules.rightPanel,
      [
        $('#right-panel')
      ]
    );

    // Bootstrap:
    lv.control.dispatchEvent(
      'resize'
    ).request(
      ['historicEvents', 'config', 'path']
    );
  });
})();
