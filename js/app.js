(function() {
  'use strict';
  window.lv = window.lv || {};

  $(document).ready(function() {
    // // DEBUG:
    // domino.settings({
    //   strict: true,
    //   verbose: true,
    //   displayTime: true
    // });

    var dMin = lv.tools.parseDate('1977-09-01'),
        dMax = new Date();

    lv.control = new domino({
      name: 'lv',
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
          id: 'dateMin',
          type: 'date',
          value: dMin
        },
        {
          id: 'dateMax',
          type: 'date',
          value: dMax
        },
        {
          id: 'speed',
          dispatch: 'speedUpdated',
          triggers: 'updateSpeed',
          type: 'number',
          value: 3 // Days per frame
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
          id: 'categories',
          dispatch: 'categoriesUpdated',
          triggers: 'updateCategories',
          type: 'object',
          value: {}
        },
        {
          id: 'categoriesOrder',
          dispatch: 'categoriesOrderUpdated',
          triggers: 'updateCategoriesOrder',
          type: 'array',
          value: []
        },
        {
          id: 'historicEvents',
          dispatch: 'historicEventsUpdated',
          triggers: 'updateHistoricEvents',
          type: 'array',
          value: []
        },
        {
          id: 'closestEvents',
          dispatch: 'closestEventsUpdated',
          triggers: 'updateClosestEvents',
          type: 'array',
          value: []
        },
        {
          id: 'lastCrossedEvent',
          dispatch: 'lastCrossedEventUpdated',
          triggers: 'updateLastCrossedEvent',
          type: 'number',
          value: -1
        },
        {
          id: 'nextEvents',
          dispatch: 'nextEventsUpdated',
          triggers: 'updateNextEvents',
          type: 'array',
          value: []
        },
        {
          id: 'path',
          dispatch: 'pathUpdated',
          triggers: 'updatePath',
          type: 'array',
          value: []
        },
        {
          id: 'closestPosition',
          dispatch: 'closestPositionUpdated',
          triggers: 'updateClosestPosition',
          type: 'array',
          value: []
        },
        {
          id: 'pathIndex',
          dispatch: 'pathIndexUpdated',
          triggers: 'updatePathIndex',
          type: 'array',
          value: []
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
                pathIndex = [],
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
                pathIndex[currentMonth] = i;

              for (j = currentMonth; j < nextMonth; j++)
                if (!pathIndex[j])
                  pathIndex[j] = i;
            }

            this.pathIndex = pathIndex;

            // Tweak: Since this hack is triggered just once,
            // I use it to start the drawing process the first
            // time:
            this.date = this.get('date');
          }
        },
        {
          triggers: 'dateUpdated',
          method: function() {
            this.log('HACK: Cache some values');

            var i,
                j,
                l,
                e,
                events = this.get('historicEvents'),
                date = this.get('date'),
                path = this.get('path'),
                pathIndex = this.get('pathIndex'),
                dateTime = date.getTime(),
                dateNum = lv.tools.numDate(date),
                m = lv.tools.getMonthsDiff(this.get('dateMin'), date),
                closestEventsCount = 30,
                nextEventsCount = 8,
                closest = [];

            // Find the closest events to the date:
            for (i = 0, l = events.length; i < l; i++) {
              e = events[i];
              if (e.d > dateNum)
                break;
            }

            j = i - 1;
            this.lastCrossedEvent = j;

            // Normalize the index:
            i = Math.max(i, closestEventsCount);
            i = Math.min(i, l - closestEventsCount);
            this.closestEvents = events.slice(i - closestEventsCount, i + closestEventsCount);

            j = Math.max(j, 0);
            j = Math.min(j, l - nextEventsCount);
            this.nextEvents = events.slice(j, j + nextEventsCount);

            this.lastCrossedEvent = this.lastCrossedEvent - j;

            // this.speed = Math.floor(Math.min(
            //   Math.max(
            //     lv.tools.getDaysDiff(date, lv.tools.parseDate(this.closestEvents[closestEventsCount - 1].d)) / 5,
            //     1
            //   ),
            //   Math.max(
            //     lv.tools.getDaysDiff(date, lv.tools.parseDate(this.closestEvents[closestEventsCount].d)) / 5,
            //     1
            //   )
            // ));

            // Find the closest position:
            for (i = pathIndex[m], l = path.length; i < l; i++) {
              if (path[i][0] > dateTime) {
                this.closestPosition = path[i];
                break;
              }
            }
          }
        },
        {
          triggers: 'goNextFrame',
          method: function() {
            var d = lv.tools.getNewDate(this.get('date'), {
              days: this.get('speed')
            });

            if (d.getTime() < this.get('dateMax').getTime())
              this.date = d;
            else
              this.isPlaying = false;
          }
        },
        {
          triggers: 'clickArticle',
          method: function(e) {
            this.dispatchEvent('openArticle', {
              id: e.data.id
            });
          }
        }
      ],
      services: [
        {
          id: 'historicEvents',
          url: 'data/events.json',
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
          url: 'data/config.json',
          success: function(data) {
            this.categories = data.categories.reduce(function(r, o) {
              r[o.id] = o;
              return r;
            }, {});
            this.categoriesOrder = data.categories.filter(function(o) {
              return !o.parent;
            }).map(function(o) {
              return o.id;
            });

            var cats = this.categories;

            // HARD CODED
            $('#legend').append(
              this.categoriesOrder.map(function(id) {
                var cat = cats[id];
                return(
                  '<div class="legend-line">' +
                    '<div class="square" style="background:' + cat.color + ';" />' +
                    '<span>' + cat.label + '</span>' +
                  '</div>'
                );
              }).join('')
            );
          }
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
      lv.modules.date,
      [
        $('.date')
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

    // Last minute missing stuff:
    $('.btn.github').click(function() {
      window.open('https://github.com/jacomyal/lonely-voyage', '_blank');
    });

    $('.btn.info').click(function() {
      window.open('https://github.com/jacomyal/lonely-voyage', '_blank');
    });
  });
})();
