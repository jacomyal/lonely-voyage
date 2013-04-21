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
    _input = _input.rangeinput();

    // Observe modifications:
    _input.change(function() {
      _input.attr('title', lv.tools.prettyDate(getDate()));
      _self.dispatchEvent('updateDate', {
        date: getDate()
      });
    });

    _html.click(function() {
      _self.dispatchEvent('updateIsPlaying', {
        isPlaying: false
      });
    });

    function getDate() {
      return lv.tools.getNewDate(dMin, {
        m: _input.val()
      });
    };

    function setDate(d) {
      ___hackedRange.setValue(lv.tools.getMonthsDiff(dMin, d));
    };

    function drawCaption() {
      // TODO
      // no time...
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
        _date,
        _canvas = $('canvas', _html)[0],
        _ctx = _canvas.getContext('2d'),
        _captions = $('#captions', _html),
        _pattern,
        _patterndx = 0,
        _patterndy = 0,
        _t = 55;

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

    // Load BG pattern:
    (function() {
      var imageObj = new Image();
      imageObj.onload = function() {
        _pattern = _ctx.createPattern(imageObj, 'repeat');
        _self.dispatchEvent('updateDate', {
          date: _date
        });
      };
      imageObj.src = 'img/sky.png';
    })();

    function drawHighway(control) {
      var i,
          l,
          cat,
          cats = control.get('categories'),
          conf = control.get('categoriesOrder'),
          p = control.get('closestPosition'),
          vx = p[3],
          vy = p[4],
          v = Math.sqrt(vx * vx + vy * vy),
          r = 1 / p[5] / 100000000,
          cx = vy / v * r,
          cy = -vx / v * r,
          coef = Math.sqrt(
            Math.pow(_canvas.width, 2),
            Math.pow(_canvas.height, 2)
          ) / v;

      if (_pattern) {
        _patterndx = ((_patterndx + vx / v * 3) % 400 + 400) % 400;
        _patterndy = ((_patterndy + vy / v * 3) % 400 + 400) % 400;
        
        _ctx.translate(-_patterndx, -_patterndy);
        _ctx.globalAlpha = 0.3;
        _ctx.rect(0, 0, _canvas.width + 400, _canvas.height + 400);
        _ctx.fillStyle = _pattern;
        _ctx.fill();
        _ctx.globalAlpha = 1;
        _ctx.translate(_patterndx, _patterndy);
      }

      // Radius correction:
      r = Math.sqrt(cx * cx + cy * cy);

      for (i = 0, l = conf.length; i < l; i++) {
        cat = cats[conf[i]];
        _ctx.strokeStyle = cat.color;
        _ctx.lineWidth = _t - 4;

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
          vx = p[3],
          vy = p[4],
          v = Math.sqrt(vx * vx + vy * vy),
          coef,
          cats = control.get('categories'),
          order = control.get('categoriesOrder'),
          d = control.get('date'),
          ids = {},
          distance;

      for (i = 0; i < l; i++) {
        e = events[i];
        ids[e.i] = 1;
        cat = cats[e.c || e.s];

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
               'title="' + e.t + ' - ' + lv.tools.prettyDate(e.d) + '" ' +
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

    this.triggers.events.resize = function(control) {
      _canvas.width = _html.width();
      _canvas.height = _html.height();

      drawHighway(control);
      drawEvents(control);
    };

    this.triggers.events.closestPositionUpdated = function(control) {
      _date = control.get('date');
      drawHighway(control);
      drawEvents(control);
    };
  };

  lv.modules.date = function(html) {
    domino.module.call(this);
    this.triggers.events.dateUpdated = function(control) {
      html.text(
        'Current date : ' +
        lv.tools.prettyDate(control.get('date'))
      );
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
          '<i class="' + _config[event.c || event.s].icon + '" ' +
             'style="background:' + _config[event.c || event.s].color + ';" />' +
          '<span class="abstract-title">' + event.t + '</span>' +
          '<span class="abstract-date" ' +
                'style="color:' + _config[event.c || event.s].color + ';">' + lv.tools.prettyDate(event.d) + '</span>' +
        '</li>'
      );
    }

    this.triggers.events.dateUpdated = closeArticle;
    this.triggers.events.openArticle = openArticle;

    this.triggers.events.nextEventsUpdated = function(control) {
      var ul = $('ul', _rolodex).empty();

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
