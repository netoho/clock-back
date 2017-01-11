const http = require('http')
        , fortune = require('fortune')
        , fortuneHTTP = require('fortune-http')
        , jsonApiSerializer = require('fortune-json-api')
        , mongodbAdapter = require('fortune-mongodb')
        , socketio = require('socket.io')
        , moment = require('moment')
        , url = require('url');

var selectedTimezone = null;

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

const getFormatedDate = (md) => ({
  seconds: md.seconds(),
  minutes: md.minutes(),
  hours: md.hours(),
  day: md.format('dddd'),
  offset: md.utcOffset() / 60
});

const getTimezoneDate = (timezone) => {
  let date = new Date();
  let momentDate = timezone ? moment(date).utcOffset(timezone) : moment(date);
  return getFormatedDate(momentDate);
}

const server = http.createServer((request, response) => {

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Request-Method', '*');
    response.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, POST,HEAD, OPTIONS,PUT, DELETE');
    response.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if ( request.method === 'OPTIONS' ) {
    
    response.writeHead(200);
    response.end();
    return;
  }

  if(request.url.startsWith('/date')) {
    let params = url.parse(request.url, true).query;
    try {
      selectedTimezone = parseInt(params.timezone);
    } catch (e) {
      console.log(e);
      selectedTimezone = null;
    }
    let json = JSON.stringify(getTimezoneDate(selectedTimezone));
    response.writeHead(200, {"Content-Type": "application/json"});
    response.end(json);
  } else {
    listener(request, response).catch(error => { /* error logging */ });
  }
});

let io = socketio('7000');

io.on('connection', function (socket) {
  socket.on('timezone', function (data) {
    try {
      selectedTimezone = parseInt(data);
    } catch (e) {
      console.log(e);
      selectedTimezone = null;
    }
  })
});

setInterval(() => {
  io.sockets.emit('message', getTimezoneDate(selectedTimezone));
}, 1000);

server.listen(8080);