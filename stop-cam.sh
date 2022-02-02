#!/bin/bash
killall mjpg_streamer

#turn on green led to indicate camera is off
echo none | sudo tee /sys/class/leds/led0/trigger 1 > /dev/null 2>&1 &
