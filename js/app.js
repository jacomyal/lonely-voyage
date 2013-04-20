(function() {
  'use strict';
  window.lv = window.lv || {};
  
  domino.settings({
    strict: true,
    verbose: true
  });

  var dMin = lv.tools.parseDate('1977-09-01'),
      dMax = new Date();

  lv.control = new domino({
    name: 'the-lonely-voyage',
    properties: [
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
        id: 'historicEvents',
        dispatch: 'historicEventsUpdated',
        triggers: 'updateHistoricEvents',
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
        id: 'pathIndex',
        dispatch: 'pathIndexUpdated',
        triggers: 'updatePathIndex',
        type: 'object',
        value: {}
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
    ],
    hacks: [
      {
        triggers: 'pathUpdated',
        method: function() {
          this.log('HACK: Index path');

          var i = 0,
              l,
              path = this.get('path'),
              currentMonth = 0,
              pathIndex = {},
              point,
              nextMonth = 0;

          for (l = path.length; i < l; i++) {
            point = path[i];
            currentMonth = nextMonth;
            nextPoint = path[i+1];
            if (!nextPoint)
              break;
            nextPointDate = lv.tools.newDate(nextPoint[0]);
            nextPointMonth = lv.tools.getMonthDiff(dMin, nextPointDate);
            nextMonth = nextPointMonth;
            if (currentMonth === nextPointMonth && !pathIndex[currentMonth])
              pathIndex[currentMonth] = point;
            for (j = currentMonth; j < nextPointMonth; j++) {
              if (!pathIndex[j])
                pathIndex[j] = point;
            }
          }
          this.pathIndex = pathIndex;
        }
      },
      {
        triggers: 'dateUpdated',
        method: function() {
          this.log('HACK: Compute speed');

          // First, let's find the nearest points:
          // TODO
        }
      },
      {
        triggers: 'dateUpdated',
        method: function() {
          this.log('HACK: Compute speed, direction and angle');

          // First, let's find the nearest points:
          // TODO
        }
      }
    ]
  });

  // Custom bindings:
  $(window).resize(function() {
    lv.control.dispatchEvent('resize');
  });

  // Instanciate modules:
  new lv.modules.timeline(
    $('#input-container'),
    dMin,
    dMax
  );
})();
