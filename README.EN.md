![GitHub release](https://img.shields.io/github/release/wmillers/kindleWeatherClock.svg?color=yellow&style=flat-square)
![GitHub commit activity](https://img.shields.io/github/commit-activity/m/wmillers/kindleWeatherClock?color=dodgerblue&style=flat-square)
![last_commit](https://img.shields.io/github/last-commit/wmillers/kindleWeatherClock.svg?color=aquamarine&style=flat-square)  
[中文](README.md) | **英文**
## Introduce   
Preface: some functions of this Kindle Page need to be mannually installed due to their dependancy on the server. Please follow the section Optional-How-to-Install and edit the `nginx.conf` example file (or create a new config file) as your own's one.

Kindle Weather, Tomato Clock, Ticktick Reminder, BiliBili Live Danmu & Player, Home Smart for Philips-Hue. Display For KPW3 (Live Player exclusive for newer browser), but you can change it by edit css.

## Function
|Module Name|Default|Activate|
|-|-|-|
|Time Display|√|-|
|Weather|√|-|
|Tomato Clock|√|15: run/relax, 04: pause, 同步时间: quit|
|Ticktick Reminder|×|tickList (top left tomato icon)|
|BiliBili Live Danmu|×|danmu (the blank area left to the 1月2日)|
|BiliBili Live Player (except kindle)|×|add `#danmuonly` to the url|
|Home Smart for Philips-Hue|√×|home (top right blank corner)|
|Extra (1.get time from server 2.uptime 3.run Cmd/calibrate time manually 4.disable modules)|√|1.TOMA 2.MATO 3.1月2日 星期一 4.在cw.htm文件第14行Line14~起注释Comment模块以禁用Disable|

## DEMO  
tickList  home  
 <font size=7> 15:04</font><br>
danmu <b>TOMAMATO<br>
1月2日 星期一</b><br>
<font size=5>====weather====</font><br>
同步时间：2006-01-02 15:04:05 完成上一次同步</font>

## Optional-How-to-Install 
Checked functions in the table above mean these are standalone, otherwise means these are relied on a running Nginx server with a proper config.  
Extra codes for the config file are in the function's comments before its code area.  

### Ticktick Reminder
You need to add reverse proxy to the Ticktick Reminder task subscription url to avoid browser's CORS error.  
Copy the `location /ics/ {..}` code to your Nginx config and edit `https://xxx/basic.ics` url to your personal subsciption url.  
Also, change the `DTSTART;TZID=` timezone with your Ticktick Reminder used. You can find it with the comment `//TIMEZONE-NOTE`.

### BiliBili Live Danmu / Player
**The new server is written by Go while the Python version is moved to old-stable branch. Due to lack of Douyu/Huya/CC's modules, in this version the Danmu server only support Bilibili**

Credit to [Akegarasu/blivedm-go@Github](https://github.com/Akegarasu/blivedm-go) to receive danmu (including gift messages) from BiliBili (the original module doesn't support to be imported as its lack of non-fatal error handling and stop method. if in need, you can try to use this adjust one `github.com/wmillers/blivedm-go`). 

Note: Full screen mode can be the alternative to the BiliBili's native live page, which is a faster version that can be smoothly loaded on the low-power device. The fullscreen mode (not the fullwindow mode) of danmu is adapted to other platform (Win 10, ios, Android). To use it add the `#danmuOnly()` behind the url link ,or click the week on the page and input `danmuOnly()` in the prompt window.

Install `python3` requirements by the command line I write in the comments before the `danmu` code area. Copy `location /blive/ {..}` to your nginx config. `cd` into `blivedm` folder, run the danmu receive server by `python3 startBliveServer.py`. If you want to change the preset room, search and edit content after `var streamer`.  Sub-array `streamer[1]` streamer's room id (number) is necessary, `streamer[0]` is streamer's name.  

### Home Smart for Philips-Hue
Smart home switch for Philips-Hue products. Response Header returned from Hue bridge api contains allow CORS *, therefore it's optional to proxy the request. Here are the setups if you want it more reliable: copy the `location /hue/ {..}` code to your Nginx config. If you want to disable the proxy, edit the content of the `hueBaseUrl` variable in the page source code file to `//philips-hue/api/`.  
To get Hue api token: 1.Press the Hue Link button 2. Run hReg() 3. Change the content of the `hueToken` variable in the page source code file's `Basic Settings`.  
