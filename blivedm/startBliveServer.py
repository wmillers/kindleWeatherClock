#!/usr/bin/python3
# -*- coding: utf-8 -*-

import asyncio
import sys, os, subprocess
import blivedm
from time import sleep, time, ctime
from multiprocessing import Process, Queue, Value
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib import parse, request
import ctypes
from socketserver import ThreadingMixIn
import re, math


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

history=[]
info=dict({'pop':0, 'que_size':0, 'status_code':0, 'status':'', 'room_id':0, 'super_chat':[]})
status=['', '[SLEEP] no room (CAREFUL with s4f_: cmd)', '[SLEEP] & [STUCK] at que.qsize() > 5000', '[SLEEP] & [KICK] pong<-', '[UPGRADE] it depends on network']
clients={}
class Resquest(BaseHTTPRequestHandler):
    def log_request(code, size):
        pass

    def do_GET(self, data=None, method=None):
        clientCount(self.headers['User-Agent'] if 'User-Agent' in self.headers else 'default', self.path)
        if (isEmptyPath(self.path)):
            self.send_response(404)
            self.end_headers()
            return
        self.send_response(200)
        needExtra, cmd_res=controlRoom(self.path, data, method)
        if isinstance(cmd_res, str):
            self.send_header('Content-type', 'text/html; charset=utf-8')
        else:
            self.send_header('Content-type', 'application/json')
            cmd_res=json.dumps(cmd_res, indent=2)
        self.end_headers()
        res=cmd_res+('<br>' if cmd_res and needExtra else '')
        if needExtra:
            danmu=readFromLive(15)
            if (danmu and danmu!='<br>'):
                res=res+danmu
        return self.wfile.write((res if res else '\n').encode('utf-8'))

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

def clientCount(ua, path):
    if ua in clients:
        clients[ua]['interval']=round(time()-clients[ua]['last'], 3)
        clients[ua]['reads']+=1
    else:
        clients[ua]={'first': ctime(), 'interval': 0, 'last': 0, 'path':[], 'reads': 1}
        platform=re.findall(r'(?<=\().+?(?=\))', ua)
        browser=re.findall(r'(?:[Cc]hrome|[Ss]afari)[\d\.\/]+', ua)
        if len(platform):
            clients[ua]['platform']=platform[0]
        if len(browser):
            clients[ua]['browser']=browser[0]
    clients[ua]['last']=time()
    clients[ua]['path']=clients[ua]['path'][-4:]
    clients[ua]['path'].append(path)

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
                return status
            else:
                return response.read().decode("utf-8")
    except Exception as e:
        print(repr(e), flush=True)
        que.put_nowait('[EXCEP:cors] '+repr(e)+'@'+url)
        return ''

def controlRoom(path, data=None, method=None):
    global control_code, que, info, status_code, status
    ori_cmd='?'.join(path.split('?')[1:])
    cmd=ori_cmd.lower()
    if cmd.find('cors:')!=-1:
        print('~'+ori_cmd[-11:], end='', flush=True)
    else:
        print('-'+ori_cmd if ori_cmd else '.', end='', flush=True)
    needExtra=False
    if (cmd==''):
        res=''
        needExtra=True
    elif (str(cmd).isdigit()):
            room_id=int(cmd)
            if (room_id>0 and room_id<1e15):
                res='[RECV] Room<b>'+cmd+'</b>'
                if (info['room_id']!=room_id):
                    print('[kill] room id: '+str(info['room_id']))
                    info['room_id']=room_id
                    info['super_chat']=[]
                    info['pop']=0
                    control_code.value=room_id
                else:
                    print('[recv] but same')
            elif room_id==0:
                res='[RECV] Room keeps'
            else:
                res='[err] Not in safe range: '+cmd
    else:
        if (cmd=='history'):
            res='<br>'.join(history)
        elif (cmd=='bye'):
            control_code.value=-1
            res='[DEACTIVATE] client request turn off'
        elif (cmd=='kick'):
            control_code.value=-2
            info['pop']=1
            res='[SLEEP] & [KCIK] restart OK'
        elif (cmd=='upgrade'):
            control_code.value=-3
            info['pop']=1
            res='[UPGRADE] it depends on network'
        elif (cmd=='status'):
            info['que_size']=que.qsize()
            if (status_code.value!=0 and que.qsize()>5):
                status_code.value=0
            if (info['status_code']!=status_code.value):
                info['status_code']=status_code.value
                info['status']=status[status_code.value]
                if (info['status_code']==2):
                    info['room_id']=0
            res=info
        elif (cmd=='clients'):
            res=clients
        elif (not cmd.find('call:')):
            cmd=ori_cmd
            que.put_nowait(parse.unquote(cmd[5:]))
            res='[CALLING]'
        elif (not cmd.find('js:')):
            cmd=parse.unquote(ori_cmd)
            if info['pop']==1:
                info['pop']=9999
            que.put_nowait('[CAFFEINE] keep awake')
            que.put_nowait('[JS]'+cmd[3:])
            res='[JS-Executing]'+cmd[3:]
        elif (not cmd.find('cors:')):
            res=corsAccess(parse.unquote(ori_cmd[5:]), data, method)
        elif (cmd=='time'):
            res=int(time()*1000+100)
        elif (not cmd.find('s4f_:')):
            try:
                res=subprocess.run(parse.unquote(ori_cmd[5:]), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=10, shell=True, executable="/bin/bash").stdout.decode()
            except Exception as e:
                res=repr(e)
            finally:
                res='<title>'+parse.unquote(ori_cmd[5:]).replace('<', '&lt;')+'</title>\r<script src="https://cdn.jsdelivr.net/gh/drudru/ansi_up/ansi_up.min.js">\r</script><script>window.onload=function a(){\rvar a=document.getElementById("ansi");\ra.innerHTML=new AnsiUp().ansi_to_html(a.innerText)}\r</script><body style="background: #202124">\r<code id="ansi" style="white-space: pre-wrap">\33[2K\r'+res.replace('<', '&lt;')+'</code></body>\r'
        else:
            res='[err] Invalid: '+ori_cmd
    return needExtra, res

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
                elif (tmp[1:-1]=="1" and info['pop']!=9999) or tmp[1:-1]!="1":
                    try:
                        info['pop']=int(tmp[1:-1])
                    except Exception as e:
                        pass
            else:
                res=tmp+('<br>' if res else '')+res
    if (len(history)>1000):
        history=history[500:]
    if (status_code.value!=0):
        res=status[status_code.value]+'<br>'+res
    return res


def initServer(q, r, c, s):
    global que, control_code, status_code, info
    que, control_code, status_code=q, c, s
    info['room_id']=r
    host = ('localhost', 8099)
    print("Starting server, listen at: %s:%s" % host, flush=True)
    server = ThreadedHTTPServer(host, Resquest)
    try:
        server.serve_forever()
    except Exception as e:
        print('[initServer:8099] '+repr(e), flush=True)
    else:
        print('[initServer:8099] normal exit', flush=True)
    control_code.value=-1


def aprint(a):
    if (a.strip()):
        que.put_nowait(a)

def supbold(s):
    return '<span style="font-weight: bold; vertical-align: super; font-size: .8em">'+str(s)+'</span>'

def bigbold(s, size=1.2):
    return '<span style="font-weight: bold; font-size: '+str(size)+'em">'+str(s)+'</span>'

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
        price=round(gift.total_coin/1e3)
        if (gift.coin_type!='silver' and price>=5):# gift.num
            identity=supbold(' ᴀʙᴄ'[gift.guard_level] if gift.guard_level else '')
            aprint(bigbold(f'{identity}{gift.uname} 赠送{gift.gift_name}x{gift.num}#{price}', .64+max(math.pow(price, 1/3)/40, 1/(1+math.pow(math.e, -.002*price+3))))) # (936, .24)
    async def _on_buy_guard(self, message: blivedm.GuardBuyMessage):
        aprint(f'{bigbold(message.username)} 成为 {bigbold(message.gift_name)}#{round(message.price/1e3)}')

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
    asyncio.get_event_loop().run_until_complete(initDm(room_id))


def clear_que(que, n=0):
    try:
        n-=que.qsize()
        while (not que.empty() and n<0):
            n+=1
            que.get_nowait()
    except Exception as e:
        print('skipClear_que:'+repr(e), flush=True)

def setSleep(que, status_code, status):
    status_code.value=status
    que.put_nowait("$1$")

def kill(p):
    try:
        if (p):
            p.terminate()
            p.join()
    except Exception as e:
        print('skip '+repr(e)+' when kill '+str(p))

def main():
    print('--- START at '+ctime()+' ---\n--- '+sys.path[0]+' ---')
    os.chdir(sys.path[0])
    que = Queue()
    control_code=Value(ctypes.c_longlong, 0)
    status_code=Value(ctypes.c_int, 0)
    room_id=0
    c=False
    if (len(sys.argv)>1):
        room_id=int(sys.argv[1])
        c = Process(target=runDm, args=(que,room_id,))
        c.start()
        print('[init] preset room_id: '+str(room_id), flush=True)
        que.put_nowait('[INIT] new room: '+str(room_id))
    else:
        print('[wait] No preset room id, wait for client request', flush=True)
        setSleep(que, status_code, 1)
    p = Process(target=initServer, args=(que,control_code,status_code,room_id,))
    p.start()
    isOn=True
    while isOn:
        if (status_code.value==0 and que.qsize()>5000):
            print('[sleep] blive off, request room_id to wake up')
            kill(c)
            clear_que(que, 500)
            setSleep(que, status_code, 2)
        if (control_code.value!=0):
            if (control_code.value<0):
                if (control_code.value==-1):
                    print('[deactivate] goodbye')
                    isOn=False
                elif (control_code.value==-2):
                    print('[kick&kill] restart script '+str(sys.argv))
                    setSleep(que, status_code, 3)
                    isOn=False
                    kill(p)
                    os.execv(sys.executable, ['python3'] + sys.argv)
                elif (control_code.value==-3):
                    print('[upgrade] it takes a while')
                    status_code.value=4
                    try:
                        subprocess.run('/bin/bash updateBlive.sh', shell=True, executable="/bin/bash")
                    except Exception as e:
                        que.put_nowait(repr(e))
            else:
                kill(c)
                clear_que(que)
                room_id=control_code.value
                print('[launch] new room id: '+str(room_id))
                status_code.value=0
                c = Process(target=runDm, args=(que,room_id,))
                c.start()
            control_code.value=0
        sleep(.1)
    print('***  END  at '+ctime()+' ***', flush=True)
    os._exit()

if __name__ == '__main__':
    try:
        main()  
    except Exception as e:
        print(repr(e)+str(sys.exc_info()), flush=True)
