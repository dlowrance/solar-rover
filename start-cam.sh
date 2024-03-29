#!/bin/bash
cd /home/pi/solar-rover/mjpg-streamer/mjpg-streamer-experimental && \
./mjpg_streamer -o \
"output_http.so -w ./www" \
-i "input_raspicam.so -rot 180 -x 320 -y 240 --framerate 10 -quality 5" \
> /dev/null 2>&1 &

#turn off rpi onboard LED to improve energy efficency
echo none | sudo tee /sys/class/leds/led0/trigger > /dev/null 2>&1
