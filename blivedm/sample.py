#!/usr/bin/python3
# -*- coding: utf-8 -*-

import asyncio
import sys
import blivedm
from time import sleep
from multiprocessing import Process, Queue
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class Resquest(BaseHTTPRequestHandler):
    history=[]
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        if (que.empty()):
            res="EMPTY"
        else:
            buffer=[]
            if (len(self.history)>100):
                self.history=self.history[50:]
            while not que.empty():
                tmp=que.get_nowait()
                buffer.append(tmp)
                self.history.append(tmp)
            res='<br>'.join(buffer)
        self.wfile.write(res.encode('utf-8'))

def initServer(r):
    global que
    que=r
    host = ('localhost', 8080)
    server = HTTPServer(host, Resquest)
    print("Starting server, listen at: %s:%s" % host)
    server.serve_forever()


def aprint(a):
    que.put_nowait(a)

class MyBLiveClient(blivedm.BLiveClient):
    # 演示如何自定义handler
    _COMMAND_HANDLERS = blivedm.BLiveClient._COMMAND_HANDLERS.copy()

    async def __on_vip_enter(self, command):
        aprint(command)
    _COMMAND_HANDLERS['WELCOME'] = __on_vip_enter  # 老爷入场

    async def _on_receive_popularity(self, popularity: int):
        aprint(f'当前人气值：{popularity}')

    async def _on_receive_danmaku(self, danmaku: blivedm.DanmakuMessage):
        aprint(f'{danmaku.uname}：{danmaku.msg}')

    async def _on_receive_gift(self, gift: blivedm.GiftMessage):
        aprint(f'{gift.uname} 赠送{gift.gift_name}x{gift.num} （{gift.coin_type}币x{gift.total_coin}）')

    async def _on_buy_guard(self, message: blivedm.GuardBuyMessage):
        aprint(f'{message.username} 购买{message.gift_name}')

    async def _on_super_chat(self, message: blivedm.SuperChatMessage):
        aprint(f'醒目留言 ¥{message.price} {message.uname}：{message.message}')


async def initDm():
    # 参数1是直播间ID
    # 如果SSL验证失败就把ssl设为False
    client = MyBLiveClient(int(sys.argv[1]) if len(sys.argv)==2 else 8178490, ssl=True)
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

def main(s):
    aprint("LIVEON")
    global que
    que=s
    sys.stdout.flush()
    asyncio.get_event_loop().run_until_complete(initDm())


if __name__ == '__main__':
    que = Queue(False) #建立管道，拿到管道的两端，双工通信方式，两端都可以收发消息
    p = Process(target=initServer, args=(que,)) #将管道的一段给子进程
    c = Process(target=main, args=(que,)) #将管道的一段给子进程
    p.start() #开启子进程
    c.start()
    p.join()
    c.join()