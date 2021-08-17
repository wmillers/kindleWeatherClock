#!/usr/bin/bash
if [[ "$EUID" = 0 ]]; then
    echo "(1) Do NOT run the Python script as ROOT"
    exit 1
fi
echo start upgrade >> kindle.log
cd "$(dirname "$0")"
for((i=0;i<5;i++));
do
    echo start git pull: $i
    git pull
    ret=$?
    if [ $ret = "0" ] ;then
        echo success $ret
        break
    else
        echo retry[$ret]: $i \< 3
    fi
done
ps ax | grep [s]tartBliveServer.py | awk '{print $1}' | xargs kill -9
nohup python3 startBliveServer.py > kindle.log 2>&1 &
ps aux|grep [s]tartBlive  >> kindle.log
curl http://localhost:8099/?status  >> kindle.log
