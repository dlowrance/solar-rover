const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const rpio = require('rpio');

/* rpio init stuff? */
rpio.init({
    gpiomem: false,
    mapping: 'gpio'
});

// Init pin?
const pin = 21;
rpio.open(pin, rpio.OUTPUT, rpio.LOW);



console.log('server up');


/* On for 1 second */
rpio.write(pin, rpio.HIGH);
rpio.sleep(1);

/* Off for half a second (500ms) */
rpio.write(pin, rpio.LOW);
rpio.msleep(500);
