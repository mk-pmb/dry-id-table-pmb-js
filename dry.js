/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, keep = null, isAry = Array.isArray;

function isStr(x, no) { return (((typeof x) === 'string') || no); }
function fail(why) { throw new Error(why); }


EX = function swell(reci) {
  if (isStr(reci)) {
    if (reci.slice(0, 1) === '\uFEFF') { reci = reci.slice(1); }
    reci = JSON.parse(reci);
  }
  keep = {
    '#': 0,     // incrementing number
    '+': 0,     // increment distance
    '*': 1,     // repeats: how many times (total) to render this step
    '|':    null,   // row cells template
    '|fmt': null,   // post-format name
    '|cfg': null,   // custom config
    '$': '$',       // easily escape $ by duplicating it
  };
  var table = [];
  reci.forEach(function (step) {
    var addRows = EX.recipeStep(step);
    if (addRows) { table = table.concat(addRows); }
  });
  keep = null;
  return table;
};


function cfg(opt) { return (keep['|cfg'] || false)[opt]; }


function split1ch(x) {
  return ((x || false).split ? x.slice(1).split(new RegExp((x.match(/^\w/
    ) ? '' : '\\') + x.substr(0, 1))) : x);
}


function ifempty(x, d) {
  if (x) { return x; }
  if (x === '') { return d; }
  if (x === null) { return d; }
  if (x === undefined) { return d; }
  return x;
}


EX.varsRgx = /\$(?:\{([ -z|~\x0A-\uFFFF]+)\}|([ -z|~\x0A-\uFFFF]))/g;


function renderVars(s) {
  s = String(s);
  if (s.length < 2) { return s; }
  return s.replace(EX.varsRgx, renderVars.ins);
}
renderVars.ins = function (m, nameLong, nameChar) {
  var n = (nameLong || nameChar), v = ifempty(keep[n], null);
  if (v === null) {
    if (cfg('undefVar') === 'orig') { return m; }
    fail('Cannot insert undefined variable: ' + m);
  }
  return renderVars(v);
};
renderVars.cell = function (c, i) {
  keep[','] = keep[i];
  return renderVars(c);
};


function updateRowTpl(upd) {
  if (!upd) { return; }
  if (upd.substr(0, 1) === '$') { upd = renderVars(upd); }
  var tpl = (keep['|'] || []);
  split1ch(upd).forEach(function (c, i) {
    if (!c) { return; }
    tpl[i] = c;
    keep['|' + i] = c;
  });
  keep['°'] = tpl[0];
  keep['¹'] = tpl[1];
  keep['²'] = tpl[2];
  keep['³'] = tpl[3];
  keep['|'] = tpl;
}


function postFormat(c, i) {
  var n = postFormat.fmt[i], f;
  if (!n) { return c; }
  f = EX['fmt_' + n];
  if (f) { return f(c); }
  fail('unsupported post-format name: ' + n);
}


EX.recipeStep = function (step) {
  if (step === +step) {
    keep['+'] = step;
    return;
  }
  if (!step) {
    keep['#'] += keep['+'];
    return;
  }
  if (isStr(step)) { step = [step]; }
  if (isAry(step)) { step = Object.assign({ '|': step[0] }, step.slice(1)); }
  var repeat, rows = [], rendered, fmt = keep['|fmt'];
  Object.assign(keep, step,
    // protect special slots:
    { '|' : keep['|'] });
  // Now we can calculate stuff that might want to renderVars():
  updateRowTpl(step['|']);
  if (step['|fmt']) {
    fmt = split1ch(step['|fmt']);
    keep['|fmt'] = fmt;
    postFormat.fmt = fmt;
  }

  function renderRow() {
    keep['#'] += keep['+'];
    if (!keep['|']) { return; }
    //console.log(keep);
    rendered = keep['|'].map(renderVars.cell);
    //console.log(rowTpl, rendered);
    if (fmt) { rendered = rendered.map(postFormat); }
    rows.push(rendered);
  }

  for (repeat = (+keep['*'] || 0); repeat > 0; repeat -= 1) { renderRow(); }
  return rows;
};


EX.fmt_u_c = function (s) {
  return s.trim().replace(/\s+/g, '_').toUpperCase();
};
















module.exports = EX;
if (require.main === module) { EX.runFromCLI(); }
