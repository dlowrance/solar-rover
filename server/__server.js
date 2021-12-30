const pin = 21;


const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const gpio = require('rpi-gpio');
const gpiop = gpio.promise;
const webroot = __dirname + '/../../build';

http.listen(8080); //listen to port 8080
app.use(express.static(webroot));
console.log('server started');



gpiop.setup(pin, gpio.DIR_OUT);

/*
setTimeout(function() {
	gpio.write(pin, true);
	console.log('no errors', 'pin: ' + pin);
}, 100);
*/

function on() {
	gpio.write(pin, true, function(err) {
		if (err) throw err;
		console.log('Written to pin ' + pin); 
	});
}

setTimeout(function() {
	on();
}, 250);
