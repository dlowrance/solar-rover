const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const rpio = require('rpio');

/* rpio init stuff? */
rpio.init({
    gpiomem: false, /* Use /dev/mem for i²c/PWM/SPI */
    mapping: 'gpio' /* Use the GPIOxx numbering */
});

// Init pin?
const led = 21;

rpio.open(led, rpio.OUTPUT, rpio.LOW);
rpio.open(24, rpio.OUTPUT, rpio.LOW);
rpio.open(23, rpio.OUTPUT, rpio.LOW);

// init base pin 25 as 1 to make pins 23 and 24 work
// this was the main problem, pin needed to be set to high
rpio.open(25, rpio.OUTPUT, rpio.HIGH);

//send data from socket
io.on('connection', (socket) => {
    console.log('connection');

    //turn on when connection
    var status = connection();
    console.log(status);

    var toggle = 0;

    socket.on('SEND', (data) => {

        if (toggle == 1) {
            // LED off
            rpio.write(led, rpio.LOW);
            // nothing
            rpio.write(24, rpio.LOW);
            rpio.write(23, rpio.LOW);

            toggle = 0;
        }
        else {
            // LED on
            rpio.write(led, rpio.HIGH);
            // forward
            rpio.write(24, rpio.HIGH);
            rpio.write(23, rpio.LOW);

            toggle = 1;
        }

        console.log('pin ' + led + ':', rpio.read(led));

    });
});


//init server
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
http.listen(3000, () => {
    console.log('server up');
    console.log('listening on *:3000');
});

//Utility
function connection() {
    if (true) {

    }
    return false;
    return rpio.write(pin, rpio.HIGH);
}
