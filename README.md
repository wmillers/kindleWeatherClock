## 介绍(Introduce):  
功能包括时间显示、天气预报、番茄时钟、滴答清单、B站直播弹幕。屏幕尺寸适配KPW3，如有需要可以自行调整css。
Kindle Weather & Tomato Clock & Ticktick Reminder & Bilibili Live Danmu. Display For KPW3, but you can change it by edit css.

## 功能(Funcion):
|ZH|EN|Default|
|-|-|-|
|时间显示|Time Display|√|
|天气预报|Weather|√|
|番茄时钟|Tomato Clock|√|
|滴答清单|Ticktick Reminder|×|
|B站直播弹幕|Bilibili Live Danmu|×|

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

### 滴答清单
因为浏览器跨域限制，需要手动代理滴答清单订阅网址。  
将该代码前注释中的`location /ics/ {..}`代码复制到Nginx配置文件中，并修改`basic.ics`处的网址为你的滴答清单任务订阅网址。  

###B站直播弹幕
进入`blivedm`文件夹，根据`cw.htm`文件弹幕功能代码段前的注释安装依赖。将`location /blive/ {..}`中内容复制到Nginx配置文件中。`python3 startBliveServer.py`运行弹幕获取服务端。  
