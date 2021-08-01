#!/usr/bin/python3
# -*- coding: utf-8 -*-

import asyncio
import sys, os
import blivedm
from time import sleep, time, asctime
from multiprocessing import Process, Queue, Value
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib import parse, request
import ctypes
from socketserver import ThreadingMixIn


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

history=[]
info=dict({'pop':0, 'que_size':0, 'status_code':0, 'status':'', 'room_id':0, 'super_chat':[]})
status=['', '[SLEEP] no preset room id given', '[SLEEP] & [STUCK] at que.qsize() > 1000', '[SLEEP] & [KICK] pong<-']
class Resquest(BaseHTTPRequestHandler):
    def do_GET(self, data=None, method=None):
        if (isEmptyPath(self.path)):
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        needExtra, cmd_res=controlRoom(self.path, data, method)
        res=cmd_res+('<br>' if cmd_res and needExtra else '')
        if needExtra:
            count=0
            while count<15:
                count+=1
                danmu=readFromLive()
                if (danmu and danmu!='<br>'):
                    res=res+danmu
                    break
                sleep(1)
        return self.wfile.write((res if res.strip() else '\n').encode('utf-8'))

    def do_POST(self):
        data=self.rfile.read(int(self.headers['content-length']))
        self.do_GET(data, method="POST")

    def do_PUT(self):
        data=self.rfile.read(int(self.headers['content-length']))
        self.do_GET(data, method="PUT")

def isEmptyPath(path):
    block=['/favicon.ico']
    if (parse.urlparse(path).path in block):
        return True
    return False

def corsAccess(url, data=None, method=None):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
        'accept-language': 'en-GB,en;q=0.9'
    }
    req = request.Request(url, headers=headers, data=data, method=method if method else None)
    try:
        with request.urlopen(req) as response:
            status=dict({'code': response.status, 'from': url})
            if (response.status>=400):
                return json.dumps(status)
            else:
                return response.read().decode("utf-8")
    except Exception:
        que.put_nowait('[EXCEP] cors: <'+url+'>'+str(sys.exc_info()))
        return ''

def restart():
    return os.execv(sys.executable, ['python3'] + sys.argv)

def controlRoom(path, data=None, method=None):
    global new_room_id, que, info, status_code, last_room_id, status
    ori_cmd='?'.join(path.split('?')[1:])
    cmd=ori_cmd.lower()
    if not cmd.find('cors:'):
        print(ori_cmd[:5]+'..'+ori_cmd[-10:]+'|', end='')
    else:#if len(cmd.strip()):
        print('['+ori_cmd+']', end='')
    needExtra=True
    if (cmd==''):
        res=''
    elif (str(cmd).isdigit()):
            room_id=int(cmd)
            if (room_id>0 and room_id<999999999999):
                res='[RECV] RoomId<b>'+cmd+'</b>'
                new_room_id.value=room_id
                info['pop']='1'
            elif room_id==0:
                res='[RECV] Room keeps'
            else:
                res='[err] Not in safe range: '+cmd
            needExtra=False
    else:
        if (cmd=='history'):
            res=cmd+': '+'<br>'.join(history)
        elif (cmd=='bye'):
            new_room_id.value=-1
            res='[DEACTIVATE] client request turn off'
        elif (cmd=='kick'):
            new_room_id.value=-2
            info['pop']='1'
            res='[SLEEP] & [KCIK] restart OK'
            needExtra=False
        elif (cmd=='info'):
            info['que_size']=que.qsize()
            if (status_code.value==0 and que.qsize()<5):
                status_code.value=0
            info['status_code']=status_code.value
            info['status']=status[status_code.value]
            if (info['room_id']!=last_room_id.value):
                info['room_id']=last_room_id.value
                info['super_chat']=[]
            res=json.dumps(info)
            needExtra=False
        elif (not cmd.find('call:')):
            cmd=ori_cmd
            que.put_nowait(parse.unquote(cmd[5:]))
            print('[call] '+cmd[5:])
            res='[CALLING]'
            needExtra=False
        elif (not cmd.find('js:')):
            cmd=parse.unquote(ori_cmd)
            if info['pop']=='1':
                info['pop']='9999'
            que.put_nowait('[CAFFEINE] keep awake')
            que.put_nowait('[JS]'+cmd[3:])
            print('[js] '+cmd[3:])
            res='[JS-Executing]'+cmd[3:]
            needExtra=False
        elif (not cmd.find('cors:')):
            res=corsAccess(parse.unquote(ori_cmd[5:]), data, method)
            needExtra=False
        elif (cmd=='time'):
            res=int(time()*1000+100)
            needExtra=False
        else:
            res='[err] Invalid: '+cmd
    return needExtra, str(res)

def readFromLive():
    global history, que, status_code, info, status
    res=''
    if (not que.empty()):
        if (len(history)>100):
            history=history[50:]
        while not que.empty():
            tmp=que.get_nowait()
            history.append(tmp)
            if (len(tmp)>2 and tmp[0]=='$' and tmp[-1]=='$'):
                if (tmp[1]=='$'):
                    money, content=tmp[2:-1].split('$')
                    info['super_chat'].append([int((int(money)/25*60+time())*1000), int(money), content])
                    if (len(info['super_chat'])>9):
                        info['super_chat']=info['super_chat'][3:]
                elif (tmp[1:-1]=="1" and info['pop']!='9999') or tmp[1:-1]!="1":
                    info['pop']=tmp[1:-1]
                continue
            res=tmp+('<br>' if tmp and res else '')+res
    if (status_code.value!=0):
        res=status[status_code.value]+'<br>'+res
    return res

def initServer(r, c1, c2, c3):
    global que, new_room_id, status_code, last_room_id
    que, new_room_id, status_code, last_room_id=r, c1, c2, c3
    host = ('localhost', 8099)
    print("Starting server, listen at: %s:%s" % host)
    server = ThreadedHTTPServer(host, Resquest)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


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
        identity='<sup><b>'+('⚑' if danmaku.admin else '')+(' ᴀʙᴄ'[danmaku.privilege_type] if danmaku.privilege_type else '')+'</b></sup>'
        level_tag='i' if danmaku.user_level>=15 else 'small'
        aprint(f"<small><small>{identity}<{level_tag}>{danmaku.uname}</{level_tag}> </small></small><big><b>{danmaku.msg}</b></big>")

    async def _on_receive_gift(self, gift: blivedm.GiftMessage):
        if (gift.coin_type!='silver'):
            identity='<sup><b>'+(' ᴀʙᴄ'[gift.guard_level] if gift.guard_level else '')+'</b></sup>'
            aprint(f'<small>{identity}{gift.uname} 赠送{gift.gift_name}x{gift.num}</small>')# （{gift.coin_type}币x{gift.total_coin}）')

    async def _on_buy_guard(self, message: blivedm.GuardBuyMessage):
        aprint(f'<big><b>{message.username}</b> 购买 <b>{message.gift_name}</b></big>')

    async def _on_super_chat(self, message: blivedm.SuperChatMessage):
        identity='<sup><b>'+(str(message.user_level) if message.user_level>=20 else '')+(' ᴀʙᴄ'[message.guard_level] if message.guard_level else '')+'</b></sup>'
        aprint(f'$${message.price}${identity}{message.uname}: <big><b>{message.message}</b></big>$')


async def initDm(room_id):
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
    sys.stdout.flush()
    asyncio.get_event_loop().run_until_complete(initDm(room_id))



def clear_que(q, n):
    while (not q.empty() and n):
        n-=1
        q.get_nowait()

def setSleep(q, status_code, status):
    status_code.value=status
    q.put_nowait("$1$")

def kill(p):
    try:
        if (p):
            p.terminate()
            p.join()
    except Exception:
        print('skip Error when kill '+str(p))

def main():
    print('--- START at '+asctime()+' ---')
    que = Queue()
    new_room_id=Value(ctypes.c_longlong, 0)
    status_code=Value(ctypes.c_int, 0)
    last_room_id=Value(ctypes.c_longlong, 0)
    sleep(0.5)# To wait Restart
    p = Process(target=initServer, args=(que,new_room_id,status_code,last_room_id,))
    p.start()
    c=False
    room_id=0
    isOn=True
    if (len(sys.argv)>1):
        room_id=int(sys.argv[1])
        last_room_id.value=room_id
        c = Process(target=runDm, args=(que,room_id,))
        c.start()
        print('[init] preset room_id: '+str(room_id))
        que.put_nowait('[INIT] new room: '+str(room_id))
    else:
        print('[wait] No preset room id, wait for client request')
        setSleep(que, status_code, 1)
    while isOn:
        sleep(1)
        if (status_code.value==0 and que.qsize()>1000):
            print('[sleep] blive off, request room_id to wake up')
            kill(c)
            room_id=0
            last_room_id.value=0
            clear_que(que, 50)
            setSleep(que, status_code, 2)
        if (new_room_id.value!=0):
            if (new_room_id.value<0):
                if (new_room_id.value==-1):
                    print('[deactivate] goodbye')
                    kill(p)
                    kill(c)
                    isOn=False
                if (new_room_id.value==-2):
                    print('[kick&kill] but no new room, restart script')
                    setSleep(que, status_code, 3)
                    isOn=False
                    room_id=0
                    kill(p)
                    kill(c)
                    restart()
            elif (new_room_id.value!=room_id):
                if (room_id!=0):
                    print('[kill] room id: '+str(room_id))
                    kill(c)
                room_id=new_room_id.value
                last_room_id.value=room_id
                print('[launch] new room id: '+str(room_id))
                status_code.value=0
                c = Process(target=runDm, args=(que,room_id,))
                c.start()
            new_room_id.value=0
    print('***  END  at '+asctime()+' ***')

if __name__ == '__main__':
    main()