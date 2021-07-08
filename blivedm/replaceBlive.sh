#!/usr/bin/bash

curl "http://localhost:8099?bye"
rm nohup.out
cd kindleWeatherClock/
git pull
if [ $? = "0" ] ;then
    nohup python3 blivedm/startBliveServer.py &
    ps aux|grep startBlive
fi
