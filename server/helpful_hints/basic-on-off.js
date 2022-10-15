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
const pin = 21;
rpio.open(pin, rpio.OUTPUT, rpio.LOW);



console.log('server up');


//send data from socket
io.on('connection', (socket) => {
    console.log('connection');
    socket.on('SEND', (data) => {

        if (rpio.read(pin) == 1) {
            rpio.write(pin, rpio.LOW);
        }
        else {
            rpio.write(pin, rpio.HIGH);
        }

        console.log('pin ' + pin + ': ', rpio.read(pin));


    });
});


//init server
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
http.listen(3000, () => {
  console.log('listening on *:3000');
});
