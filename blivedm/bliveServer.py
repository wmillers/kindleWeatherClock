#!/usr/bin/python3
# -*- coding: utf-8 -*-

import asyncio
import sys
import blivedm
from time import sleep, time
from multiprocessing import Process, Queue, Value
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib import parse
import ctypes


history=[]
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
        if (not cmd_res):
            res=readFromLive()
        else:
            res=str(cmd_res)
        self.wfile.write(res.encode('utf-8'))

def isEmptyPath(path):
    block=['/favicon.ico']
    if (parse.urlparse(path).path in block):
        return True
    return False

def controlRoom(path):
    global new_room_id
    cmd=parse.urlparse(path).query.split('&')[0]
    if (cmd==''):
        return False
    if (str(cmd).isdigit()):
            room_id=int(cmd)
            if (room_id>0 and room_id<999999999999):
                res='[recv] Valid Room_id: '+cmd
                new_room_id.value=room_id
            else:
                res='[err] Not in safe range: '+cmd
    else:
        if (cmd in ['history']):
            res=cmd+str(history)
        else:
            res='[err] Invalid: '+cmd
    return res

def readFromLive():
    global history
    global status_que
    res=''
    if (que.empty()):
        if (not status_que.empty()):
            while not status_que.empty():
                res+=status_que.get_nowait()+'<br>'
        else:
            res="<br>"
    else:
        control={'pop':''}
        if (len(history)>100):
            history=history[50:]
        while not que.empty():
            tmp=que.get_nowait()
            history.append(tmp)
            if (len(tmp)>2 and tmp[0]=='$' and tmp[-1]=='$'):
                control['pop']=tmp
                continue
            res+='<br>'+tmp
        if (res.strip()):
            res=''.join(list(control.values()))+res
        else:
            res='<br>'
    return res

def initServer(r, c1, c2):
    global que
    global new_room_id
    global status_que
    que, new_room_id, status_que=r, c1, c2
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
        aprint(f'<small>{danmaku.uname}: </small>{danmaku.msg}')

    async def _on_receive_gift(self, gift: blivedm.GiftMessage):
        if (gift.coin_type!='silver'):
            aprint(f'<small>{gift.uname} 赠送{gift.gift_name}x{gift.num}</small>')# （{gift.coin_type}币x{gift.total_coin}）')

    async def _on_buy_guard(self, message: blivedm.GuardBuyMessage):
        aprint(f'<small>{message.username} 购买{message.gift_name}</small>')

    async def _on_super_chat(self, message: blivedm.SuperChatMessage):
        aprint(f'<small>SuperChat <b>¥{message.price}</b> {message.uname}: <b>{message.message}</b></small>')


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

def uniquePut(q, s):
    while (not q.empty()):
        q.get_nowait()
    q.put_nowait(s)


if __name__ == '__main__':
    que = Queue()
    new_room_id=Value(ctypes.c_longlong, 0)
    status_que=Queue()
    p = Process(target=initServer, args=(que,new_room_id,status_que,))
    p.start()
    room_id=0
    if (len(sys.argv)>1):
        room_id=int(sys.argv[1])
        c = Process(target=runDm, args=(que,room_id,))
        c.start()
        print('[init] preset room_id: '+str(room_id))
    else:
        print('[wait] No preset room id, wait for client request')
        uniquePut(status_que, '[SLEEP] no preset room id given')
    while True:
        stuck_time=0
        if (que.qsize()==3 and stuck_time==0):
            stuck_time=time()
        if stuck_time!=0 and (que.qsize()>10 and time()-stuck_time>30*60) or (que.qsize()>100 and time()-stuck_time>10*60) or que.qsize()>500:
            print('[sleep] blive off, request room_id to wake up')
            uniquePut(status_que, '[SLEEP] blive overflow')
            c.terminate()
            c.join()
        if (new_room_id.value!=0):
            if (new_room_id.value!=room_id):
                if (room_id!=0):
                    print('[kill] room id: '+str(room_id))
                    c.terminate()
                    c.join()
                room_id=new_room_id.value
                print('[launch] new room id: '+str(room_id))
                uniquePut(status_que, '[LAUNCH] new room id: '+str(room_id))
                c = Process(target=runDm, args=(que,room_id,))
                c.start()
            new_room_id.value=0
        sleep(1)
    p.join()
    c.join()