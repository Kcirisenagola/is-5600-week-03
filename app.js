const express = require('express');
const path = require('path');
const EventEmitter = require('events');

const port = process.env.PORT || 3000;
const app = express();
const chatEmitter = new EventEmitter();

// Serve static files from the "public" folder (like chat.js)
app.use(express.static(__dirname + '/public'));

// Routes
app.get('/', chatApp);         // Serve chat.html
app.get('/json', respondJson); // JSON response
app.get('/echo', respondEcho); // Echo input string
app.get('/chat', respondChat); // Receive chat messages
app.get('/sse', respondSSE);   // Send messages via SSE

// ======= ROUTE HANDLERS =======

/**
 * Serves chat.html
 */
function chatApp(req, res) {
  res.sendFile(path.join(__dirname, 'chat.html'));
}

/**
 * Responds with plain text
 */
function respondText(req, res) {
  res.type('text/plain').send('hi');
}

/**
 * Responds with JSON
 */
function respondJson(req, res) {
  res.json({
    text: 'hi',
    numbers: [1, 2, 3],
  });
}

/**
 * Responds with transformed input string
 */
function respondEcho(req, res) {
  const { input = '' } = req.query;
  res.json({
    normal: input,
    shouty: input.toUpperCase(),
    charCount: input.length,
    backwards: input.split('').reverse().join(''),
  });
}

/**
 * Accepts chat messages
 */
function respondChat(req, res) {
  const { message } = req.query;
  console.log('New message:', message);
  chatEmitter.emit('message', message);
  res.end();
}

/**
 * Streams messages to connected clients
 */
function respondSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
  });

  const onMessage = (message) => {
    res.write(`data: ${message}\n\n`);
  };

  chatEmitter.on('message', onMessage);

  // Remove listener when client disconnects
  res.on('close', () => {
    chatEmitter.off('message', onMessage);
  });
}

// Start the server
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
