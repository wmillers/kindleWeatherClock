![GitHub release](https://img.shields.io/github/release/wmillers/kindleWeatherClock.svg?color=yellow&style=flat-square)
[![DeepScan grade](https://deepscan.io/api/teams/13271/projects/16273/branches/344913/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=13271&pid=16273&bid=344913)
[![CodeFactor](https://www.codefactor.io/repository/github/wmillers/kindleweatherclock/badge/master)](https://www.codefactor.io/repository/github/wmillers/kindleweatherclock/overview/master)  
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/wmillers/kindleWeatherClock?color=dodgerblue&style=flat-square)
![last_commit](https://img.shields.io/github/last-commit/wmillers/kindleWeatherClock.svg?color=aquamarine&style=flat-square)  
**中文** | [英文](README.EN.md)
## 介绍
前言：多功能 Kindle 页面的部分功能由于部署在服务端所以额外需要安装，请务必阅读本文“可选-需要手动部署”段修改并应用附带的`nginx.conf`实例文件。  

功能包括时间显示、天气预报、番茄时钟、滴答清单、哔哩哔哩/斗鱼/网易CC直播弹幕 & 播放、智能家居Hue。屏幕尺寸适配KPW3，如有需要可以自行调整css。  

## 功能
|模块名|默认|使用方式|
|-|-|-|
|时间显示|√|-|
|天气预报|√|-|
|番茄时钟|√|05：工作/休息模式切换， 40：暂停，同步时间：退出|
|滴答清单|×|左上角番茄图标|
|哔哩哔哩/斗鱼/网易CC直播弹幕|×|5月26日左侧的空白处|
|哔哩哔哩/斗鱼/网易CC直播播放（其他系统专属）|×|在网址后添加 `#danmuonly`|
|智能家居Hue|√×|右上角的空白区域|
|额外（1.校准时间 2.获取运行时长 3.运行命令/手动调时 4.禁用模块）|√|1.TOMA 2.MATO 3.5月26日 星期一 4.在cw.htm文件第14行Line14~起注释Comment模块以禁用Disable|

## 排版
tickList  home  
<font size=7>05:40</font><br>
danmu <b>TOMAMATO<br>
5月26日 星期一</b><br>
<font size=5>====weather====</font><br>
同步时间：2019-05-26 03:54:00 完成上一次同步</font>

## 可选-需要手动部署
功能表中打勾项表示无需额外安装，Kindle中打开网页即可使用，打叉项表示该功能需要额外安装（Nginx服务端）。  

### 滴答清单
由于浏览器跨域限制，需要反向代理滴答清单订阅网址。  

将该代码前注释中的`location /ics/ {..}`代码复制到Nginx配置文件中，并修改`https://xxx/basic.ics`处的网址为你的滴答清单任务订阅网址。另外请将`//TIMEZONE-NOTE`所在行的时区信息`DTSTART;TZID=`修改为滴答清单使用的。  

### 哔哩哔哩 / 斗鱼 / 网易CC 直播弹幕 & 播放器
感谢 [xfgryujk/blivedm@Github](https://github.com/xfgryujk/blivedm) 作为接收包含礼物的哔哩哔哩弹幕后端，[wbt5/real-url@Github](https://github.com/wbt5/real-url/) 提供解析斗鱼/网易CC直播源的思路以及对应的纯弹幕接收后端。

备注：全屏播放器功能用于替代哔哩哔哩/斗鱼/网易CC原生直播间，优点是即使在低功耗设备上也可以流畅运行。全屏功能（不是全窗口功能）为其他系统的浏览器中所属功能，开启方法为在网址后添加`#danmuOnly()`或者点击星期栏输入`danmuOnly()`。

根据`cw.htm`文件弹幕功能代码段前的注释安装依赖。将`location /blive/ {..}`中内容复制到Nginx配置文件中。进入`blivedm`文件夹，`python3 startBliveServer.py`运行弹幕获取服务端。如果要修改内置的房间号，搜索`var streamer`，在数组`[1]`中加入房间数字id（可选：数组`[0]`中对应索引填写主播名）。  

### 智能家居 Hue
适配飞利浦Hue智能家居的开关。Hue中继桥的api自带CORS跨域操作头，可以不需要手动代理，但是为了稳定性，此处仍然提供手动代理的步骤：将该代码前注释中的`location /hue/ {..}`代码复制到Nginx配置文件中。如果不需要手动代理，则将网页代码中`hueBaseUrl`变量修改为`//philips-hue/api/`。  

为获取api授权操作码，按下Hue中继桥的配对按钮，在本页运行hReg()，记录返回的凭证，并手动修改页面文件`Basic Settings`中变量`hueToken`为该值。 