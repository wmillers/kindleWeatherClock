#!/usr/bin/bash
if [[ "$EUID" = 0 ]]; then
    echo "(1) Do NOT run the Python script as ROOT"
    exit 1
fi
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
cd ..
curl "http://localhost:8099?bye"
sleep .5
rm blive.log
nohup python3 kindleWeatherClock/blivedm/startBliveServer.py > blive.log 2>&1 &
ps aux|grep [s]tartBlive
