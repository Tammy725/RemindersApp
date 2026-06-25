const http = require('http');

const PORT = Number(process.env.PORT || 8787);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const TRANSCRIBE_MODEL = process.env.OPENAI_TRANSCRIBE_MODEL || 'gpt-4o-mini-transcribe';
const TASK_MODEL = process.env.OPENAI_TASK_MODEL || 'gpt-4o-mini';
const MAX_BODY_BYTES = 28 * 1024 * 1024;

function sendJson(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
        reject(new Error('El audio es demasiado grande.'));
        req.destroy();
      }
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(new Error('JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

function addDays(ymd, days) {
  const date = new Date(`${ymd}T12:00:00`);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

async function transcribeAudio(audioBuffer, mimeType) {
  const extension = mimeType.includes('m4a') ? 'm4a' : 'mp4';
  const form = new FormData();
  const blob = new Blob([audioBuffer], { type: mimeType || 'audio/mp4' });
  form.append('file', blob, `voice-note.${extension}`);
  form.append('model', TRANSCRIBE_MODEL);
  form.append('language', 'es');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: form,
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'OpenAI no pudo transcribir el audio.');
  }
  return payload.text || '';
}

async function extractTasks(transcript, today) {
  const tomorrow = addDays(today, 1);
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            date: { type: 'string' },
          },
          required: ['title', 'date'],
        },
      },
    },
    required: ['tasks'],
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: TASK_MODEL,
      temperature: 0.2,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'voice_tasks',
          strict: true,
          schema,
        },
      },
      messages: [
        {
          role: 'system',
          content:
            'Eres un asistente que convierte dictados en tareas claras. Devuelve solo tareas reales. Usa palabras como uno, dos, tres, primero, luego como separadores, pero no las incluyas en el texto. Corrige redacción, resume sin perder el objetivo y escribe en español natural. Si no se menciona fecha, usa hoy. Si dice mañana, usa la fecha de mañana. Las fechas deben ser YYYY-MM-DD.',
        },
        {
          role: 'user',
          content: `Hoy es ${today}. Mañana es ${tomorrow}.\n\nTranscripción:\n${transcript}`,
        },
      ],
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || 'OpenAI no pudo ordenar las tareas.');
  }
  const content = payload.choices?.[0]?.message?.content || '{"tasks":[]}';
  return JSON.parse(content).tasks || [];
}

async function handleTranscribeTasks(req, res) {
  if (!OPENAI_API_KEY) {
    sendJson(res, 500, { error: 'Falta OPENAI_API_KEY en el backend.' });
    return;
  }

  const body = await readJsonBody(req);
  if (!body.audioBase64) {
    sendJson(res, 400, { error: 'Falta audioBase64.' });
    return;
  }

  const today = body.today || new Date().toISOString().slice(0, 10);
  const audioBuffer = Buffer.from(body.audioBase64, 'base64');
  const transcript = await transcribeAudio(audioBuffer, body.mimeType || 'audio/mp4');
  const tasks = await extractTasks(transcript, today);
  sendJson(res, 200, { transcript, tasks });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      sendJson(res, 200, {});
      return;
    }
    if (req.method === 'GET' && req.url === '/health') {
      sendJson(res, 200, { ok: true });
      return;
    }
    if (req.method === 'POST' && req.url === '/transcribe-tasks') {
      await handleTranscribeTasks(req, res);
      return;
    }
    sendJson(res, 404, { error: 'Ruta no encontrada.' });
  } catch (e) {
    sendJson(res, 500, { error: e.message || 'Error inesperado.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Voice backend listo en http://localhost:${PORT}`);
});
