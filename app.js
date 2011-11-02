
/**
 * Module dependencies.
 */
 
var express = require('express');

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.listen(process.env.C9_PORT || 8080);

//
// Add socket.io to our app
//
var io = require('socket.io').listen(app);


//
// Init canvas array of 4 * pixel count octets in rgba structure
//
var canvas = {};
canvas.width = 10;
canvas.height = 10;
canvas.data = {};
canvas.data.length = canvas.height * canvas.width * 4;
for(var i = 0; i < canvas.data.length; i++) {
  canvas.data[i] = 255;
  if(i%4===2) {
    canvas.data[i] = 0;
  }
}

io.sockets.on('connection', function (socket) {
  //console.error(socket);
  socket.emit('raster', canvas);
  socket.on('raster', function(raster) {
    socket.broadcast.emit('raster', raster);
    var index = 4 * (raster.top * canvas.width + raster.left);
    for(var i = 0; i < raster.data.length;) {
      canvas.data[index+i%raster.width] = raster.data[i]
      canvas.data[index+i%raster.width+1] = raster.data[i+1]
      canvas.data[index+i%raster.width+2] = raster.data[i+2]
      canvas.data[index+i%raster.width+3] = raster.data[i+3]
      i+=4;
      if((i/4) % raster.width === 0) {
        index += canvas.width * 4 - raster.width * 4;
      }
    }
  });
});

console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
