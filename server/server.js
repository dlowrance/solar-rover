const express = require('express');
const app = express();
const http = require('http').Server(app);
const rpio = require('rpio'); // https://www.npmjs.com/package/rpio
const pwm = require('rpio-pwm'); // https://www.npmjs.com/package/rpio-pwm
const io = require('socket.io')(http, {
    //origins:['solar.dlowrance.com'], //not needed? idk why :'(
    path:'/ws'
});

// GPIO PINOUT:
// https://www.raspberrypi.org/documentation/usage/gpio/

/* rpio init stuff? */
rpio.init({
    gpiomem: false, /* Use /dev/mem for i²c/PWM/SPI */
    mapping: 'gpio' /* Use the GPIOxx numbering */
});



// Must init pins - this remains until reboot or redefinition
// rpio.open(led, rpio.OUTPUT, rpio.LOW);
rpio.open(24, rpio.OUTPUT, rpio.LOW);
rpio.open(23, rpio.OUTPUT, rpio.LOW);

rpio.open(14, rpio.OUTPUT, rpio.LOW);
rpio.open(15, rpio.OUTPUT, rpio.LOW);

//test pin
rpio.open(17, rpio.OUTPUT, rpio.LOW);


//attempt at PWM
rpio.open(12, rpio.PWM, rpio.LOW);
rpio.pwmSetClockDivider(64);
rpio.pwmSetRange(12, 1024);



// https://github.com/jperkin/node-rpio#pwm
// 40-pin models: pins 12, 32, 33, 35 - gave me 1 PWM result (lol)



// init base pin 25 as 1 to make pins 23 and 24 work
// this was the main problem, pin needed to be set to high
rpio.open(25, rpio.OUTPUT, rpio.HIGH);
rpio.open(18, rpio.OUTPUT, rpio.HIGH);

io.on('connection', (socket) => {

    //turn on when connection
    var status = connection();
    //console.log(status);

    var toggle = {
        forward: 0,
        reverse: 0,
        left: 0,
        right: 0
    };


    /**
     * CMD
     */
    socket.on('CMD', (data) => {

        switch(data.action) {

            case 'forward':
                if (toggle.forward == 1) {

                    // What I want to do most is this:
                    // rpio.pwm(24, 0.5) - just a simple pin 24 at on/off. frequency variations added in as the third optional
                    rpio.write(24, rpio.LOW);
                    rpio.write(23, rpio.LOW);
                    toggle.forward = 0;
                }
                else {
                    // forward
                    console.log('go forward');
                    rpio.write(24, rpio.HIGH);
                    rpio.write(23, rpio.LOW);
                    toggle.forward = 1;
                }
            break;

            case 'reverse':
                if (toggle.reverse == 1) {
                    rpio.write(24, rpio.LOW);
                    rpio.write(23, rpio.LOW);
                    toggle.reverse = 0;
                }
                else {
                    // reverse
                    console.log('go reverse');
                    rpio.write(24, rpio.LOW);
                    rpio.write(23, rpio.HIGH);
                    toggle.reverse = 1;
                }
            break;

            case 'left':
                if (toggle.left == 1) {
                    rpio.write(14, rpio.LOW);
                    rpio.write(15, rpio.LOW);
                    toggle.left = 0;
                }
                else {
                    // left
                    console.log('go left');
                    rpio.write(14, rpio.LOW);
                    rpio.write(15, rpio.HIGH);
                    toggle.left = 1;
                }
            break;

            case 'right':
                if (toggle.right == 1) {
                    rpio.write(14, rpio.LOW);
                    rpio.write(15, rpio.LOW);
                    toggle.right = 0;
                }
                else {
                    // right
                    console.log('go right');
                    rpio.write(14, rpio.HIGH);
                    rpio.write(15, rpio.LOW);
                    toggle.right = 1;
                }
            break;


            case 'test':
                if (!isNaN(data.pin)) {

                    // This is tighly coupled with rpio. The input value must be <= 26 or rpio lib will throw an error
                    if (data.pin <= 26) {

                        // Turn test pin #:ON
                        if (data.state == 'mousedown') {
                            // dunno what this is but keeping it here
                            //rpio.open(data.pin, rpio.OUTPUT, rpio.LOW);
                            rpio.write(data.pin, rpio.HIGH);
                        }
                        // Turn test pin #:OFF
                        else {
                            rpio.write(data.pin, rpio.LOW);
                        }

                        //console.log('pin:', data.pin, 'high');
                        //socket.emit('response', 'wooop woop');
                        //console.log(data);

                    }

                }

            break;

            default:
                console.log('Shut all off');

                rpio.write(24, rpio.LOW);
                rpio.write(23, rpio.LOW);
                rpio.write(14, rpio.LOW);
                rpio.write(15, rpio.LOW);

                toggle.forward = 0;
                toggle.reverse = 0;
                toggle.left = 0;
                toggle.right = 0;

        }

    });

    /**
     * PWM
     */
    var currentPercent = 0;
    socket.on('pwm', (data) => {
        if (data.pwm != currentPercent) {
            console.log('pin ' + data.pin, data.pwm + '%');
            currentPercent = data.pwm;
            var decimal = parseFloat(data.pwm / 100);
            var modulation = parseFloat(decimal * 2000);

            var chNum = 14; // DMA channel 14
            var pinNum = data.pin; // GPIO pin #
            var ch = pwm.create_dma_channel(chNum);
            var pin = ch.create_pwm(pinNum);
            pin.set_width(modulation);

            if (data.pwm < 10) {
                pin.release();
                console.log('released');
            }
        }
    });


});


//init server
http.listen(3000, () => {
    console.log('listening on *:3000');
});

//Utility
function connection() {
    if (true) {

    }
    return false;
    //return rpio.write(pin, rpio.HIGH);
}
