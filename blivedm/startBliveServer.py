#!/usr/bin/python3
# -*- coding: utf-8 -*-
import asyncio
import sys, os, subprocess
import blivedm
from time import sleep, time, strftime, strptime, mktime
from multiprocessing import Process, Queue, Value, Array
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
from urllib import parse, request
import ctypes
from socketserver import ThreadingMixIn
import re, math
import danmaku


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True

history=[]
temp_purse={}
info={'pop':0, 'que_size':0, 'status_code':0, 'status':'', 'room_id':0, 'other_room':'', 'purse':0, 'super_chat':[]}
status=['', '[SLEEP] no room (CAREFUL with s4f_: cmd)', '[SLEEP] & [STUCK] at que.qsize() > 5000', '[SLEEP] & [RESTART] pong<-', '[UPGRADE] it depends on network']
clients={}
storage=''
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
        needExtra, cmd_res=controlRoom(self.path, data, method, self.headers['User-Agent'], self.headers)
        if isinstance(cmd_res, str):
            self.send_header('Content-type', 'text/html; charset=utf-8')
        else:
            self.send_header('Content-type', 'application/json')
            cmd_res=json.dumps(cmd_res, indent=2)
        self.end_headers()
        res=cmd_res+('<br>' if cmd_res and needExtra else '')
        if needExtra:
            if checkKick(self.headers['User-Agent']):
                res+="[JS]danmuOff('KICKed')"
            else:
                danmu=readFromLive(15)
                if (danmu and danmu!='<br>'):
                    res+=danmu
        return self.wfile.write((res if res else '\n').encode('utf-8'))

    def do_POST(self):
        data=self.rfile.read(int(self.headers['content-length']))
        self.do_GET(data, method="POST")

    def do_PUT(self):
        data=self.rfile.read(int(self.headers['content-length']))
        self.do_GET(data, method="PUT")

def setKick(ua):
    if ua:
        for k in dict.keys(clients):
            clients[k]['kick']='' if k==ua else handle_time()

def checkKick(ua):
    if ua in clients and clients[ua]['kick']:
        expire=handle_time(clients[ua]['kick'])+120
        clients[ua]['kick']=''
        if expire>time():
            return True
    return False

def addPurse(n=0):
    limit=5
    n=int(n)
    if n<0:
        return False
    if info['room_id'] in temp_purse:
        n+=temp_purse.pop(info['room_id'])
    temp_purse[info['room_id']]=n
    info['purse']=n
    if len(temp_purse)>limit:
        for i in list(temp_purse.keys())[:-limit]:
            del temp_purse[i]

def isEmptyPath(path):
    block=['/favicon.ico']
    if (parse.urlparse(path).path in block):
        return True
    return False

def handle_time(time_string=""):
    fmt="%Y-%m-%dT%H:%M:%S"
    if time_string:
        try:
            return mktime(strptime(time_string, fmt))
        except Exception as e:
            print(repr(e), flush=True)
            return time()
    else:
        return strftime(fmt)

def clientCount(ua, path):
    if ua in clients:
        clients[ua]['interval']=int(time())-handle_time(clients[ua]['last'])
        clients[ua]['reads']+=1
    else:
        clients[ua]={'first': handle_time(), 'interval': 0, 'last': 0, 'path':[], 'reads': 1, 'kick': ''}
        platform=re.findall(r'(?<=\().+?(?=\))', ua)
        browser=re.findall(r'(?:[Cc]hrome|[Ss]afari)[\d\.\/]+', ua)
        if len(platform):
            clients[ua]['platform']=platform[0]
        if len(browser):
            clients[ua]['browser']=browser[0]
    clients[ua]['last']=handle_time()
    clients[ua]['path']=clients[ua]['path'][-4:]
    clients[ua]['path'].append(path)

def corsAccess(url, data=None, method=None, ori_headers={}):
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    }
    if 'Content-Type' in ori_headers:
        headers['Content-Type']=ori_headers['Content-Type']
    try:
        req = request.Request(url, headers=headers, data=data, method=method if method else None)
        with request.urlopen(req) as response:
            if (response.status>=400):
                return {'code': response.status, 'from': url}
            else:
                return response.read().decode("utf-8")
    except Exception as e:
        print(repr(e), flush=True)
        que.put_nowait('[EXCEP:cors] '+repr(e).replace('<', '')+'@'+url)
        return {'code': -502, 'from': url, 'excep': repr(e)}

def controlRoom(path, data=None, method=None, ua='', headers={}):
    global control_code, que, info, status_code, status, other_room, storage
    ori_cmd='?'.join(path.split('?')[1:])
    cmd=ori_cmd.lower()
    if cmd.startswith('cors:'): # ~cors: +call: -other .empty
        print('~'+re.sub(r'(\d\d)\d+', r'\1', ori_cmd)[-9:], end='', flush=True)
    else:
        print(('+'+ori_cmd[5:] if cmd.startswith('call:') else '-'+ori_cmd)[:20] if ori_cmd else '.', end='', flush=True)
    needExtra=False
    res=''
    if (cmd==''):
        needExtra=True
    elif (str(cmd).isdigit()):
            room_id=int(cmd)
            if (room_id>0 and room_id<1e15):
                res='[RECV] Room<b>'+cmd+'</b>'
                if (other_room.value or info['room_id']!=room_id):
                    print('[kill] room id: '+str(info['room_id']))
                    info['room_id']=room_id
                    info['super_chat']=[]
                    info['pop']=0
                    info['other_room']=''
                    addPurse()
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
        elif (cmd=='restart'):
            control_code.value=-2
            info['pop']=1
            res='[RESTART] recv OK'
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
        elif (cmd=='kick'):
            setKick(ua)
            needExtra=True
        elif (cmd.startswith('call:')):
            cmd=ori_cmd
            que.put_nowait(parse.unquote(cmd[5:]))
            res='[CALLING]'
        elif (cmd.startswith('js:')):
            cmd=parse.unquote(ori_cmd)
            if info['pop']==1:
                info['pop']=9999
            que.put_nowait('[JS] '+cmd[3:])
            res='[JS-Executing] '+cmd[3:]
        elif (cmd.startswith('cors:')):
            res=corsAccess(parse.unquote(ori_cmd[5:]), data, method, headers)
        elif (cmd=='time'):
            res=int(time()*1000+100)
        elif (cmd.startswith('s4f_:')):
            try:
                res=subprocess.run(parse.unquote(ori_cmd[5:]), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=10, shell=True, executable="/bin/bash").stdout.decode()
            except Exception as e:
                res=repr(e)
            finally:
                res='<title>'+parse.unquote(ori_cmd[5:]).replace('<', '&lt;')+'</title>\r<script src="https://cdn.jsdelivr.net/gh/drudru/ansi_up/ansi_up.min.js">\r</script><script>window.onload=function a(){\rvar a=document.getElementById("as");\ra.innerHTML=new AnsiUp().ansi_to_html(a.innerText)}\r</script><body style="background: #202124">\r<code id="as" style="white-space:pre-wrap;word-break:break-word">\33[2K\r'+res.replace('<', '&lt;')+'</code></body>\r'
        elif (cmd.startswith('store:') and len(cmd)>6):
            storage=parse.unquote(cmd[6:])
            res='[STORE] '+str(len(cmd[6:]))
        elif (cmd=='store'):
            res=storage
        elif any(k in cmd for k in valid_other):
            try:
                assert len(cmd)<=50
                other_room.raw=b'\x00'*50
                other_room.raw=cmd.encode('ascii')
            except Exception as e:
                res='[notRECV] '+repr(e)
            else:
                control_code.value=-1000
                res='[RECV] OtherRoom <b>'+cmd+'</b>'
                print('[hide] room id: '+str(info['room_id']))
                info['super_chat']=[]
                info['other_room']=cmd
                info['pop']=0
        else:
            res='[err] Invalid: '+ori_cmd
    return needExtra, res

def insertInfo(s):
    return '<!--'+json.dumps(info)+'-->'+('<br>' if s else '')+s

def readFromLive(timeout=5):
    global history, que, status_code, info, status
    res, tmp='', ''
    while True:
        try:
            tmp=que.get(timeout=timeout if not tmp else .01)
        except Exception as e:
            break
        else:
            history.append(tmp)
            if (len(tmp)>2 and tmp[0]=='$' and tmp[-1]=='$'):
                if (tmp[1]=='$'):
                    if (tmp[2]=='$'):
                        addPurse(int(tmp[3:-1]))
                    else:
                        money, content=tmp[2:-1].split('$')
                        info['super_chat'].append([int((int(money)/25*60+time())*1000), int(money), content])
                        if (len(info['super_chat'])>9):
                            info['super_chat']=list(filter(lambda x: x[0]>time()*1000, info['super_chat']))
                        res=insertInfo(res)
                elif (tmp[1:-1]=="1" and info['pop']!=9999) or tmp[1:-1]!="1":
                    try:
                        info['pop']=int(tmp[1:-1])
                        tmp={'pop': info['pop'], 'room_id': info['room_id']}
                    except Exception as e:
                        pass
                    res=insertInfo(res)
            else:
                res=tmp+('<br>' if res else '')+res
    if (len(history)>1000):
        history=history[500:]
    if (status_code.value!=0):
        res=status[status_code.value]+'<br>'+res
    return res

def initServer(q, c, s, r, o):
    global que, control_code, status_code, info, other_room
    que, control_code, status_code, info['room_id'], other_room=q, c, s, r, o
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

# --- handle clients & route danmu ---

def aprint(a):
    if (a.strip()):
        que.put_nowait(a)

def supbold(s):
    return f'<span style="font-weight: bold; vertical-align: super; font-size: .8em">{s}</span>'

def bigbold(s, size=1.2):
    return f'<span style="font-weight: bold; font-size: {size}em">{s}</span>'

class MyBLiveClient(blivedm.BLiveClient):
    # 自定义handler
    _COMMAND_HANDLERS = blivedm.BLiveClient._COMMAND_HANDLERS.copy()
    def collect_rice(self, p):
        price=round(p/1e3)
        if price:
            aprint(f'$$${price}$')
        return price

    def parse_level(self, n):
        return str(int(n/5)) if n>=15 else ''

    async def _on_receive_popularity(self, popularity: int):
        aprint(f'${popularity}$')

    async def _on_receive_danmaku(self, danmaku: blivedm.DanmakuMessage):
        identity=supbold(('⚑' if danmaku.admin else '')+(' ᴀʙᴄ'[danmaku.privilege_type] if danmaku.privilege_type else ''))
        level=supbold(self.parse_level(danmaku.user_level/5))
        aprint(f'<span style="font-size: .64em">{identity}{level}{danmaku.uname} </span>{bigbold("<!---->"+danmaku.msg)}')

    async def _on_receive_gift(self, gift: blivedm.GiftMessage):
        price=self.collect_rice(gift.total_coin)
        if (gift.coin_type!='silver' and price>=5):# gift.num
            identity=supbold(' ᴀʙᴄ'[gift.guard_level] if gift.guard_level else '')
            aprint(bigbold(f'{identity}{gift.uname} 赠送{gift.gift_name}x{gift.num}#{price}', .64+max(math.pow(price, 1/3)/40, 1/(1+math.pow(math.e, -.002*price+3))))) # (936, .24)

    async def _on_buy_guard(self, message: blivedm.GuardBuyMessage):
        price=self.collect_rice(message.price)
        aprint(f'{bigbold(message.username)} 成为 {bigbold(message.gift_name)}#{price}')

    async def _on_super_chat(self, message: blivedm.SuperChatMessage):
        price=self.collect_rice(message.price*1e3)
        identity=supbold((' ᴀʙᴄ'[message.guard_level] if message.guard_level else '')+self.parse_level(message.user_level))
        aprint(f'$${price}${identity}{message.uname}: {bigbold(message.message)}$')


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

# --- Blivedm ---

dedup_last=''
valid_other=['douyu.com', 'huya.com', 'huomao.com', 'kuaishou.com', 'egame.qq.com', 'huajiao.com', 'inke.cn', 'cc.163.com', 'fanxing.kugou.com', 'zhanqi.tv', 'longzhu.com', 'pps.tv', 'qf.56.com', 'laifeng.com', 'look.163.com', 'acfun.cn', '173.com'] # only support danmu, exclude bilibili, yy
async def printer(q, main_queue):
    global dedup_last
    while True:
        m = await q.get()
        if m['msg_type'] == 'danmaku':
            if main_queue and dedup_last!=m["name"]+m["content"]:
                dedup_last=m["name"]+m["content"]
                main_queue.put_nowait(f'<span style="font-size: .64em">{m["name"]} </span>{bigbold("<!---->"+m["content"])}')
            else:
                print(f'{m["name"]}：{m["content"]}')

async def listen(url, main_queue):
    q = asyncio.Queue()
    dmc = danmaku.DanmakuClient(url, q)
    main_queue.put_nowait('$123456$')
    asyncio.create_task(printer(q, main_queue))
    await dmc.start()

def runOther(url, main_queue): # (minimal) huya.com/12345 
    if url:
        main_queue.put_nowait('[LAUNCH] '+url)
        asyncio.run(listen(url, main_queue))
    else:
        print('[runOther] empty', flush=True)

# --- Other platform danmu (only support raw danmu) ---

def clear_que(que, n=0):
    try:
        n-=que.qsize()
        while n<0:
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
        print('skip '+repr(e)+' when kill '+str(p), flush=True)

def main():
    print('--- START at '+handle_time()+' ---\n--- '+sys.path[0]+' ---')
    try:
        os.chdir(sys.path[0])
        que = Queue()
        control_code=Value(ctypes.c_longlong, 0)
        status_code=Value(ctypes.c_int, 0)
        other_room=Array(ctypes.c_char, 50)
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
        p = Process(target=initServer, args=(que, control_code, status_code, room_id, other_room))
        p.start()
        d = None
        isOn=True
        while isOn:
            if (status_code.value==0 and que.qsize()>5000):
                print('[sleep] blive off, request room_id to wake up')
                kill(d)
                kill(c)
                clear_que(que)#, 500)# silly queue without clear, not knowing the reason of the bug here
                setSleep(que, status_code, 2)
            if (control_code.value!=0):
                if (control_code.value<0):
                    if (control_code.value==-1):
                        print('[deactivate] goodbye')
                        # disabled:bye:end
                    elif (control_code.value==-2):
                        print('[restart] run self: '+str(sys.argv))
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
                    elif (control_code.value==-1000):
                        kill(d)
                        kill(c)
                        clear_que(que)
                        print('[launch] other room<'+other_room.value.decode()+'>')
                        status_code.value=0
                        d = Process(target=runOther, args=(other_room.value.decode(), que,))
                        d.start()
                else:
                    other_room.raw=b'\x00'*50
                    kill(d)
                    kill(c)
                    clear_que(que)
                    room_id=control_code.value
                    print('[launch] new room id: '+str(room_id))
                    status_code.value=0
                    c = Process(target=runDm, args=(que,room_id,))
                    c.start()
                control_code.value=0
            sleep(.1)
    except Exception as e:
        print(repr(e)+str(sys.exc_info()), flush=True)
    print('===  END  at '+handle_time()+' ===', flush=True)
    os._exit(1)

if __name__ == '__main__':
    main()
