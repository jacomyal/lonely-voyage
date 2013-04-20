(function() {
  'use strict';
  window.lv = window.lv || {};
  lv.tools = lv.tools || {};

  // DATE MANAGEMENT:
  var _dateMasks = [
        {
          regex: /([0-9]+)-([0-9]+)-([0-9]+) ([0-9]+):([0-9]+):([0-9]+)/,
          callback: function(match){
            return new Date(+match[1], +match[2]-1, +match[3], +match[4], +match[5], +match[6]);
          }
        },
        {
          regex: /([0-9]+)-([0-9]+)-([0-9]+)/,
          callback: function(match){
            return new Date(+match[1], +match[2]-1, +match[3]);
          }
        },
        {
          regex: /([0-9]{4})([0-9]{2})([0-9]{2})/,
          callback: function(match){
            return new Date(+match[1], +match[2]-1, +match[3]);
          }
        }
      ],
      _monthsNames = ('January February March ' +
                      'April May June ' +
                      'July August September ' +
                      'October November December').split(' ');

  lv.tools.parseDate = function(string) {
    var d;
    string = string.toString();

    if (_dateMasks.some(function(obj) {
      var match = string.match(obj.regex);
      if (match) {
        d = obj.callback(match);
        return true;
      } else
        return false;
    })) {
      if (isNaN(d.valueOf()))
        throw new Error('Unvalid date: ' + string);
      else
        return d;
    } else
      throw new Error('Unrecognized date: ' + string);
  };

  lv.tools.getMonthsDiff = function(dMin, dMax) {
    return 12 * (dMax.getFullYear() - dMin.getFullYear()) + dMax.getMonth() - dMin.getMonth();
  };

  lv.tools.getNewDate = function(d, o) {
    var res = new Date(d.getTime());

    // Add years:
    res.setFullYear(d.getFullYear() + (o.years || o.y || 0));

    // Add months:
    res.setFullYear(d.getFullYear() + Math.floor((o.months || o.m || 0) / 12));
    res.setMonth(d.getMonth() + ((o.months || o.m || 0) % 12));

    // Add days:
    // Not used, no need to code it - huhu

    return res;
  };

  lv.tools.prettyDate = function(d) {
    return d.getFullYear() + ' ' + _monthsNames[d.getMonth()] + ' ' + d.getDate();
  };
})();
