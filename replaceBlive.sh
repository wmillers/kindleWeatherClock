#!/usr/bin/bash

curl "http://localhost:8099?bye"
rm nohup.out
cd kindleWeatherClock/
for((i=0;i<5;i++));
do
    git pull
    ret=$?
    if [ $ret = "0" ] ;then
        echo get $ret
        break
    else
        echo retry[$ret]: $i \< 5
    fi
done
nohup python3 blivedm/startBliveServer.py &
ps aux|grep startBlive
