//npm install https://github.com/mapbox/node-sqlite3/tarball/master

var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("LenskitJobs");
var ids = 0;
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));

db.serialize(function() {
  db.run("drop table if exists Jobs");
  db.run("drop table if exists Connections");
  db.run("create table Jobs ("
    + " id char(100) PRIMARY KEY NOT NULL,"
    + " description char(500),"
    + " type char(30) NOT NULL,"
    + " completed BOOL NOT NULL,"
    + " estimatedSteps integer,"
    + " completedSteps integer NOT NULL,"
    + " startTime integer NOT NULL,"
    + " finishTime integer)");

  db.run("create table Connections ("
    + " childID char(100) PRIMARY KEY NOT NULL,"
    + " parentID char(100))");
})

app.get('/', function (req, res) {
  res.sendFile(__dirname+'/index.html');
});

io.on('connection', function(socket){
  var arr = [];
  //server received the request 'msg' from the web
  socket.on('sent jobs', function(msg){
	if(msg == '0') {
		console.log('Received the value: ' + msg + ' from website: Fill out dropdown');
		// send all experiments to website to be added to dropdown
		
		db.all("select * from Jobs", function(err, rows) {
			rows.forEach(function (row) {
				progress='<progress value="' + row.completedSteps + '" max="' + row.estimatedSteps + '"></progress>';
				if(row.completed == '0') {
					completed='Running';
					runTime='Running';
					if(row.estimatedSteps == '-1') progress='<progress max="1"></progress>';
				}
				else {
					completed='Completed';
					runTime = row.finishTime - row.startTime;
					if(row.estimatedSteps == '-1') progress='<progress value="1" max="1"></progress>'
				}
				arr.push(
					'<tr><td>' + row.id +
					'</td><td>' + row.description +
					'</td><td>' + row.type +
					'</td><td>' + completed +
					'</td><td>' + row.estimatedSteps +
					'</td><td>' + row.completedSteps +
					'</td><td>' + row.startTime +
					'</td><td>' + row.finishTime +
					'</td><td>' + runTime +
					'</td><td>' + progress +
					'</td></tr>'
				);
		  });
		});
		io.emit('sent jobs', arr.join(""));
	}
	else {
		console.log('Received the value: ' + msg + ' from website: Send experiment ' + msg);
		// send all jobs related to experiment # website to be added by table
	}
  });
});

app.get('/drop', function (req, res) {
  res.send('Database Dropped');
})

app.post('/', function(req, res){
  var id = req.body.id;
  id = id.toString();
  var type = req.body.type;
  var description = req.body.description;
  var eventNumber=req.body.eventNumber;
  var expectedSteps = parseInt(req.body.expectedSteps);
  var completed;
  var parentID = req.body.parentID;
  parentID = parentID.toString();
  if (req.body.completed==="true"){
    completed=1;
  }
  else{
    completed=0;
  }
  var stepsFinished = req.body.stepsFinished;
  if (eventNumber==="0"){
    var finishingTime=null;
    var startingTime = new Date().getTime();

    db.run("insert into Jobs (id, description, type, completed, estimatedSteps, completedSteps, startTime, finishTime) VALUES " +
      "('" + id + "','" + description + "','" + type + "'," + completed  +
      ", " + expectedSteps  + ", " + stepsFinished  + ", " + startingTime +
      ", " + finishingTime + ")");

    if (parentID!=="null"){
      db.run("insert into Connections (childID, parentID) VALUES " +
        "('" + id + "','" + parentID + "')");
    }
  }
  else if (eventNumber==="1"){
    db.run("update Jobs set completedSteps = " + stepsFinished + " where id = '" + id + "';");
  }
  else if (eventNumber==="2"){
    var finishingTime = new Date().getTime();
    db.run("update Jobs set completedSteps = " + stepsFinished + ", completed = " + completed + ", finishTime = " + finishingTime + " where id = '" + id + "';");
  }

  res.end('It worked!');
})

http.listen(3000, function () {
  console.log('Example app listening on port 3000!');
})


