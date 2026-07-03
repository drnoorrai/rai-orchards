'use strict';
const fs   = require('fs');
const path = require('path');

function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function load(name) {
  return JSON.parse(fs.readFileSync(path.join('content', name + '.json'), 'utf8'));
}

const meta   = load('meta');
const hero   = load('hero');
const grove  = load('grove');
const signup = load('signup');
const vision = load('vision');
const hiring = load('hiring');
const camp   = load('camp');
const site   = load('site');

function rolesHtml(roles) {
  return roles.map(function(r, i) {
    return (i > 0 ? ' <span class="sep">·</span> ' : '') + esc(r);
  }).join('');
}

var R = {
  // <head>
  '{{meta_title}}':              esc(meta.title),
  '{{meta_description}}':        esc(meta.description),
  '{{og_title}}':                esc(meta.og_title),
  '{{og_description}}':          esc(meta.og_description),

  // hero section
  '{{hero_location}}':           esc(hero.location),
  '{{hero_tagline_prefix}}':     esc(hero.tagline_prefix),
  '{{hero_tagline_highlight}}':  esc(hero.tagline_highlight),
  '{{hero_tagline_suffix}}':     esc(hero.tagline_suffix),
  '{{hero_lede}}':               esc(hero.lede),

  // grove buttons (HTML context)
  '{{grove_apples_label}}':      esc(grove.apples.label),
  '{{grove_pears_label}}':       esc(grove.pears.label),
  '{{grove_peaches_label}}':     esc(grove.peaches.label),
  // grove DATA object (JS context — JSON.stringify produces valid JS array literals)
  '{{js_grove_apples}}':         JSON.stringify(grove.apples.varieties),
  '{{js_grove_pears}}':          JSON.stringify(grove.pears.varieties),
  '{{js_grove_peaches}}':        JSON.stringify(grove.peaches.varieties),

  // signup form (HTML context)
  '{{signup_placeholder}}':      esc(signup.placeholder),
  '{{signup_button}}':           esc(signup.button),
  '{{signup_note}}':             esc(signup.note),
  // signup messages (JS string context — JSON.stringify adds surrounding quotes + escapes)
  '{{js_signup_success}}':       JSON.stringify(signup.success),
  '{{js_signup_button_done}}':   JSON.stringify(signup.button_done),
  '{{js_signup_button}}':        JSON.stringify(signup.button),
  '{{js_signup_error_email}}':   JSON.stringify(signup.error_email),
  '{{js_signup_error_network}}': JSON.stringify(signup.error_network),
  '{{js_signup_note}}':          JSON.stringify(signup.note),

  // vision section
  '{{vision_eyebrow}}':          esc(vision.eyebrow),
  '{{vision_head_before}}':      esc(vision.head_before),
  '{{vision_head_em}}':          esc(vision.head_em),
  '{{vision_body_1}}':           esc(vision.body_1),
  '{{vision_body_2}}':           esc(vision.body_2),

  // hiring section
  '{{hiring_eyebrow}}':          esc(hiring.eyebrow),
  '{{hiring_line}}':             esc(hiring.line),
  '{{hiring_roles}}':            rolesHtml(hiring.roles),
  '{{hiring_students}}':         esc(hiring.students),
  '{{hiring_cta}}':              esc(hiring.cta),
  '{{hiring_reassure}}':         esc(hiring.reassure),

  // camp section
  '{{camp_eyebrow}}':            esc(camp.eyebrow),
  '{{camp_line}}':               esc(camp.line),
  '{{camp_scarcity}}':           esc(camp.scarcity),
  '{{camp_cta}}':                esc(camp.cta),

  // footer meta
  '{{site_open_label}}':         esc(site.open_label),
  '{{site_open_date}}':          esc(site.open_date),
};

var html = fs.readFileSync(path.join('src', 'index.html'), 'utf8');

for (var key in R) {
  html = html.split(key).join(R[key]);
}

// Safety check — catch any forgotten placeholder
var leftover = html.match(/\{\{[^}]+\}\}/g);
if (leftover) {
  console.error('Build failed: unreplaced placeholders:', leftover);
  process.exit(1);
}

fs.mkdirSync('dist', { recursive: true });
fs.writeFileSync(path.join('dist', 'index.html'), html, 'utf8');
fs.copyFileSync('CNAME', path.join('dist', 'CNAME'));

if (fs.existsSync('admin')) {
  copyDir('admin', path.join('dist', 'admin'));
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  fs.readdirSync(src, { withFileTypes: true }).forEach(function(entry) {
    var s = path.join(src, entry.name);
    var d = path.join(dest, entry.name);
    if (entry.isDirectory()) { copyDir(s, d); } else { fs.copyFileSync(s, d); }
  });
}

console.log('Build complete -> dist/index.html');
