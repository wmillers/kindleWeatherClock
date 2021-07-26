![GitHub release](https://img.shields.io/github/release/wmillers/kindleWeatherClock.svg?color=yellow&style=flat-square)
[![DeepScan grade](https://deepscan.io/api/teams/13271/projects/16273/branches/344913/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=13271&pid=16273&bid=344913)
[![CodeFactor](https://www.codefactor.io/repository/github/wmillers/kindleweatherclock/badge/master)](https://www.codefactor.io/repository/github/wmillers/kindleweatherclock/overview/master)  
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/wmillers/kindleWeatherClock?color=dodgerblue&style=flat-square)
![last_commit](https://img.shields.io/github/last-commit/wmillers/kindleWeatherClock.svg?color=aquamarine&style=flat-square)  
## 介绍(Introduce):  
前言：本多功能 Kindle 页面的部分功能由于部署在服务端所以额外需要安装，请务必阅读本文“可选-需要手动部署”段并修改附带的`nginx.conf`实例文件。
Preface: some functions of this Kindle Page need to be mannually installed due to their dependancy on the server. Please follow the section Optional-How-to-Install and edit the `nginx.conf` example file (or create a new config file) as your own's one.

功能包括时间显示、天气预报、番茄时钟、滴答清单、B站直播弹幕、智能家居Hue。屏幕尺寸适配KPW3，如有需要可以自行调整css。  
Kindle Weather & Tomato Clock & Ticktick Reminder & Bilibili Live Danmu & Home Smart for Philips-Hue. Display For KPW3, but you can change it by edit css.

## 功能(Function):
|ZH|EN|Default|How to run|使用按钮|
|-|-|-|-|-|
|时间显示|Time Display|√|-|-|
|天气预报|Weather|√|-|-|
|番茄时钟|Tomato Clock|√|05: run/relax, 40: pause, 同步时间: quit|05：工作/休息模式切换， 40：暂停，同步时间：退出|
|滴答清单|Ticktick Reminder|×|tickList (top left tomato icon)|左上角番茄图标|
|B站直播弹幕|Bilibili Live Danmu|×|danmu (the blank area left to the 5月26日)|5月26日左侧的空白处|
|智能家居Hue|Home Smart for Philips-Hue|√×|home (top right blank corner)|右上角的空白区域|
|额外（1.校准时间 2.获取运行时长 3.运行命令/手动调时 4.禁用模块）|Extra (1.get time from server 2.uptime 3.run Cmd/calibrate time manually 4.disable modules)|√|1.TOMA 2.MATO 3.5月26日 星期一 4.在cw.htm文件第14行Line14~起注释Comment模块以禁用Disable|-|

## 排版(Demo):  
tickList  home  
<font size=7>05:40</font><br>
danmu <b>TOMAMATO<br>
5月26日 星期一</b><br>
<font size=5>====weather====</font><br>
同步时间：2019-05-26 03:54:00 完成上一次同步</font>

## 可选-需要手动部署(Optional-How-to-Install):
上功能表中打勾项表示无需额外安装，在Kindle中打开网页即可，打叉项表示该功能需要额外安装（需要一个Nginx服务端）。  
需要在服务端配置文件中添加的代码在每个功能块的注释中。  
Checked functions in the table above mean these are standalone, otherwise means these are relied on a running Nginx server with a proper config.  
Extra code needed to add in the config file is in the function's comments before its code area.  

### 滴答清单(Ticktick Reminder)
由于浏览器跨域限制，需要反向代理滴答清单订阅网址。  
将该代码前注释中的`location /ics/ {..}`代码复制到Nginx配置文件中，并修改`https://xxx/basic.ics`处的网址为你的滴答清单任务订阅网址。另外请将`//TIMEZONE-NOTE`所在行的时区信息`DTSTART;TZID=`修改为滴答清单使用的。  
You need to add reverse proxy to the Ticktick Reminder task subscription url to avoid browser's CORS error.  
Copy the `location /ics/ {..}` code to your Nginx config and edit `https://xxx/basic.ics` url to your personal subsciption url.  
Also, edit the `DTSTART;TZID=` timezone to your Ticktick Reminder used in the line where commented with `//TIMEZONE-NOTE`.

### B站直播弹幕(Bilibili Live Danmu)
备注：弹幕全屏功能（不是全窗口功能）在其他系统的浏览器中也可以使用，开启方法为在网址后添加`#danmuOnly()`或者点击星期栏输入`danmuOnly()`。
Note: the fullscreen mode (not the fullwindow mode) of danmu is adapted to other platform (Win 10, ios, Android). To use it add the `#danmuOnly()` behind the url link ,or click the week on the page and input `danmuOnly()` in the prompt window.

根据`cw.htm`文件弹幕功能代码段前的注释安装依赖。将`location /blive/ {..}`中内容复制到Nginx配置文件中。进入`blivedm`文件夹，`python3 startBliveServer.py`运行弹幕获取服务端。  
Install `python3` requirements by the command line I write in the comments before the `danmu` code area. Copy `location /blive/ {..}` to your nginx config. `cd` into `blivedm` folder, run the danmu receive server by `python3 startBliveServer.py`.  

### 智能家居Hue(Home Smart for Philips-Hue)
适配飞利浦Hue智能家居的开关。Hue中继桥的api带CORS跨域操作头，可以不需要手动代理，但是为了稳定性，此处仍然提供手动代理的步骤：将该代码前注释中的`location /hue/ {..}`代码复制到Nginx配置文件中。如果不需要手动代理，则将网页代码中`hueBaseUrl`变量修改为`//philips-hue/api/`。  
为获取api授权操作码，按下Hue中继桥的配对按钮，在本页运行hReg()，记录返回的凭证，并手动修改页面文件`Basic Settings`中变量`hueToken`为该值。  
Smart home switch for Philips-Hue products. Response Header returned from Hue bridge api contains allow CORS *, therefore it's optional to proxy the request. Here are the setups if you want it more reliable: copy the `location /hue/ {..}` code to your Nginx config. If you want to disable the proxy, edit the content of the `hueBaseUrl` variable in the page source code file to `//philips-hue/api/`.  
To get Hue api token: 1.Press the Hue Link button 2. Run hReg() 3. Change the content of the `hueToken` variable in the page source code file's `Basic Settings`.  
