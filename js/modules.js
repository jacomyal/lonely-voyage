(function() {
  'use strict';

  window.lv = window.lv || {};
  lv.modules = lv.modules || {};

  lv.modules.player = function() {
    domino.module.call(this);
    var _self = this,
        _isPlaying = false,
        _interval;

    function startLoop() {
      _interval = window.setInterval(function() {
        _self.dispatchEvent('goNextFrame');
      }, 0);
    }

    this.triggers.events.isPlayingUpdated = function(control) {
      if (_isPlaying = control.get('isPlaying'))
        startLoop();
      else
        window.clearInterval(_interval);
    };
  };

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

    // Observe modifications:
    _input.change(function() {
      _input.attr('title', lv.tools.prettyDate(getDate()));
      _self.dispatchEvent('updateDate', {
        date: getDate()
      });
    });

    function getDate() {
      return lv.tools.getNewDate(dMin, {
        m: _input.val()
      });
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
      setDate(control.get('date'));
    };
  };

  lv.modules.renderer = function(html) {
    domino.module.call(this);

    var _self = this,
        _html = html,
        _canvas = $('canvas', _html)[0],
        _ctx = _canvas.getContext('2d'),
        _captions = $('#captions', _html),
        _t = 50;

    // Bind mouse events:
    _captions.click(function(e) {
      var p,
          t = $(e.target);

      if (
        (t.is('.caption') && (p = t)) ||
        (p = t.parents('.caption')).length
      ) {
        _self.dispatchEvent('clickArticle', {
          id: p.attr('data-article-id')
        });
      }
    });

    function drawHighway(control) {
      _ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      _ctx.fillRect(0, 0, _canvas.width, _canvas.height);

      var i,
          l,
          cat,
          cats = control.get('categories'),
          conf = control.get('categoriesOrder'),
          p = control.get('closestPosition'),
          vx = p[5],
          vy = p[6],
          v = p[7],
          r = 1 / p[8] / 100000000,
          cx = vy / v * r,
          cy = -vx / v * r,
          coef = Math.sqrt(
            Math.pow(_canvas.width, 2),
            Math.pow(_canvas.height, 2)
          ) / v;

      // Radius correction:
      r = Math.sqrt(cx * cx + cy * cy);

      for (i = 0, l = conf.length; i < l; i++) {
        cat = cats[conf[i]];
        _ctx.strokeStyle = cat.color;
        _ctx.lineWidth = _t - 2;

        if (r > -1) {
          _ctx.beginPath();
          _ctx.moveTo(
            _canvas.width / 2 - vx * coef - vy / v * _t * (i - 2),
            _canvas.height / 2 - vy * coef + vx / v * _t * (i - 2)
          );
          _ctx.lineTo(
            _canvas.width / 2 + vx * coef - vy / v * _t * (i - 2),
            _canvas.height / 2 + vy * coef + vx / v * _t * (i - 2)
          );
          _ctx.closePath();
          _ctx.stroke();
        } else {
          _ctx.beginPath();
          _ctx.arc(
            cx + _canvas.width / 2,
            cy + _canvas.height / 2,
            r - 2 * _t + i * _t,
            0,
            2 * Math.PI
          );
          _ctx.closePath();
          _ctx.stroke();
        }
      }

      var angle = Math.round(Math.asin(vy / vx) * 180 / Math.PI + 90);
      $('#voyager', _html).css({
        '-webkit-transform': 'rotate(' + angle + 'deg)',
        '-moz-transform': 'rotate(' + angle + 'deg)',
        '-o-transform': 'rotate(' + angle + 'deg)',
        '-ms-transform': 'rotate(' + angle + 'deg)'
      });
    }

    function drawEvents(control) {
      var events = control.get('closestEvents'),
          i,
          l = events.length,
          e,
          cap,
          cat,
          parent,
          index,
          p = control.get('closestPosition'),
          vx = p[5],
          vy = p[6],
          v = p[7],
          coef,
          cats = control.get('categories'),
          order = control.get('categoriesOrder'),
          d = control.get('date'),
          ids = {},
          distance;

      for (i = 0; i < l; i++) {
        e = events[i];
        ids[e.i] = 1;
        cat = cats[e.c];

        distance = -lv.tools.getDaysDiff(d, lv.tools.parseDate(e.d)) * 2;
        parent = cat.parent || cat.id;
        index = order.reduce(function(r, s, i) {
          return s === parent ? i : r;
        }, null);

        coef = distance / v;

        cap = $('.caption[data-article-id="' + e.i + '"]', _captions)
        cap = (cap.length ? cap : $(
          '<div class="caption" ' +
               'style="color:' + cat.color + ';" ' +
               'data-article-id="' + e.i + '">' +
            '<i class="' + cat.icon + '" />' +
            '<div class="caption-label">' + e.t + '</div>' +
          '</div>'
        ).appendTo(_captions)).css({
          left: _canvas.width / 2 - vx * coef - vy / v * _t * (index - 2) - 15,
          top: _canvas.height / 2 - vy * coef + vx / v * _t * (index - 2) - 15
        });
      }

      $('.caption', _captions).each(function() {
        if (!ids[$(this).attr('data-article-id')])
          $(this).remove();
      });
    }

    function resize() {
      _canvas.width = _html.width();
      _canvas.height = _html.height();
    }

    this.triggers.events.resize = resize;
    this.triggers.events.closestPositionUpdated = function(control) {
      drawHighway(control);
      drawEvents(control);
    };
  };

  lv.modules.rightPanel = function(html) {
    domino.module.call(this);

    var _self = this,
        _html = html,
        _config = {},
        _rolodex = $('#rolodex', _html),
        _article = $('#article', _html);

    // Bind mouse events:
    _html.click(function(e) {
      var p,
          t = $(e.target);

      if (t.is('.abstract-title')) {
        // No time to code the hack properly, the article
        // will be loaded directly from here:
        // 
        // _self.dispatchEvent('openArticle', {
        //   id: t.parents('li').attr('data-article-id')
        // });
        
        openArticle(t.parents('li').attr('data-article-id'));
      } else if (
        (t.is('.close-article') && (p = t)) ||
        (p = t.parents('.close-article')).length
      ) {
        closeArticle();
      }
    });

    function openArticle(id) {
      $('#content', _html).attr('data-article-id', id);
      $('#article', _html).empty().load('samples/event.html');
    }

    function closeArticle() {
      $('#article', _html).empty();
      $('#content', _html).attr('data-article-id', null);
    }

    function addAbstract(event, ul) {
      ul.append(
        '<li class="abstract" data-article-id="' + event.i + '">' +
          '<i class="' + _config[event.c].icon + '" ' +
             'style="background:' + _config[event.c].color + ';" />' +
          '<span class="abstract-title">' + event.t + '</span>' +
          '<span class="abstract-date" ' +
                'style="color:' + _config[event.c].color + ';">' + lv.tools.prettyDate(event.d) + '</span>' +
        '</li>'
      );
    }

    this.triggers.events.dateUpdated = closeArticle;
    this.triggers.events.openArticle = openArticle;

    this.triggers.events.nextEventsUpdated = function(control) {
      var ul = $('ul', _rolodex).empty();
      $('div.date', _rolodex).text(lv.tools.prettyDate(control.get('date')));

      _config = control.get('categories');

      var i,
          l,
          events = control.get('nextEvents');

      for (i = 0, l = events.length; i < l; i++)
        addAbstract(events[i], ul);
    };

    this.triggers.events.openArticle = function(_, event) {
      openArticle(event.data.id);
    };
  };
})();
