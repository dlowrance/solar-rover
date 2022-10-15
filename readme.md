# Solar Rover

A Wi-Fi based robot with an onboard camera for out of LoS control.

### Requirements

* Nginx >= 1.14.2
* Node >= 11.9.0
* [pigpio](https://www.npmjs.com/package/pigpio)
* [socket.io](https://www.npmjs.com/package/socket.io)
* [mjpg-streamer](https://github.com/jacksonliam/mjpg-streamer)


### Hardware

* Raspberry Pi Zero 2 WH
* Raspberry Pi Zero Camera Mini Size 5MP OV5647 Sensor 1080p
* L298N Motor Drive Controller Board Module Dual H Bridge
* Buck Converter, DROK 5A USB Voltage Regulator DC 9V-36V Step Down to DC 5V


### Wiring

```
const Gpio = require('pigpio').Gpio;

const h_bridge_on = new Gpio(25, {mode: Gpio.OUTPUT}); // pin 25 - set to high(1) for H-bridge to work
h_bridge_on.digitalWrite(1);

const pin_forward = new Gpio(24, {mode: Gpio.OUTPUT}); // pin 24 - forward
const pin_reverse = new Gpio(23, {mode: Gpio.OUTPUT}); // pin 23 - reverse
const servo_motor = new Gpio(12, {mode: Gpio.OUTPUT}); // pin 12 - left/right
```
