'use strict';
const zmq = require('zmq');
const req = zmq.socket('req');
const req_adress = 'tcp://localhost:8880';

req.on('message', function(data) {
  console.log ('The log file : \n' + data);
});

req.connect(req_adress);

console.log('Sending a request for the the log file');
req.send('send'); //when reading send, the Player sends the log
