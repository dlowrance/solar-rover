#!/bin/bash

# add ip / hostname separated by white space
#HOSTS="1.2.3.4"
HOSTS="8.8.8.8 4.2.2.4"
# no ping request
totalcount=0
COUNT=4

DATE=`date +%Y-%m-%d:%H:%M:%S`

if ! /sbin/ifconfig tun0 | grep -q "00-00-00-00-00-00-00-00-00-00-00-00-00-00-00-00"
then
        echo $DATE      tun0 down
        sh /home/pi/solar-rover/connect_to_VPN.sh
else
	echo 'VPN is connected.'
fi
