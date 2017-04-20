//npm install https://github.com/mapbox/node-sqlite3/tarball/master

var ids = 0;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database("LenskitJobs");
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname,'public')));

db.serialize(function() {
	db.run("drop table if exists Jobs");
	db.run("create table Jobs ("
		+ " id char(100) PRIMARY KEY NOT NULL,"
		+ " description char(500),"
		+ " type char(30) NOT NULL,"
		+ " completed integer NOT NULL,"
		+ " estimatedSteps integer,"
		+ " completedSteps integer NOT NULL,"
		+ " startTime integer NOT NULL,"
		+ " finishTime integer,"
		+ " parentID char(100))");
});

app.get('/', function (req, res) {
	res.sendFile(__dirname+'/index.html');
});

io.on('connection', function(socket) {
	// Prepare and send experiments as dropdown contents
	socket.on('sent dropdown', function(msg) {
		console.log('Received dropdown fill request.');
		var arr = [];
		var arrExp = [];
		var count = 0;
		var experimentFound = false;
		db.all("select parentID from Jobs where type = 'tt-job'", function(err, rows) {
			rows.forEach(function (row) {
				if(arrExp.indexOf(row.parentID) === -1) {
					count++;
					arrExp.push(row.parentID);
					arr.push('<button onclick="experimentSelect()" id="' + row.parentID + '" class="btn">Experiment ' + count + '</button><br>');
					experimentFound = true;
				}
			});
			if(experimentFound)
				io.emit('sent dropdown', arr.join(""));
			else
				io.emit('sent dropdown', '<button class="btn">No Experiments Found</button><br>');
		});
	});
	
	// Prepare and send jobs as table contents
	socket.on('sent jobs', function(msg) {
		console.log('Received table job fill request. id="' + msg + '"');
		var arr = [];
		var jobsFound = false;
		db.all("select rowid, * from Jobs", function(err, rows) {
			arr.push(
				'<thead><tr>' +
				'<th>ID</th>' +
				'<th>Status</th>' +
				'<th>Start</th>' +
				'<th>Finish</th>' +
				'<th>Progress</th>' +
				'<th>Description</th>' +
				'</tr></thead><tbody>');
			rows.forEach(function (row) {
				if(row.parentID == msg) {
					// Start Time Conversion
					var sD = new Date(row.startTime);
					var sm = (parseInt(('00' + sD.getMonth()).substr(-2))+1);
					var sd = ('00' + sD.getDate()).substr(-2);
					var sy = sD.getFullYear();
					var sh = ('00' + sD.getHours()).substr(-2);
					var sn = ('00' + sD.getMinutes()).substr(-2);
					var ss = ('00' + sD.getSeconds()).substr(-2);
					var startT = sm + "/" +  sd + "/" + sy + " - " + sh + ":" + sn + ":" + ss;
					
					var finishT;
					var progress;
					var currentStatus = 'Waiting';
					
					// Gather data from subjobs of jobs
					rows.forEach(function (row2) {
						if(row.id == row2.parentID && row2.type == 'tt-setup' && row2.completed == '0') {
							currentStatus = 'tt-setup';
							finishT = 'Running';
							progress='<progress max="1"></progress>';
						}
						if(row.id == row2.parentID && row2.type == 'tt-train' && row2.completed == '0') {
							currentStatus = 'tt-train';
							finishT = 'Running';
							progress='<progress max="1"></progress>';
						}
						if(row.id == row2.parentID && row2.type == 'tt-test' && row2.completed == '0') {
							currentStatus = 'tt-test';
							finishT = 'Running';
							progress='<progress value="' + row2.completedSteps + '" max="' + row2.estimatedSteps + '"></progress>' + " " + row2.completedSteps + "/" + row2.estimatedSteps;
						}
						if(row.id == row2.parentID && row2.type == 'tt-test' && row2.completed == '1') {
							currentStatus = 'Completed';
							// Finish Time Conversion
							var fD = new Date(row.finishTime);
							var fm = (parseInt(('00' + fD.getMonth()).substr(-2))+1);
							var fd = ('00' + fD.getDate()).substr(-2);
							var fy = fD.getFullYear();
							var fh = ('00' + fD.getHours()).substr(-2);
							var fn = ('00' + fD.getMinutes()).substr(-2);
							var fs = ('00' + fD.getSeconds()).substr(-2);
							finishT = fm + "/" +  fd + "/" + fy + " - " + fh + ":" + fn + ":" + fs;
							// Run Time Conversion
							var s = row.finishTime - row.startTime;
							var ms = s % 1000;
							s = (s - ms) / 1000;
							var secs = s % 60;
							s = (s - secs) / 60;
							var mins = s % 60;
							var hrs = (s - mins) / 60;
							progress = 'Finished In: ' + hrs + 'hr ' + mins + 'min ' + secs + 'sec';
							runT = progress;
						}
						if(row.id == row2.parentID && row2.completed == '2') {
							currentStatus = 'ERROR';
							finishT = 'ERROR';
							progress = 'ERROR';
						}
					});
					arr.push(
						'<tr onclick="jobSelect()" id="' + row.id + '">' +
						'<td onclick="jobSelect()" id="' + row.id + '">' + row.rowid +
						'</td><td onclick="jobSelect()" id="' + row.id + '">' + currentStatus +
						'</td><td onclick="jobSelect()" id="' + row.id + '">' + startT +
						'</td><td onclick="jobSelect()" id="' + row.id + '">' + finishT +
						'</td><td onclick="jobSelect()" id="' + row.id + '">' + progress +
						'</td><td onclick="jobSelect()" id="' + row.id + '">' + row.description +
						'</td></tr>');
					jobsFound = true;
				}
			});
			arr.push('</tbody>');
			if(jobsFound)
				io.emit('sent jobs', arr.join(""));
			else
				io.emit('sent jobs', '<thead><tr><th>Select an Experiment</th></tr></thead>');
		});
	});
	
	// Prepare and send subjobs as table contents
	socket.on('sent subjobs', function(msg) {
		console.log('Received table subjob fill request. id="' + msg + '"');
		var arr = [];
		var jobsFound = false;
		db.all("select rowid, * from Jobs", function(err, rows) {
			arr.push(
				'<thead><tr>' +
				'<th>Type</th>' +
				'<th>Status</th>' +
				'<th>Start</th>' +
				'<th>Finish</th>' +
				'<th>Progress</th>' +
				'</tr></thead><tbody>');
			rows.forEach(function (row) {
				if(row.parentID == msg) {
					// Start Time Conversion
					var sD = new Date(row.startTime);
					var sm = (parseInt(('00' + sD.getMonth()).substr(-2))+1);
					var sd = ('00' + sD.getDate()).substr(-2);
					var sy = sD.getFullYear();
					var sh = ('00' + sD.getHours()).substr(-2);
					var sn = ('00' + sD.getMinutes()).substr(-2);
					var ss = ('00' + sD.getSeconds()).substr(-2);
					var startT = sm + "/" +  sd + "/" + sy + " - " + sh + ":" + sn + ":" + ss;
					
					var finishT;
					var progress;

					// If not completed
					if(row.completed == '0') {
						currentStatus = 'Running';
						finishT = 'Running';
						if(row.type = 'tt-test')
							progress='<progress value="' + row.completedSteps + '" max="' + row.estimatedSteps + '"></progress>' + " " + row.completedSteps + "/" + row.estimatedSteps;
						else
							progress='<progress max="1"></progress>';
					}
					// If completed
					else if(row.completed == '1') {
						currentStatus = 'Completed';
						// Finish Time Conversion
						var fD = new Date(row.finishTime);
						var fm = (parseInt(('00' + fD.getMonth()).substr(-2))+1);
						var fd = ('00' + fD.getDate()).substr(-2);
						var fy = fD.getFullYear();
						var fh = ('00' + fD.getHours()).substr(-2);
						var fn = ('00' + fD.getMinutes()).substr(-2);
						var fs = ('00' + fD.getSeconds()).substr(-2);
						finishT = fm + "/" +  fd + "/" + fy + " - " + fh + ":" + fn + ":" + fs;
						// Run Time Conversion
						var s = row.finishTime - row.startTime;
						var ms = s % 1000;
						s = (s - ms) / 1000;
						var secs = s % 60;
						s = (s - secs) / 60;
						var mins = s % 60;
						var hrs = (s - mins) / 60;
						progress = 'Finished In: ' + hrs + 'hr ' + mins + 'min ' + secs + 'sec';
					}
					
					if(row.completed == '2') {
						currentStatus = 'ERROR';
						finishT = 'ERROR';
						progress = 'ERROR';
					}
					arr.push(
						'<tr onclick="goBack()">' +
						'</td><td onclick="goBack()">' + row.type +
						'</td><td onclick="goBack()">' + currentStatus +
						'</td><td onclick="goBack()">' + startT +
						'</td><td onclick="goBack()">' + finishT +
						'</td><td onclick="goBack()">' + progress +
						'</td></tr>');
					jobsFound = true;
				}
			});
			arr.push('</tbody>');
			if(jobsFound)
				io.emit('sent subjobs', arr.join(""));
			else
				io.emit('sent subjobs', '<thead><tr><th>Error: So Subjobs Found</th></tr></thead>');
		});
	});
});

app.get('/drop', function (req, res) {
	res.send('Database Dropped');
})

app.post('/', function(req, res) {
	var id = req.body.id;
	id = id.toString();
	var type = req.body.type;
	var description = req.body.description;
	var eventNumber=req.body.eventNumber;
	var expectedSteps = parseInt(req.body.expectedSteps);
	var completed = req.body.completed;
	var parentID = req.body.parentID;
	parentID = parentID.toString();
	var stepsFinished = req.body.stepsFinished;
	if (eventNumber==="0") {
		var finishingTime=null;
		var startingTime = new Date().getTime();
		db.run("insert into Jobs (id, description, type, completed, estimatedSteps, completedSteps, startTime, finishTime, parentID) VALUES " +
			"('" + id + "','" + description + "','" + type + "'," + completed  +
			", " + expectedSteps  + ", " + stepsFinished  + ", " + startingTime +
			", " + finishingTime + ", '" + parentID + "')");
	}
	else if (eventNumber==="1") {
		db.run("update Jobs set completedSteps = " + stepsFinished + " where id = '" + id + "';");
	}
	else if (eventNumber==="2") {
		var finishingTime = new Date().getTime();
		db.run("update Jobs set completedSteps = " + stepsFinished + ", completed = " + completed + ", finishTime = " + finishingTime + " where id = '" + id + "';");
	}
	res.end('It worked!');
})

http.listen(3000, function () {
	console.log('Example app listening on port 3000!');
})
