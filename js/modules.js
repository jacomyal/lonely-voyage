(function() {
  'use strict';

  window.lv = window.lv || {};
  lv.modules = lv.modules || {};

  lv.modules.playButton = function(html) {
    domino.module.call(this);
    var _self = this,
        _html = html,
        _play = $('.play', _html),
        _pause = $('.pause', _html);

    _play.click(function() {
      _self.dispatchEvent('updateIsPlaying', {
        isPlaying: true
      });
    });

    _pause.click(function() {
      _self.dispatchEvent('updateIsPlaying', {
        isPlaying: false
      });
    });

    this.triggers.events.isPlayingUpdated = function(control) {
      if (control.get('isPlaying'))
        _html.addClass('playing');
      else
        _html.removeClass('playing');
    };
  };

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

    // Range input polyfill:
    _input.rangeinput();
    _input = $('input', _html);

    _input.change(function() {
      _input.attr('title', lv.tools.prettyDate(getDate()));
    });

    function getDate() {
      return lv.tools.getNewDate(dMin, { m: _input.val() });
    };

    function setDate(d) {
      _input.val(lv.tools.getMonthsDiff(dMin, d));
    };

    function drawCaption() {
      // TODO
    }

    this.html = _html;
    this.triggers.events.resize = function() {
      drawCaption();
    };
    this.triggers.events.dateUpdated = function(control) {
    console.log(_input);
      setDate(control.get('date'));
    };
  };

  lv.modules.renderer = function(html) {
    domino.module.call(this);

    var _self = this,
        _html = html,
        _canvas = $('canvas', _html)[0],
        _ctx = _canvas.getContext('2d');

    function draw(control) {
      // TODO
    }

    function resize() {
      _canvas.width = _html.width();
      _canvas.height = _html.height();
    }

    this.triggers.events.dateUpdated = draw;
  };

  lv.modules.contents = function(html) {
    domino.module.call(this);

    var _self = this,
        _html = html;

    // TODO
  };

  lv.modules.rolodex = function(html) {
    domino.module.call(this);

    var _self = this,
        _html = html;

    // TODO
  };
})();
