(function() {
  'use strict';
  window.lv = window.lv || {};
  lv.modules = lv.modules || {};

  lv.modules.timeline = function(html, dMin, dMax) {
    domino.module.call(this);

    var _self = this,
        _mMin = 0,
        _mMax = lv.tools.getMonthsDiff(dMin, dMax),
        _input = $('<input type="range" ' +
                          'value="' + _mMin + '" ' +
                          'min="' + _mMin + '" ' +
                          'max="' + _mMax + '" />'),
        _html = html.append(_input);

    _input.change(function() {
      _input.attr('title', lv.tools.prettyDate(getDate()));
    });

    function getDate() {
      return lv.tools.getNewDate(dMin, { m: _input.val() });
    };

    function drawCaption() {

    }

    this.html = _html;
    this.triggers.events.resize = function() {
      drawCaption();
    };
  };
})();
