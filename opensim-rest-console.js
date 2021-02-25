#!/usr/bin/env node

/*
 | This piece of code is published by thomax (tx0h) (c) 2018 under the
 | Artistic License 1.0 (http://www.perlfoundation.org/artistic_license_1_0)
 */

// CHANGE THIS TO YOUR NEEDS!
const username	= "username";
const password	= "password";
const BaseURL	= "http://simhostnameorip:12345";

const ReadLine	= require('readline');
const Client	= require('node-rest-client').Client;
var events		= require('events');
var restSessionID;
var readLine;

 
const headers = {
	"Content-Type": "application/x-www-form-urlencoded",
	"User-Agent": "nodejs-console/0.01"
};

function openRestSession() {
	var client = new Client();
	var args = {
	    data: {
			"USER": username,
			"PASS": password
		},
		headers,
	};

	client.post(BaseURL + "/StartSession/", args, function (data, response) {
		try {
			restSessionID = data.ConsoleSession.SessionID;
			if(restSessionID) {
				eventEmitter.emit('rest_session_opened');
			}
		} catch(err) {
			console.log("oops "+err+"\nstatusMessage: "+response.statusMessage);
		}
	});
}

function closeRestSession() {
	var client = new Client();
	var args = {
		data: { "ID": restSessionID },
		headers
	};
	
	client.post(BaseURL + "/CloseSession/", args, function (data, response) {
		console.log("close_session: "+response);
	});

	console.log('Have a great day!');
	process.exit(0);
}
 
function readRestSession() {
	var client = new Client();
	var args = {
		data: { "ID": restSessionID },
		headers
	};
	
	client.post(BaseURL + "/ReadResponses/"+restSessionID+"/", args, function (data, response) {
		try {
			if(data.ConsoleSession.Line) {
				for(var i=0; i < data.ConsoleSession.Line.length; i++) {
					if(data.ConsoleSession.Line[i]._) {
						console.log(data.ConsoleSession.Line[i]._);
					}
				}
				readLine.prompt();
			}
		} catch(err) {
			console.log("oops "+err);
		}
	});
}
 
function executeRestCommand(cmd) {
	var client = new Client();
	var args = {
		data: {
			"ID": restSessionID,
			"COMMAND": cmd
		},
		headers
	};
	
	client.post(BaseURL + "/SessionCommand/", args, function (data, response) {
	});
}
 

function mainLoop() {

	readLine = ReadLine.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: 'REST CONSOLE> '
	});

	readRestSession();

	setInterval(readRestSession, 5000);

	readLine.on('line', (line) => {
		switch (line.trim()) {
			case 'exit':
				closeRestSession();
				break;
			case 'quit':
				console.log("to quit opensim write 'quitquit'");
				break;
			case 'quitquit':
				executeRestCommand('quit');
				break;
			default:
				executeRestCommand(line.trim());
				break;
		}
		readRestSession();
	}).on('close', () => {
		closeRestSession();
	});
}

process.on('uncaughtException', function (exception) {
	// handle or ignore error
	switch(exception.code) {
		case 'ECONNRESET':
			console.log("econnreset, ignore.");
			break;
		case 'ECONNREFUSED':
			console.log("econnrefused, sim seems to be down.");
			process.exit(1);
			break;
		default:
			console.log(exception);
	}
});

var eventEmitter = new events.EventEmitter();
eventEmitter.on('rest_session_opened', mainLoop);
openRestSession();
