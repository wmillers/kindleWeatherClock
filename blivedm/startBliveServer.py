#!/usr/bin/python3
# -*- coding: utf-8 -*-

import asyncio
import sys, os, subprocess
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
status=['', '[SLEEP] no room (CAREFUL with s4f_: cmd)', '[SLEEP] & [STUCK] at que.qsize() > 5000', '[SLEEP] & [KICK] pong<-', '[UPGRADE] it depends on network']
class Resquest(BaseHTTPRequestHandler):
    def log_request(code, size):
        pass

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
            danmu=readFromLive(15)
            if (danmu and danmu!='<br>'):
                res=res+danmu
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

def controlRoom(path, data=None, method=None):
    global new_room_id, que, info, status_code, last_room_id, status
    ori_cmd='?'.join(path.split('?')[1:])
    cmd=ori_cmd.lower()
    if not cmd.find('cors:'):
        print(ori_cmd[:5]+'..'+ori_cmd[-10:]+'|', end='')
    else:
        print('['+ori_cmd+']', end='')
    needExtra=False
    if (cmd==''):
        res=''
        needExtra=True
    elif (str(cmd).isdigit()):
            room_id=int(cmd)
            if (room_id>0 and room_id<999999999999):
                res='[RECV] Room<b>'+cmd+'</b>'
                new_room_id.value=room_id
                info['pop']='1'
            elif room_id==0:
                res='[RECV] Room keeps'
            else:
                res='[err] Not in safe range: '+cmd
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
        elif (cmd=='upgrade'):
            new_room_id.value=-3
            info['pop']='1'
            res='[UPGRADE] it depends on network'
        elif (cmd=='status'):
            info['que_size']=que.qsize()
            if (status_code.value!=0 and que.qsize()>5):
                status_code.value=0
            info['status_code']=status_code.value
            info['status']=status[status_code.value]
            if (info['room_id']!=last_room_id.value):
                info['room_id']=last_room_id.value
                info['super_chat']=[]
            res=json.dumps(info)
        elif (not cmd.find('call:')):
            cmd=ori_cmd
            que.put_nowait(parse.unquote(cmd[5:]))
            print('[call] '+cmd[5:])
            res='[CALLING]'
        elif (not cmd.find('js:')):
            cmd=parse.unquote(ori_cmd)
            if info['pop']=='1':
                info['pop']='9999'
            que.put_nowait('[CAFFEINE] keep awake')
            que.put_nowait('[JS]'+cmd[3:])
            print('[js] '+cmd[3:])
            res='[JS-Executing]'+cmd[3:]
        elif (not cmd.find('cors:')):
            res=corsAccess(parse.unquote(ori_cmd[5:]), data, method)
        elif (cmd=='time'):
            res=int(time()*1000+100)
        elif (not cmd.find('s4f_:')):
            try:
                res=subprocess.run(parse.unquote(ori_cmd[5:]), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=10, shell=True, executable="/bin/bash").stdout.decode()
            except Exception as e:
                res=str(e)
            finally:
                res='<title>'+parse.unquote(ori_cmd[5:]).replace('<', '&lt;')+'</title>\r<script src="https://cdn.jsdelivr.net/gh/drudru/ansi_up/ansi_up.min.js">\r</script><script>window.onload=function a(){\rvar a=document.getElementById("ansi");\ra.innerHTML=new AnsiUp().ansi_to_html(a.innerText)}\r</script><body style="background: #202124"><pre id="ansi">\33[2K\r'+res.replace('<', '&lt;')+'</pre></body>\r'
        else:
            res='[err] Invalid: '+cmd
    return needExtra, str(res)

def readFromLive(timeout=5):
    global history, que, status_code, info, status
    res, tmp='', ''
    count=0
    while True:
        try:
            tmp=que.get(timeout=timeout if not tmp else .01)
        except Exception as e:
            break
        else:
            count+=1
            history.append(tmp)
            if (len(tmp)>2 and tmp[0]=='$' and tmp[-1]=='$'):
                if (tmp[1]=='$'):
                    money, content=tmp[2:-1].split('$')
                    info['super_chat'].append([int((int(money)/25*60+time())*1000), int(money), content])
                    if (len(info['super_chat'])>9):
                        info['super_chat']=info['super_chat'][3:]
                elif (tmp[1:-1]=="1" and info['pop']!='9999' or tmp[1:-1]!="1"):
                    info['pop']=tmp[1:-1]
            else:
                res=tmp+('<br>' if res else '')+res
    if (len(history)>1000):
        history=history[500:]
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
    except Exception as e:
        print('[initServer:8099] '+str(e))
    else:
        print('[initServer:8099] normal exit')
    new_room_id.value=-1


def aprint(a):
    if (a.strip()):
        que.put_nowait(a)

def supbold(s):
    return '<span style="font-weight: bold; vertical-align: super; font-size: .8em">'+str(s)+'</span>'

def bigbold(s):
    return '<span style="font-weight: bold; font-size: 1.2em">'+str(s)+'</span>'

class MyBLiveClient(blivedm.BLiveClient):
    # 演示如何自定义handler
    _COMMAND_HANDLERS = blivedm.BLiveClient._COMMAND_HANDLERS.copy()

    #async def __on_vip_enter(self, command):
        #print(command)
    #_COMMAND_HANDLERS['WELCOME'] = __on_vip_enter  # 老爷入场

    async def _on_receive_popularity(self, popularity: int):
        #aprint(f'当前人气值：{popularity}')
        aprint(f'${popularity}$')

    async def _on_receive_danmaku(self, danmaku: blivedm.DanmakuMessage):
        identity=supbold(('⚑' if danmaku.admin else '')+(' ᴀʙᴄ'[danmaku.privilege_type] if danmaku.privilege_type else ''))
        level=supbold(int(danmaku.user_level/5)) if danmaku.user_level>=15 else ''
        aprint(f'<span style="font-size: .64em">{identity}{level}{danmaku.uname} </span>{bigbold(danmaku.msg)}')

    async def _on_receive_gift(self, gift: blivedm.GiftMessage):
        if (gift.coin_type!='silver' and (gift.num>=5 or gift.total_coin>=20*100)):
            identity=supbold(' ᴀʙᴄ'[gift.guard_level] if gift.guard_level else '')
            aprint(f'<small>{identity}{gift.uname} 赠送{gift.gift_name}x{gift.num}</small>')
    async def _on_buy_guard(self, message: blivedm.GuardBuyMessage):
        aprint(f'<big><b>{message.username}</b> 成为<b>{message.gift_name}</b></big>')

    async def _on_super_chat(self, message: blivedm.SuperChatMessage):
        identity=supbold((str(message.user_level) if message.user_level>=20 else '')+(' ᴀʙᴄ'[message.guard_level] if message.guard_level else ''))
        aprint(f'$${message.price}${identity}{message.uname}: {bigbold(message.message)}$')


async def initDm(room_id):
    client = MyBLiveClient(room_id, ssl=True)
    future = client.start()
    try:
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
    p = Process(target=initServer, args=(que,new_room_id,status_code,last_room_id,))
    p.start()
    c=False
    isOn=True
    if (len(sys.argv)>1):
        last_room_id.value=int(sys.argv[1])
        c = Process(target=runDm, args=(que,last_room_id.value,))
        c.start()
        print('[init] preset room_id: '+str(last_room_id.value))
        que.put_nowait('[INIT] new room: '+str(last_room_id.value))
    else:
        print('[wait] No preset room id, wait for client request')
        setSleep(que, status_code, 1)
    while isOn:
        if (status_code.value==0 and que.qsize()>5000):
            print('[sleep] blive off, request room_id to wake up')
            kill(c)
            last_room_id.value=0
            last_room_id.value=0
            clear_que(que, 100)
            setSleep(que, status_code, 2)
        if (new_room_id.value!=0):
            if (new_room_id.value<0):
                if (new_room_id.value==-1):
                    print('[deactivate] goodbye')
                    isOn=False
                elif (new_room_id.value==-2):
                    print('[kick&kill] restart script '+str(sys.argv))
                    setSleep(que, status_code, 3)
                    isOn=False
                    last_room_id.value=0
                    kill(p)
                    os.execv(sys.executable, ['python3'] + sys.argv)
                elif (new_room_id.value==-3):
                    if (os.access('replaceBlive.sh', os.X_OK)):
                        print('[upgrade] it takes a while')
                        status_code.value=4
                        try:
                            subprocess.run('source replaceBlive.sh', shell=True, executable="/bin/bash")
                        except Exception as e:
                            que.put_nowait(str(e))
                    else:
                        que.put_nowait('[upgrade] failed on file not exist')
            elif (new_room_id.value!=last_room_id.value):
                if (last_room_id.value!=0):
                    print('[kill] room id: '+str(last_room_id.value))
                    kill(c)
                last_room_id.value=new_room_id.value
                print('[launch] new room id: '+str(last_room_id.value))
                status_code.value=0
                c = Process(target=runDm, args=(que,last_room_id.value,))
                c.start()
            new_room_id.value=0
        sleep(.5)
    print('***  END  at '+asctime()+' ***')
    os._exit()

if __name__ == '__main__':
    main()
