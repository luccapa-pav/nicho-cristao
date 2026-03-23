var httpsModule = require('https');

var imageData = $('Sub: Generate Videos/Images1').first().json;
var audioData = $('SUB: Audio Generation (ElevenLabs)').first().json;
var contentData = $('Sub: Generate Content').first().json;

var videoId = imageData.videoId || audioData.videoId;
var audioUrl = audioData.audioUrl;
if (!audioUrl) throw new Error('No audioUrl for ' + videoId);

var scenes = (imageData.scenes || [])
  .filter(function(s) { return s.url; })
  .sort(function(a, b) { return (a.numero || 0) - (b.numero || 0); });
if (!scenes.length) throw new Error('No scene URLs for ' + videoId);

var CREATOMATE_KEY = '738b45bd6c674fb195ba30c3b4249378e86aa852a471d1cd79dbd0b99f41d1d3c9ed3f8b2f2d5368cf6ca80e69b29f84';

// Pixabay background music (CDN direto)
var MUSIC_TRACKS = [
  'https://cdn.pixabay.com/audio/2022/12/13/audio_a7e11a169f.mp3', // Epic Inspiration 129171
  'https://cdn.pixabay.com/audio/2024/05/28/audio_5bbbca17bf.mp3' // Miracle 212835
];
var validTracks = MUSIC_TRACKS.filter(function(u) { return u.startsWith('https://'); });
var musicUrl = validTracks.length ? validTracks[Math.floor(Math.random() * validTracks.length)] : null;
var hasMusic = !!musicUrl;

// Pre-calcular duracao total das cenas
var totalDuration = scenes.reduce(function(s, c) { return s + (c.duracao || 6); }, 0);

// Build elements
var elements = [];

// Track 1: Narracao com transcript para legendas automaticas
elements.push({
  id: 'narracao',
  type: 'audio',
  track: 1,
  time: 0,
  source: audioUrl,
  volume: '100%',
  transcript: true
});

// Track 2: Musica de fundo limitada a duracao das cenas (evita esticar o video)
if (hasMusic) {
  elements.push({
    type: 'audio',
    track: 2,
    time: 0,
    duration: totalDuration,
    source: musicUrl,
    volume: '12%',
    loop: true,
    fade_out: '2 s'
  });
}

// Track 3: Cenas de video com timing cumulativo
var cumulativeTime = 0;
scenes.forEach(function(s) {
  var dur = s.duracao || 6;
  elements.push({
    type: 'video',
    track: 3,
    time: cumulativeTime,
    duration: dur,
    source: s.url,
    volume: '0%',
    fit: 'cover',
    width: '100%',
    height: '100%'
  });
  cumulativeTime += dur;
});

// Track 4: Gradiente na parte inferior
elements.push({
  type: 'shape',
  track: 4,
  path: 'M 0 0 L 100 0 L 100 100 L 0 100 L 0 0 Z',
  width: '100%',
  height: '50%',
  x: '50%',
  y: '100%',
  x_anchor: '50%',
  y_anchor: '100%',
  fill_color: [
    { color: 'rgba(0,0,0,0)', offset: '0%' },
    { color: 'rgba(0,0,0,0.85)', offset: '100%' }
  ],
  fill_mode: 'linear',
  fill_x0: '50%',
  fill_x1: '50%',
  fill_y0: '0%',
  fill_y1: '100%'
});

// Track 5: Legendas karaoke da narracao
elements.push({
  id: 'legendas',
  type: 'text',
  track: 5,
  transcript_source: 'narracao',
  transcript_effect: 'karaoke',
  transcript_maximum_length: 4,
  width: '88%',
  x: '50%',
  y: '83%',
  x_anchor: '50%',
  y_anchor: '50%',
  fill_color: '#ffffff',
  stroke_color: 'rgba(0,0,0,0.9)',
  stroke_width: '1.5 vmin',
  font_weight: '900',
  font_size: '7.5 vmin',
  line_height: '130%',
  x_alignment: '50%',
  y_alignment: '50%'
});

var source = {
  output_format: 'mp4',
  width: 720,
  height: 1280,
  frame_rate: '30 fps',
  duration: 'auto',
  elements: elements
};

function creatomateRequest(method, path, body) {
  return new Promise(function(resolve, reject) {
    var data = body ? JSON.stringify(body) : null;
    var opts = {
      hostname: 'api.creatomate.com',
      path: path,
      method: method,
      rejectUnauthorized: false,
      headers: {
        'Authorization': 'Bearer ' + CREATOMATE_KEY,
        'Content-Type': 'application/json'
      }
    };
    if (data) opts.headers['Content-Length'] = Buffer.byteLength(data);
    var req = httpsModule.request(opts, function(res) {
      var out = '';
      res.on('data', function(d) { out += d; });
      res.on('end', function() {
        try { resolve({ status: res.statusCode, body: JSON.parse(out) }); }
        catch(e) { resolve({ status: res.statusCode, body: out }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, function() { req.destroy(new Error('Creatomate timeout')); });
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }

// Submit render
var submitRes = await creatomateRequest('POST', '/v1/renders', { source: source });
if (submitRes.status !== 200 && submitRes.status !== 201 && submitRes.status !== 202) {
  throw new Error('Creatomate HTTP ' + submitRes.status + ' | ' + JSON.stringify(submitRes.body));
}

var renders = Array.isArray(submitRes.body) ? submitRes.body : [submitRes.body];
var renderId = renders[0].id;
if (!renderId) throw new Error('No render ID: ' + JSON.stringify(renders[0]));

// Poll ate concluir (max 10 min, cada 10s)
var maxPolls = 60;
var renderUrl = null;
for (var i = 0; i < maxPolls; i++) {
  await sleep(10000);
  var pollRes = await creatomateRequest('GET', '/v1/renders/' + renderId, null);
  var render = pollRes.body;
  if (render.status === 'succeeded') { renderUrl = render.url; break; }
  if (render.status === 'failed') throw new Error('Creatomate render failed: ' + (render.error_message || JSON.stringify(render)));
}
if (!renderUrl) throw new Error('Creatomate timeout after ' + maxPolls + ' polls for render ' + renderId);

return [{ json: {
  videoId: videoId,
  renderUrl: renderUrl,
  renderId: renderId,
  sceneCount: scenes.length,
  titulo: contentData.titulo,
  descricao: contentData.descricao,
  hashtags: contentData.hashtags,
  narracao: contentData.narracao,
  topic: contentData.topic,
  status: 'assembled'
} }];
