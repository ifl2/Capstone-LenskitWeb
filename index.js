var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(path.join(__dirname,'public')));

app.get('/', function(req, res){
	res.sendFile(__dirname+'/index.html');
    });

io.on('connection', function(socket){
	//server received the request 'msg' from the web
	socket.on('chat message', function(msg){
		if(msg === '0'){
		    console.log('start the web, send type of algoritms to fill dropdown');
		}
		else{
		    console.log('Revceived the value: ' + msg + ' from website');
		}

		//server sent array with all the info for the table
		arr = [];
		for(count = 0; count < 10; count++) {
		    s = '<tr><td>' + count + '</td><td>Inside Server</td><td>HELP</td><td>GOOD</td><td>haha</td><td>RunTime</td><td><progress value="11" max="\
100"></progress></td></tr>';
		    arr[count] = s;
		}

		io.emit('chat message', arr);
	    });
    });

http.listen(3000, function(){
	console.log('listening on localhost:3000');
    });
   