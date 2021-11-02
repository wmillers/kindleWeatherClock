#!/usr/bin/bash
if [[ "$EUID" = 0 ]]; then
    echo "(1) Do NOT run the Python script as ROOT" 2>&1 | tee -a kindle.log
    exit 1
fi
echo upgrade@$0 2>&1 | tee -a kindle.log
curl http://localhost:8099/?call:\<b\>[UPGRADE]%20script%20STARTED\</b\>
cd "$(dirname "$0")"
ret=0
for((i=0;i<6;i++));do
    curl http://localhost:8099/?call:\<b\>[UPGRADE]%20git%20pull%20$i:$ret\</b\>
    echo start git fetch: $i
    timeout 15 git fetch origin master
    ret=$?
    if [ $ret = "0" ] ;then
        echo success on fetch $ret
        git reset --hard FETCH_HEAD
        ps ax | grep [s]tartBliveServer.py | awk '{print $1}' | xargs kill -9
        nohup python3 startBliveServer.py > kindle.log 2>&1 &
        sleep .5
        curl -sS "http://localhost:8099/?call:<b>\[FILE%40$(date -r startBliveServer.py +%m-%d/%H:%M:%S/%a%Z)\]%20SUCC</b>" 2>&1 | tee -a kindle.log
        break
    elif [ $i = "5" ] ;then
        curl -sS "http://localhost:8099/?call:<b>\[Failed:UPGRADE\]%20$i:$ret</b>" 2>&1 | tee -a kindle.log
    fi
done
if [[ "$?" != 0 ]]; then
    echo "(2) It seems update FAILED($?), try to reroll back in 5s" 2>&1 | tee -a kindle.log
    sleep 5
    git reset --hard HEAD@{1}
    nohup python3 startBliveServer.py > kindle.log 2>&1 &
    exit 2
fi
