var express = require("express"), 
    io = require("socket.io"),
    fs = require("fs");

var app = express.createServer(),
    io = io.listen(app);

app.listen(process.env.PORT);
app.register('.html', require('ejs'));
app.set('view options', {
    layout: false
});

var pool = {};

io.sockets.on('connection', function(socket) {
    pool[socket.id] = socket;
    
    socket.emit('message', {
        text: 'welcome'
    });
    emitAll("users", { online: Object.keys(pool).length });
    
    socket.on('message', function(data) {
        emitAll("message", data);
    });
    
    socket.on('chunk-send', function (data) {
        console.log('chunk-send');
        socket.emit('chunk-received', { ja: true });
        emitAll('filepart', data);
    });
    
    socket.on('filecomplete', function (data) {
        emitAll('filecomplete', data);
    });
    
    socket.on('disconnect', function(){
       delete pool[socket.id];
       emitAll("users", { online: Object.keys(pool).length });
    });
});

function emitAll(type, data) {
    for (var id in pool) {
        if (pool.hasOwnProperty(id)) {
            pool[id].emit(type, data);
        }
    }
}

app.get("/", function(req, res) {
    res.render('client.html', { 
        title: 'My Site', 
        url: 'http://socketiodemo.janjongboom.c9.io' 
    });
});

app.get(/(.*?\.js)$/, function(req, res) {
    res.header("content-type", "application/javascript");
    fs.readFile("./" + req.params[0], "utf8", function(err, content) {
        res.send(content);
    });
});