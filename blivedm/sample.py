# -*- coding: utf-8 -*-

import asyncio
import sys
import blivedm
from time import sleep

class MyBLiveClient(blivedm.BLiveClient):
    # 演示如何自定义handler
    _COMMAND_HANDLERS = blivedm.BLiveClient._COMMAND_HANDLERS.copy()

    async def __on_vip_enter(self, command):
        print(command)
    _COMMAND_HANDLERS['WELCOME'] = __on_vip_enter  # 老爷入场

    async def _on_receive_popularity(self, popularity: int):
        print(f'当前人气值：{popularity}')
        sys.stdout.flush()

    async def _on_receive_danmaku(self, danmaku: blivedm.DanmakuMessage):
        print(f'{danmaku.uname}：{danmaku.msg}')
        sys.stdout.flush()

    async def _on_receive_gift(self, gift: blivedm.GiftMessage):
        print(f'{gift.uname} 赠送{gift.gift_name}x{gift.num} （{gift.coin_type}币x{gift.total_coin}）')
        sys.stdout.flush()

    async def _on_buy_guard(self, message: blivedm.GuardBuyMessage):
        print(f'{message.username} 购买{message.gift_name}')
        sys.stdout.flush()

    async def _on_super_chat(self, message: blivedm.SuperChatMessage):
        print(f'醒目留言 ¥{message.price} {message.uname}：{message.message}')
        sys.stdout.flush()


async def main():
    # 参数1是直播间ID
    # 如果SSL验证失败就把ssl设为False
    client = MyBLiveClient(roomId, ssl=True)
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


if __name__ == '__main__':
    print("LIVEON")
    if len(sys.argv)==2:
        roomId=int(sys.argv[1])
    else:
        roomId=16548
    print(roomId)
    sys.stdout.flush()
    asyncio.get_event_loop().run_until_complete(main())
