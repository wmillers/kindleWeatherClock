## 介绍(Introduce):  
功能包括时间显示、天气预报、番茄时钟、滴答清单、B站直播弹幕。屏幕尺寸适配KPW3，如有需要可以自行调整css。  
Kindle Weather & Tomato Clock & Ticktick Reminder & Bilibili Live Danmu. Display For KPW3, but you can change it by edit css.

## 功能(Function):
|ZH|EN|Default|How to run|使用按钮|
|-|-|-|-|-|
|时间显示|Time Display|√|-|-|
|天气预报|Weather|√|-|-|
|番茄时钟|Tomato Clock|√|05: run/relax, 40: pause, 同步时间: quit|05：工作/休息模式切换， 40：暂停，同步时间：退出|
|滴答清单|Ticktick Reminder|×|tickList (the tomato icon)|左上角番茄图标|
|B站直播弹幕|Bilibili Live Danmu|×|danmu (the blank area left to the 5月26日)|5月26日左侧的空白处|
|额外（1.校准时间 2.获取运行时长 3.运行命令/手动调时）|Extra (1.get time from server 2.uptime 3.run Cmd/calibrate time manually)|√|1.TOMA 2.MATO 3.5月26日 星期一|-|

## 排版(Demo):  
tickList  
<font size=7>05:40</font><br>
danmu <b>TOMAMATO<br>
5月26日 星期一</b><br>
<font size=5>======weather======</font><br>
同步时间：2019-05-26 03:54:00 完成上一次同步</font>

## 可选-部署(Optional-Install):
上功能表中打勾项表示无需额外安装，在Kindle中打开网页即可，打叉项表示该功能需要额外安装（需要一个Nginx服务端）。  
需要在服务端配置文件中添加的代码在每个功能块的注释中。  
Checked functions in the table above mean these are standalone, otherwise means these are relied on a running Nginx server with a proper config.  
Extra code needed to add in the config file is in the function's comments before its code area.  

### 滴答清单(Ticktick Reminder)
因为浏览器跨域限制，需要手动代理滴答清单订阅网址。  
将该代码前注释中的`location /ics/ {..}`代码复制到Nginx配置文件中，并修改`https://xxx/basic.ics`处的网址为你的滴答清单任务订阅网址。  
You need to add proxy to the Ticktick Reminder task subscription url to avoid browser's CROS error.  
Copy the `location /ics/ {..}` code to your Nginx config and edit `https://xxx/basic.ics` url to your personal subsciption url.  

### B站直播弹幕(Bilibili Live Danmu)
根据`cw.htm`文件弹幕功能代码段前的注释安装依赖。将`location /blive/ {..}`中内容复制到Nginx配置文件中。进入`blivedm`文件夹，`python3 startBliveServer.py`运行弹幕获取服务端。  
Install `python3` requirements by the command line I write in the comments before the `danmu` code area. Copy `location /blive/ {..}` to your nginx config. `cd` into `blivedm` folder, run the danmu receive server by `python3 startBliveServer.py`.  
