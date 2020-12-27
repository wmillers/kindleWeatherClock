#!/usr/bin/python3
# -*- coding: utf-8 -*-

import asyncio
import sys
import blivedm
from time import sleep
from multiprocessing import Process, Queue, Value
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib import parse
import ctypes


history=[]
info=dict({'pop':0, 'que_size':0, 'status_code':0, 'status':'', 'room_id':0})
status=['', '[SLEEP] no preset room id given', '[SLEEP] blive overflow', '[SLEEP] & [KICK] pong<-']
class Resquest(BaseHTTPRequestHandler):
    def do_GET(self):
        if (isEmptyPath(self.path)):
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        cmd_res=controlRoom(self.path)
        res=cmd_res[1]+('<br>' if cmd_res[1] and cmd_res[0] else '')+(readFromLive() if cmd_res[0] else '')
        self.wfile.write(res.encode('utf-8'))

def isEmptyPath(path):
    block=['/favicon.ico']
    if (parse.urlparse(path).path in block):
        return True
    return False

def controlRoom(path):
    global new_room_id, que, info, status_code, last_room_id, status
    cmd=parse.urlparse(path).query.split('&')[0]
    needExtra=False
    if (cmd==''):
        res=''
    elif (str(cmd).isdigit()):
            room_id=int(cmd)
            if (room_id>0 and room_id<999999999999):
                res='[RECV] Valid Room_id: '+cmd
                new_room_id.value=room_id
            else:
                res='[err] Not in safe range: '+cmd
    else:
        if (cmd=='history'):
            res=cmd+': '+(' '.join(history))
            needExtra=True
        elif (cmd=='bye'):
            new_room_id.value=-1
            res='[DEACTIVATE] client request turn off'
            needExtra=True
        elif (cmd=='kick'):
            new_room_id.value=-2
            res='[SLEEP] & [KCIK] OK'
        elif (cmd=='info'):
            info['que_size']=que.qsize()
            info['status_code']=status_code.value
            info['status']=status[status_code.value]
            info['room_id']=last_room_id.value
            res=json.dumps(info)
        elif (cmd=='blive'):
            new_room_id.value=-3
            res='[CHECKING] blive process..'
        elif (cmd[0:5]=='call:'):
            req=parse.unquote(cmd[5:])
            que.put_nowait('<b>[CLIENT-CALL] '+req+'</b>')
            print('[call] '+req)
            res='[CALLING]'
        else:
            res='[err] Invalid: '+cmd
    return [needExtra, str(res)]

def readFromLive():
    global history, que, status_code, info, status
    res=''
    if (que.empty()):
        if (status_code.value!=0):
            res=status[status_code.value]
    else:
        if (len(history)>100):
            history=history[50:]
        while not que.empty():
            tmp=que.get_nowait()
            history.append(tmp)
            if (len(tmp)>2 and tmp[0]=='$' and tmp[-1]=='$'):
                info['pop']=tmp[1:-1]
                continue
            res=tmp+('<br>' if tmp else '')+res
    return res

def initServer(r, c1, c2, c3):
    global que, new_room_id, status_code, last_room_id
    que, new_room_id, status_code, last_room_id=r, c1, c2, c3
    host = ('localhost', 8099)
    server = HTTPServer(host, Resquest)
    print("Starting server, listen at: %s:%s" % host)
    server.serve_forever()


def aprint(a):
    if (a.strip()):
        que.put_nowait(a)

class MyBLiveClient(blivedm.BLiveClient):
    # 演示如何自定义handler
    _COMMAND_HANDLERS = blivedm.BLiveClient._COMMAND_HANDLERS.copy()

    async def __on_vip_enter(self, command):
        print(command)
    _COMMAND_HANDLERS['WELCOME'] = __on_vip_enter  # 老爷入场

    async def _on_receive_popularity(self, popularity: int):
        #aprint(f'当前人气值：{popularity}')
        aprint(f'${popularity}$')

    async def _on_receive_danmaku(self, danmaku: blivedm.DanmakuMessage):
        identity=('⚑' if danmaku.admin else '')+(' ᎯᏰℭ'[danmaku.privilege_type] if danmaku.privilege_type else '')
        if identity:
            identity+=' '
        aprint(f'<small>{identity}{danmaku.uname}: </small><big><b>{danmaku.msg}</b></big>')

    async def _on_receive_gift(self, gift: blivedm.GiftMessage):
        if (gift.coin_type!='silver'):
            aprint(f'<small>{gift.uname} 赠送{gift.gift_name}x{gift.num}</small>')# （{gift.coin_type}币x{gift.total_coin}）')

    async def _on_buy_guard(self, message: blivedm.GuardBuyMessage):
        aprint(f'<big><b>{message.username}</b> 购买 <b>{message.gift_name}</b></big>')

    async def _on_super_chat(self, message: blivedm.SuperChatMessage):
        aprint(f'<b>SuperChat <big>¥{message.price}</big></b> {message.uname}: <u><b>{message.message}</b></u>')


async def initDm(room_id):
    # 参数1是直播间ID
    # 如果SSL验证失败就把ssl设为False
    client = MyBLiveClient(room_id, ssl=True)
    future = client.start()
    try:
        # 5秒后停止，测试用
        # await asyncio.sleep(5)
        # future = client.stop()
        # 或者
        # future.cancel()

        await future
    finally:
        await client.close()

def runDm(s, room_id):
    global que
    que=s
    aprint('[LIVE] New room: '+str(room_id))
    sys.stdout.flush()
    asyncio.get_event_loop().run_until_complete(initDm(room_id))

def clear_que(q, n):
    while (not q.empty() and n):
        n-=1
        q.get_nowait()


def main():
    print('--- START ---')
    que = Queue()
    new_room_id=Value(ctypes.c_longlong, 0)
    status_code=Value(ctypes.c_int, 0)
    last_room_id=Value(ctypes.c_longlong, 0)
    p = Process(target=initServer, args=(que,new_room_id,status_code,last_room_id,))
    p.start()
    room_id=0
    if (len(sys.argv)>1):
        room_id=int(sys.argv[1])
        last_room_id.value=room_id
        c = Process(target=runDm, args=(que,room_id,))
        c.start()
        print('[init] preset room_id: '+str(room_id))
        que.put_nowait('[INIT] new room: '+str(room_id))
    else:
        print('[wait] No preset room id, wait for client request')
        status_code.value=1
    while True:
        if (status_code.value==0 and que.qsize()>200):
            print('[sleep] blive off, request room_id to wake up')
            que.put_nowait('[SLEEP] & [STUCK] at que.qsize() = '+str(que.qsize()))
            clear_que(que, 100)
            status_code.value=2
            c.terminate()
            c.join()
            room_id=0
        if (new_room_id.value!=0):
            if (new_room_id.value<0):
                if (new_room_id.value==-1):
                    print('[deactivate] goodbye')
                    p.terminate()
                    c.terminate()
                    break
                if (new_room_id.value==-2):
                    print('[kick&kill] but no new room')
                    if (room_id!=0):
                        status_code.value=3
                        c.terminate()
                        c.join()
                    room_id=0
                if (new_room_id.value==-3):
                    print(str(c))
                    que.put_nowait(str(c))
            elif (new_room_id.value!=room_id):
                if (room_id!=0):
                    print('[kill] room id: '+str(room_id))
                    c.terminate()
                    c.join()
                room_id=new_room_id.value
                last_room_id.value=room_id
                print('[launch] new room id: '+str(room_id))
                status_code.value=0
                que.put_nowait('[LAUNCH] new room: '+str(room_id))
                c = Process(target=runDm, args=(que,room_id,))
                c.start()
            new_room_id.value=0
        sleep(1)
    p.join()
    c.join()

if __name__ == '__main__':
    main()