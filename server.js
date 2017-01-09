const http = require('http');
const fortune = require('fortune');
const fortuneHTTP = require('fortune-http');
const jsonApiSerializer = require('fortune-json-api');
const mongodbAdapter = require('fortune-mongodb');
const socketio = require('socket.io');
const moment = require('moment');

const store = fortune({ 
    timezone: { name: String, offset: String }
  }, {
  adapter: [
    mongodbAdapter, { url: 'mongodb://localhost:27017/clock' }
  ]
});

const listener = fortuneHTTP(store, {
  serializers: [
    [ jsonApiSerializer, { } ]
  ]
});

const getExpandDate = (date) => {
  let momentDate = moment(date);
  return {
      seconds: momentDate.seconds(),
      minutes: momentDate.minutes(),
      hours: momentDate.hours(),
      day: momentDate.format('dddd'),
      offset: momentDate.utcOffset() / 60
    };
}

const server = http.createServer((request, response) => {

  response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
    response.setHeader('Access-Control-Allow-Headers', '*');
  if ( request.method === 'OPTIONS' ) {
    
    response.writeHead(200);
    response.end();
    return;
  }

  if(request.url === '/date') {
    response.writeHead(200, {"Content-Type": "application/json"});
    let json = JSON.stringify(getExpandDate(new Date()));
    response.end(json);
  } else {
    listener(request, response).catch(error => { /* error logging */ });
  }
});

let io = socketio('7000');

io.on('connection', function (socket) {
});

setInterval(() => {
  io.sockets.emit('message', getExpandDate(new Date()));
}, 1000);

server.listen(8080);