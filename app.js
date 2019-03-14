var express = require('express');
var app = express();
var fs = require('fs');
var http = require('http'); 
var ip = require('ip');
var ExpressPeerServer = require('peer').ExpressPeerServer;

app.use(express.static(__dirname)); 

app.get('/', function (req, res) {
    res.sendFile('/index.html', { root: __dirname })
});

app.get('/shared', function (req, res) {
    res.sendFile('/index.html', { root: __dirname })    
});

app.get('/error', function(req, res){
    res.redirect('/error.html');
});

var server = http.createServer(app);
console.log("http://"+ip.address()+":"+ 3000);
var io = require('socket.io')(server);

io.on("connection", function(socket){
    socket.on("send message", function(sent_msg, callback){
        io.sockets.emit("update messages", sent_msg);
        callback();
    });
    socket.on('end', function (){
        socket.disconnect(0);
    });
});

io.sockets.on('disconnect', function() {
    // handle disconnect
    console.log("disonnecting..");
    io.sockets.disconnect();
    io.sockets.close();
});


server.listen(3000);

var options = {
    debug: true
}

var peerserver = ExpressPeerServer(server, options);

app.use('/api', peerserver);

function getCurrentDate(){
    var currentDate = new Date();
    var day = (currentDate.getDate()<10 ? '0' : '') + currentDate.getDate();
    var month = ((currentDate.getMonth() + 1)<10 ? '0' : '') + (currentDate.getMonth() + 1);
    var year = currentDate.getFullYear();
    var hour = (currentDate.getHours()<10 ? '0' : '') + currentDate.getHours();
    var minute = (currentDate.getMinutes()<10 ? '0' : '') + currentDate.getMinutes();
    var second = (currentDate.getSeconds()<10 ? '0' : '') + currentDate.getSeconds();

    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}