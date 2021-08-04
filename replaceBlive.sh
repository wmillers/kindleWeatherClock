#!/usr/bin/bash
if [[ "$EUID" = 0 ]]; then
    echo "(1) Do NOT run the Python script as ROOT"
    exit 1
fi
echo start upgrade >> blive.log
cd kindleWeatherClock/
for((i=0;i<3;i++));
do
    echo start git pull
    git pull
    ret=$?
    if [ $ret = "0" ] ;then
        echo success $ret
        break
    else
        echo retry[$ret]: $i \< 3
    fi
done
cd ..
curl "http://localhost:8099?bye"
sleep .5
ps ax | grep [s]tartBliveServer.py | awk '{print $1}' | xargs kill -9
nohup python3 kindleWeatherClock/blivedm/startBliveServer.py > blive.log 2>&1 &
ps aux|grep [s]tartBlive
