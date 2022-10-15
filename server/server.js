const http = require('http').createServer();
const { exec } = require('child_process');
const Gpio = require('pigpio').Gpio;    // https://npm.io/package/pigpio
const io = require('socket.io')(http, {
    //origins:['solar.dlowrance.com'], //not needed? idk why :'(
    path:'/ws'
});

var status = connection();
io.emit('connection', true);

// Pin 25 needs to be set to 1 in order for the H-bridge to work
const h_bridge_on = new Gpio(25, {mode: Gpio.OUTPUT});
h_bridge_on.digitalWrite(1);

const pin_forward = new Gpio(24, {mode: Gpio.OUTPUT});
const pin_reverse = new Gpio(23, {mode: Gpio.OUTPUT});
const servo_motor = new Gpio(12, {mode: Gpio.OUTPUT});


// Init
var _settings = {
    camera: {
    },
};

io.on('connection', (socket) => {
    console.log(socket.id + ' connected.');

    let currentPower = 0;
    let currentDirection = 0;

    socket.on('drive', (input) => {

        /**
         *      FORWARD/REVERSE
         */
        let power = input.p;
        if (power != currentPower) {
            currentPower = power;
            let decimal = Math.abs(parseFloat(power / 100));
            // 255 is max
            let modulation = parseFloat(decimal * 255) > 255 ? 255 : parseFloat(decimal * 255); // never go outside [0, 255] - will throw error
            // Convert to int
            modulation = parseInt(modulation);

            // Forward
            if (power >= 0) {
                pin_reverse.pwmWrite(0);
                pin_forward.pwmWrite(modulation);
            }
            // Reverse
            else {
                pin_forward.pwmWrite(0);
                pin_reverse.pwmWrite(modulation);
            }
        }

        /**
         *      LEFT/RIGHT
         */
        let direction = input.d;
        let directionWithLimits = 0;
        if (direction != currentDirection) {
            currentDirection = direction;

            // the percentage the rover maxes out on left/right
            limits = {
                left: 52,
                right: 53
            };
            buffer = 10; // add a buffer % so max turning doesnt occur at 0 deg and 180 exactly [0 + buffer%] and [180 - buffer%]

            // adjusted for above limits
            directionWithLimits = (direction < 0) ? parseInt(limits.left + buffer) / 100 * direction : parseInt(limits.right + buffer) / 100 * direction;

            let adjustedDir = (directionWithLimits + 100) / 2;

            let decimal = parseInt(Math.abs(adjustedDir)) / 100;
            let min = 500;              // this needs to be calibrated to what complete left is
            let max = 2000;             // this needs to be calibrated to what complete right is

            let pulseWidth = min + (max * decimal);

            //console.log('before clipping: ', pulseWidth);

            // Clipping - this is manually set but in the future should be dynamically generated probably
            pulseWidth = pulseWidth <= 1000 ? 1000 : pulseWidth;
            pulseWidth = pulseWidth >= 2020 ? 2020 : pulseWidth;

            //500 is left - 2500 is right --- values outside [500, 2500] will throw an error
            if (pulseWidth < 500) pulseWidth = 500;
            if (pulseWidth > 2500) pulseWidth = 2500;

            //console.log(pulseWidth);
            servo_motor.servoWrite(pulseWidth);
        }

    });


    /**
     *      SETTINGS
     */

    socket.emit('settings', _settings);

    isRunning('mjpg_streamer', (status) => {
        console.log(status); // true|false
        _settings.camera = status ? 'on' : 'off';
        socket.emit('settings', _settings);
    })


    // Adjustments
    socket.on('settings', (setting) => {

        // CAMERA
        if ('camera' in setting) {

            var cmd = '';
            var status = '';
            if (setting.camera == 'on') {
                cmd = 'sh ' + __dirname + '/../start-cam.sh';
                status = 'on';
            }
            else {
                cmd = 'sh ' + __dirname + '/../stop-cam.sh';
                status = 'off';
            }
            console.log(cmd);
            exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    // node couldn't execute the command
                    console.log('error: ' + stderr);
                    return;
                }

                // the *entire* stdout and stderr (buffered)
                console.log(`stdout: ${stdout}`);
                console.log(`stderr: ${stderr}`);

                _settings.camera = status
                socket.emit('settings', _settings);
            });
        }
        // CAMERA - END

    });

    socket.on('get', function(data) {
        // UPTIME
        if (data == 'uptime') {

            exec('uptime', (err, stdout, stderr) => {
                if (err) {
                    // node couldn't execute the command
                    console.log('error: ' + stderr);
                    return;
                }

                //put this in a generic "update settings" function
                var newSettings = Object.assign({}, _settings);
                newSettings.uptime = stdout;
                _settings = newSettings;
                socket.emit('settings', newSettings);
                console.log(_settings);
            });

        }
    });

    socket.on('RESTART', function() {
        console.log('Restart Now!');
        exec('sudo reboot', (err, stdout, stderr) => {
            if (err) {
                // node couldn't execute the command
                console.log('error: ' + stderr);
                return;
            }
            //console.log('Restarting...'); // Doesn't get here.. as expected
        });
    });

});

//init server
var port = 3030;
http.listen(port, () => {
    console.log('listening on *:' + port);
});

//Utility
function connection() {
    if (true) {

    }
    return false;
    //return rpio.write(pin, rpio.HIGH);
}


const isRunning = (query, cb) => {
    let platform = process.platform;
    let cmd = '';
    switch (platform) {
        case 'win32' : cmd = `tasklist`; break;
        case 'darwin' : cmd = `ps -ax | grep ${query}`; break;
        case 'linux' : cmd = `ps -A`; break;
        default: break;
    }
    exec(cmd, (err, stdout, stderr) => {
        cb(stdout.toLowerCase().indexOf(query.toLowerCase()) > -1);
    });
}
