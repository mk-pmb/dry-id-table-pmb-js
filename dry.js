/*jslint indent: 2, maxlen: 80, continue: false, unparam: false, node: true */
/* -*- tab-width: 2 -*- */
'use strict';

var EX, keep = null, isAry = Array.isArray;

function isStr(x, no) { return (((typeof x) === 'string') || no); }
function fail(why) { throw new Error(why); }
function countdown(n, f) { for (0; n > 0; n -= 1) { f(n); } }


EX = function swell(reci) {
  if (isStr(reci)) {
    if (reci.slice(0, 1) === '\uFEFF') { reci = reci.slice(1); }
    reci = JSON.parse(reci);
  }
  keep = {
    '#': 0,     // incrementing number
    '®': 0,     // row counter
    '+': 0,     // increment distance
    '*': 1,     // repeats: how many times (total) to render this step
    '*…': 1,    // default repeats: for this and the upcoming steps.
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
  if (!x) { return x; }
  if (!isStr(x)) { return x; }
  if (x.match(/^\w/)) { return x.split(/\|/); }
  return x.slice(1).split(new RegExp('\\' + x.substr(0, 1)));
}


function ifset(x, d) {
  if (x) { return x; }
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
  var n = (nameLong || nameChar), v = ifset(keep[n], null);
  if (v === null) {
    if (cfg('undefVar') === 'orig') { return m; }
    fail('Cannot insert undefined variable: ' + m);
  }
  return renderVars(v);
};
renderVars.cell = function (c, i) {
  keep['©'] = (keep[i] || '');
  return renderVars(c);
};


function updateRowTpl(upd) {
  if ((upd === null) || (upd === false)) {
    keep['|'] = upd;
    return;
  }
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


function postFormat(cell, colIdx) {
  var fmts = postFormat.fmt[colIdx];
  if (!fmts) { return cell; }
  fmts.split(/ /).forEach(function (fmt) {
    var how = EX['fmt_' + fmt];
    if (!how) { fail('unsupported post-format name: ' + fmt); }
    cell = how(cell);
  });
  return cell;
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
  var rows = [], rendered, fmt = keep['|fmt'], repeat;
  Object.assign(keep, step,
    // protect special slots:
    { '|' : keep['|'] });
  // Now we can calculate stuff that might want to use vars:
  repeat = ifset(step['*'], keep['*…']);
  updateRowTpl(step['|']);
  if (step['|fmt']) {
    fmt = split1ch(step['|fmt']);
    keep['|fmt'] = fmt;
    postFormat.fmt = fmt;
  }

  function renderRow(rpt) {
    keep['*'] = rpt;
    keep['#'] += keep['+'];
    if (!keep['|']) { return; }
    //console.log(keep);
    rendered = keep['|'].map(renderVars.cell);
    //console.log(rowTpl, rendered);
    if (fmt) { rendered = rendered.map(postFormat); }
    keep['®'] += 1;
    rows.push(rendered);
  }

  if (repeat === +repeat) { countdown(repeat, renderRow); }
  if (isAry(repeat)) { repeat.forEach(renderRow); }
  return rows;
};


function firstChar(f) {
  return function (s) { return f(s.slice(0, 1)) + s.slice(1); };
}


function uc(s) { return s.toUpperCase(); }
function lc(s) { return s.toUpperCase(); }
EX.fmt_uc = uc;
EX.fmt_uc1 = firstChar(uc);
EX.fmt_u_c = function (s) { return uc(s.trim().replace(/\s+/g, '_')); };
EX.fmt_lc = lc;
EX.fmt_lc1 = firstChar(lc);
EX.fmt_normsp = function (s) { return s.trim().replace(/\s+/g, ' '); };
















module.exports = EX;
if (require.main === module) { EX.runFromCLI(); }
