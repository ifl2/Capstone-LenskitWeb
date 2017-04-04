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
    if(msg === '0'){
      console.log('start the web, send type of algoritms to fill dropdown');
    }
    else{
      console.log('Received the value: ' + msg + ' from website');
    }
    //server sent array with all the info for the table
    db.all("select * from Jobs", function(err, rows) {
      rows.forEach(function (row) {
        arr.push([row.id,row.description,row.type,row.completed,row.estimatedSteps,row.completedSteps,row.startTime,row.finishTime]);
      })
    });

    io.emit('sent jobs', arr);
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


