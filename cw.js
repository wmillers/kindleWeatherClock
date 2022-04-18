"use strict";
/***************Basic settings***************
Note: Most you need to configure are in the Basic
    settings. If you want to use extra modules, please
    follow the instructions in README.md, and add
    the `location xxx {}` things in this file to
    your nginx config.
*/
var forTestUse=false;//If you are not sure, please change it to false
var info={
    version: '1.6',
    description: '(changes are in commit logs)',
    author: 'wmillers@github',
    support: ['time', 'weather',//those two are default modules
        //'TO-DISABLE-EXTRA-MODULES//COMMENT-THE-LINE',
        //'tomato',
        'ticklist',
        'danmu',
        'home',
        'lunaryear',
    ],
    license: 'LGPL2.1'
}
var isOnKindle=!/windows|chrome/i.test(navigator.userAgent);//most affect autostart
var autostart=isOnKindle?[//COMMENT unwanted auto-start modules
    'ticklist',
    //'danmu',
    'home',
    ]:[];
var isDanmuFullWindow=true;   // danmu start in fullwindow mode (not fullscreen)
var liveOption={
    enable: true,     // play live on roomId changed, only in fullscreen (not fullwindow) mode #danmuonly
    quality: 3,       // final quality depends on the server (fallback to the better one): 2 80, 3 150, 4 10000 (best)
    occupy: true,     // kick other clients, in danmuOnly
    blockList: true,  // apply block list to danmu live tuber
    lowPower: true,   // set quality to 3 and make audio only if 4 (10000) is the only option. Useful on software-decode devices.
    dark: 'auto',     // auto, dark, light, off
};
if (liveOption.lowPower&&liveOption.quality>=4)
    liveOption.quality=3;
var hueBaseUrl = '/hue/';     // '//philips-hue/api/' if no need CORS Access-Control-Allow-Origin *
var hueToken = "UDp1xs0RpZiOho4oX7PY-L7fpAOe8pYnOMTK1tfo";// replace with your token, to get: push bridge button and run hReg()
//*******************END**********************

if (!isOnKindle) console.warn('[autostart:disabled] notKindle');
window.onerror=function handler(msg, source, line, col, e){(typeof loaded=="undefined"?alert:comment)((line?'['+line+']':'')+(e?e.stack:msg))};
setTimeout(function isLoaded(){
    if (typeof loaded=="undefined"){
        document.getElementsByClassName('cleaner')[0].innerHTML+='<a href="">js FAILED</a>';
        confirm('JS failed, need reload?')?f5():console.error('[js:failed] reloadRejected');
    }
}, 4000);
if (forTestUse)
    setInterval('comment(how(), true)', 7*1000);
function hasModule(name){
    return info.support.indexOf(name)!=-1;
}

//*********************************** */
if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function(search, rawPos) {
            var pos = rawPos > 0 ? rawPos|0 : 0;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}
var initialTitle = document.title;
var clearCommentTime = 0;
var basket = document.getElementsByClassName('basket')[0];
function comment(s, isJam){
    var lag = 30 * 60 * 1000;
    s = s == undefined ? 'und' : String(s);
    setTimeout(clearComment, lag + 1000);
    if (basket.innerHTML.length == 0 || isJam)
        basket.innerHTML = s;
    else
        basket.innerHTML = (basket.innerHTML + '|' + s).slice(-150);
    clearCommentTime = new Date().getTime() + lag;
    return s;
}
function clearComment(){
    if (new Date().getTime() < clearCommentTime) return;
    basket.innerHTML = '';
}
function stopBubble(){
    try {
        event.stopPropagation();
        event.preventDefault();
    } catch (e){}
    return false;
}
function httpReq(path, f, fOnfailed, post, method, fOnBoth, contentType){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function handle(){
        if (xmlhttp.readyState == 4){
            var s=parseInt(xmlhttp.status);
            if (s>=100&&s<400){
                try {
                    (typeof f=="function"?f:console.log)(xmlhttp.responseText, path);
                } catch (e) {
                    comment(e.stack);
                }
            } else {
                var e=s>=500?'GatewayError':s>=400?'ServerForbidden':'CertConfirm';
                (typeof fOnfailed=="function"?fOnfailed:comment)(s+':'+e+"(F12)", path);
            }
            if (fOnBoth)
                fOnBoth();
        }
    };
    xmlhttp.open(method ? method : post ? 'POST' : 'GET', path);
    if (post)
        xmlhttp.setRequestHeader("Content-Type", contentType?contentType:"application/json");
    xmlhttp.send(post);
    return xmlhttp;
}
function JsonParse(s, quiet){
    var res=s;
    try {
        res=JSON.parse(s);
    } catch (e){
        if (!quiet)
            console.log('[JSON@'+dateString()+':Invalid] <'+s+'>');
    }
    return res;
}

setTimeout(function modulesControl(){
    var funcList = [['tomato', 'ticklist', 'danmu', 'home', 'lunaryear'],
    ['switchTomato', 'showIcs', 'danmuSwitch', 'hSwitch', 'getLunarDay']];
    for (var i=0;i<funcList[0].length;i++)
        if (!hasModule(funcList[0][i]))
            eval(funcList[1][i] + '=' + 'function disabled(){comment("' + funcList[0][i] + ' is DISABLED");return "";}');
    if (!hasModule('home'))
        home.innerHTML = '';
});
var hash=location.hash;
var isDanmuOnly = hash != (hash = hash.replace(/#danmuonly/i, ''));
var isFastLoad = hash != (hash = hash.replace(/#fastload/i, ''))||isDanmuOnly;
if (isDanmuOnly){
    reduceShadow=function und(){};
    killShadow=reduceShadow;
    setTimeout(danmuOnly);
} else {
    setTimeout(function autoStart(){
        if (!forTestUse)
            for (var i = 0; i < autostart.length; i++)
                [showIcs, danmuSwitch, hUpdate][['ticklist', 'danmu', 'home'].indexOf(autostart[i])]();
    });
}
setTimeout(function loadFromHash(){
    //resume task from #a()#b()
    var run = decodeURIComponent(hash).split('#');
    for (var i = 0; i < run.length; i++)
        setTimeout(run[i]);
});
setTimeout(function isVisible(){
    function notVisible(){
        document.title="页面被遮挡";
        comment('页面被遮挡');
    }
    if (document.hidden || document.mozHidden || document.msHidden || document.webkitHidden)
        notVisible();
}, 10000);
/*        Danmu FullScreen (#danmuonly)
Note: this part needs css3 support.

# To skip password and get short link in Nginx reverse proxy 
location /kindle/ {
    access_log off;
    proxy_redirect      off;
    proxy_buffering     off;
    proxy_http_version  1.1;
    proxy_set_header Authorization "Basic c2hhcmU6c2hhcmUwMjRwYXNz";
    proxy_pass "http://NEEDTOCHANGE/PATH/TO/FOLDER/kindle/";
}
*/
var danmu_fr=document.getElementsByClassName('danmu_fr')[0];
var danmu_info=document.getElementsByClassName('danmu_info')[0];
var danmu=document.getElementsByClassName('danmu')[0];
var danmu_live = document.getElementsByClassName('danmu_live')[0];
var danmu_live_info=document.getElementsByClassName('danmu_live info')[0];
var danmu_live_cover=document.getElementsByClassName('danmu_live cover')[0];
var danmuScrollCurrentNum;
var danmuScrollNum;
function danmuOnly(){
    danmuLimit.max=80;
    isDanmuOnly=true;
    window.onerror=null;
    comment=console.log;
    document.body.appendChild(danmu_fr);
    document.getElementsByClassName('app')[0].style.display='none';
    isDanmuFullWindow=true;
    danmu_fr.classList.add('fullscreen');
    document.getElementsByClassName('cleaner')[0].style.display='none';
    danmu.innerHTML='<div style="margin:10vw">Due to browser\'s requirement,<br>fullSceen & video need a user-gesture to activate.<br><u><b>CLICK</b></u> to start.</div>';
    danmuStatus();
    if (liveOption.lowPower)
        danmu.classList.remove('better_view');
    else
        danmu.classList.add('better_view');
    danmuAlter=function danmuAlterScreenOnly(beLess){
        if (!beLess&&dInfo.flag.on){
                danmuContent();
                danmuFirstStatus();
        }
    };
    if (!mpegts.isSupported()){
        liveOption.enable=false;
        comment('mpegtsJsNotSupported');
    }
    if (!forTestUse)
        danmu_live_info.style.color='transparent';
    danmu_live.onended=function end(){
        setTimeout(function act(){
            if (danmu_live.ended)
                danmuWrite(liveOff());
        }, 20e3);
    };
    danmu_fr.oncontextmenu=function notOccupied(){
        if (!dInfo.flag.on){
            if (liveOption.occupy){
                liveOption.occupy=false;
                setTimeout("liveOption.occupy=true", 4e3);
            }
            danmuSwitch();
            return stopBubble();
        }
    };
    danmu_fr.onwheel=function changeVolume(e){
        var d=-e.deltaY/100;//~100
        d=(d>=0?Math.ceil:Math.floor)(d);
        if (typeof danmuScrollNum=='string')
            danmuScrollCurrentNum=((danmuScrollCurrentNum==undefined?0:danmuScrollCurrentNum)+d+10)%10;
        else
            liveChangeVolume(d/10);
        setTimeout(danmuStatus);
        return stopBubble();
    };
    document.onkeydown=function fs(event){
        var e = event || window.event || arguments.callee.caller.arguments[0];
        if(e && e.keyCode==13){ // enter
            danmuFullScreen(true);
        } else if(e && e.keyCode==38 && e.keyCode==87){ // up, w
            liveChangeVolume(.2);
        } else if(e && e.keyCode==40 && e.keyCode==83){ // down, s
            liveChangeVolume(-.2);
        }
    };
}


/* Lunar Year */
var tgString = "甲乙丙丁戊己庚辛壬癸";
var dzString = "子丑寅卯辰巳午未申酉戌亥";
var numString = "一二三四五六七八九十";
var monString = "正二三四五六七八九十冬腊";
var sx = "鼠牛虎兔龙蛇马羊猴鸡狗猪";
var cYear, cMonth, cDay, cLastRecord;
var CalendarData = [0xA4B, 0x5164B, 0x6A5, 0x6D4, 0x415B5, 0x2B6, 0x957, 0x2092F, 0x497, 0x60C96, 0xD4A, 0xEA5, 0x50DA9, 0x5AD, 0x2B6, 0x3126E, 0x92E, 0x7192D, 0xC95, 0xD4A, 0x61B4A, 0xB55, 0x56A, 0x4155B, 0x25D, 0x92D, 0x2192B, 0xA95, 0x71695, 0x6CA, 0xB55, 0x50AB5, 0x4DA, 0xA5B, 0x30A57, 0x52B, 0x8152A, 0xE95, 0x6AA, 0x615AA, 0xAB5, 0x4B6, 0x414AE, 0xA57, 0x526, 0x31D26, 0xD95, 0x70B55, 0x56A, 0x96D, 0x5095D, 0x4AD, 0xA4D, 0x41A4D, 0xD25, 0x81AA5, 0xB54, 0xB6A, 0x612DA, 0x95B, 0x49B, 0x41497, 0xA4B, 0xA164B, 0x6A5, 0x6D4, 0x615B4, 0xAB6, 0x957, 0x5092F, 0x497, 0x64B, 0x30D4A, 0xEA5, 0x80D65, 0x5AC, 0xAB6, 0x5126D, 0x92E, 0xC96, 0x41A95, 0xD4A, 0xDA5, 0x20B55, 0x56A, 0x7155B, 0x25D, 0x92D, 0x5192B, 0xA95, 0xB4A, 0x416AA, 0xAD5, 0x90AB5, 0x4BA, 0xA5B, 0x60A57, 0x52B, 0xA93, 0x40E95];
var madd = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
function GetBit(m, n){
    return (m >> n) & 1;
}
function setLunarDay(TheDate){
    if (!TheDate) TheDate = getOffsetDate();
    var total, m, n, k;
    var isEnd = false;
    var tmp = TheDate.getYear();
    cLastRecord = TheDate.getDate();
    if (tmp < 1900){
        tmp += 1900;
    }
    total = (tmp - 1921) * 365 + Math.floor((tmp - 1921) / 4) + madd[TheDate.getMonth()] + TheDate.getDate() - 38;

    if (TheDate.getYear() % 4 == 0 && TheDate.getMonth() > 1){
        total++;
    }
    for (m = 0; ; m++){
        k = (CalendarData[m] < 0xfff) ? 11 : 12;
        for (n = k; n >= 0; n--){
            if (total <= 29 + GetBit(CalendarData[m], n)){
                isEnd = true; break;
            }
            total = total - 29 - GetBit(CalendarData[m], n);
        }
        if (isEnd) break;
    }
    cYear = 1921 + m;
    cMonth = k - n + 1;
    cDay = total;
    if (k == 12){
        if (cMonth == Math.floor(CalendarData[m] / 0x10000) + 1){
            cMonth = 1 - cMonth;
        }
        if (cMonth > Math.floor(CalendarData[m] / 0x10000) + 1){
            cMonth--;
        }
    }
}
function getLunarDay(year, spirit, month, day, TheDate){
    if (getOffsetDate().getDate() != cLastRecord)
        setLunarDay(TheDate);
    var tmp = "";
    var all = !(year || spirit || month || day);
    if (all || year)
        tmp += tgString.charAt((cYear - 4) % 10) + dzString.charAt((cYear - 4) % 12);
    if (all || spirit)
        tmp += sx.charAt((cYear - 4) % 12) + "年";
    if (all || month){
        if (cMonth < 1){
            tmp += "闰";
            tmp += monString.charAt(-cMonth - 1);
        } else {
            tmp += monString.charAt(cMonth - 1);
        }
        tmp += "月";
    }
    if (all || day){
        tmp += (cDay < 11) ? "初" : ((cDay < 20) ? "十" : ((cDay < 30) ? "廿" : "三十"));
        if (cDay % 10 != 0 || cDay == 10){
            tmp += numString.charAt((cDay - 1) % 10);
        }
    }
    return tmp;
}


/*                Time Display & Weather                */
var refreshRate = 8 * 3600 * 1000;
var lastSyncTime = 0;
var timeOffset = 0;
var preventDecreaseShadow = false;//Stop when tomato
var lessDisturbUpdateWhenTomato = false;//less time update flash when tomato
var initTime = new Date().getTime();
var initTimeOffset = 0;
var averageTimeOffset = [0, 0];
var hasClockInit = false;
var networkFaliure = false;
var nextCmdList = 0;
var cmdListCount = 0;
var cmdList = {};
var tickListAlarm = '';
var timeAnimationInterval;
if (!isFastLoad){
    syncDateFromServer();
    initClockWeather();
}
initBrowserPage();

function syncDateFromServer(){
    //timeDateByBlive ?time returns timestamp
    httpReq('/blive/?time', function s(a){
        averageTimeOffset=[parseInt(a) - new Date().getTime(),1];
        sumDateFromServer(true)
    }, sumDateFromServer);//Alternative: compare time from HEAD 20 times due to its 1s precision
    addTaskOnPageChange("syncDateFromServer()", 24 * 3600 * 1000, true);
}
function sumDateFromServer(calculate){
    if (calculate){
        if (!averageTimeOffset[0])
            return false;
        var dTimeOffset = 0;
        var uptime = new Date().getTime() - initTime;
        timeOffset = Math.floor(averageTimeOffset[0] / averageTimeOffset[1]);
        if (!initTimeOffset && timeOffset) initTimeOffset = timeOffset;
        if (Math.abs(timeOffset - initTimeOffset) > 200)
            dTimeOffset = timeOffset - initTimeOffset;
        dTimeOffset = dTimeOffset ? "(" + timeFormat(dTimeOffset) + ")" : "";
        console.log(comment(timeOffsetFormat(2) + dTimeOffset + "#U" + timeFormat(uptime, 3, true) + ""));
        document.getElementById('timeoffset').innerHTML = timeOffsetFormat();
        initClockWeather();//immediately after date time got from server
        return true;
    } else {
        averageTimeOffset = [0, 0];
        for (var i=0;i<=20;i++)
            setTimeout('singleDateFromServer(' + i + ')', 50*i);
    }
}
function singleDateFromServer(n){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("HEAD", noCache(), true);
    xmlhttp.onreadystatechange = function (){
        if (xmlhttp.readyState == 4){
            if (networkFaliure){
                networkFaliure = false;
                return;
            }
            if (n >= 20){
                sumDateFromServer(true);
                return;
            }
            if (xmlhttp.status != 0){
                var serverTime = new Date(xmlhttp.getResponseHeader("Date")).getTime();
                var clientTime = new Date().getTime();
                averageTimeOffset[0]+=serverTime - clientTime + 2300;
                averageTimeOffset[1]++;
                timeOffset = Math.floor(averageTimeOffset[0] / averageTimeOffset[1]);//preset lag==>+1s(screen refresh time)
                console.log(frontZero(n + 1) + "#" + Math.floor(serverTime / 1e5) + ":S" + serverTime % 1e5 / 1000 + ".:C" + clientTime % 1e5 / 1000 + ":" + timeOffsetFormat());
                //comment("Calculating..." + timeOffsetFormat(3), true);
            } else {
                networkFaliure = true;
                comment("Failed(ServerTime)#" + timeOffsetFormat(3));
            }
        }
    };
    xmlhttp.send(null);
}
function addTaskOnPageChange(cmd, interval, isTimeout){
    var t = getOffsetTime(interval);
    var tag = String(cmd);
    if (isTimeout) interval = true;
    if (cmdList[tag] != undefined)
        cmdList[tag] = [cmdList[tag][0], interval, t];
    else {
        tag = tag.slice(0, 4) + frontZero(++cmdListCount, 3);
        cmdList[tag] = [cmd, interval, t];
    }
    refreshTaskOnPageChange();
    return tag;
}
function runTaskOnPageChange(){
    //nextCmdList=1500, cmdList={tag0:['f()', interval, end], tag1:['f()', 86400*1000, 15000000], tag2:['',true,1500]};
    try {
        var t = getOffsetTime();
        if (nextCmdList - 59 * 1000 < t){
            nextCmdList = 0;
            for (var i in cmdList){
                if (cmdList[i][2] - 59 * 1000 < t){
                    if (typeof cmdList[i][0] == 'function')
                        cmdList[i][0]();
                    else
                        eval(cmdList[i][0]);
                    if (cmdList[i][1] === true)
                        cmdList[i][1] = false;
                    else
                        cmdList[i][2] = getOffsetTime(cmdList[i][1]);
                }
            }
            refreshTaskOnPageChange();
        }
    } catch (e){
        //document.title = e.stack.replace(/ /g, '');
        comment(e);
    }
}
function deleteTaskOnPageChange(tId){
    if (tId) delete cmdList[tId];
}
function refreshTaskOnPageChange(){
    for (var i in cmdList)
        if (cmdList[i][1] === false)
            deleteTaskOnPageChange(i);
        else
            if (nextCmdList == 0 || cmdList[i][2] < nextCmdList)
                nextCmdList = cmdList[i][2];
}
function initBrowserPage(){
    setIcon();
    killShadow();
    addTaskOnPageChange("killShadow()", 86300 * 1000);//24*3600=86400 & 1700 --> 17*24*3600
    addTaskOnPageChange("reduceShadow()", 3100 * 1000);//prime number 60*60=3600
}
function initClockWeather(){
    if (hasClockInit) return;//avoid duplicated init;
    hasClockInit = true;
    updateInterval();
    setTimeout(weatherInterval, 3e3);
    timeAnimation(forTestUse?15:undefined);
}
function setIcon(){
    for (var i in document.styleSheets)
        for (var j in document.styleSheets[i].cssRules)
            if (document.styleSheets[i].cssRules[j].selectorText == '.tImg'){
                document.getElementById('ico').href = document.styleSheets[i].cssRules[j].style.content.slice(5, -2);
                return true;
            }
    return false;
}
function tasks(f, l, t, isLag, i){
    if (i == undefined) i = 0;
    if (i < (Array.isArray(l)?l.length:l)){
        if (!isLag)
            f(Array.isArray(l)?l[i++]:i++);
        setTimeout(function a(){tasks(f, l, t, false, i)}, t);
    }
}
function killShadow(force){
    var t = 400;
    var cleaner = document.getElementsByClassName('cleaner')[0].style;
    if (force || !preventDecreaseShadow){
        tasks(function a(e){cleaner.display = e}, ["", "", "none"], t);
        tasks(function b(e){cleaner.background = e}, ["", "white", ""], t);
        tasks(function c(e){document.body.style.color = e}, ["", "", "", "white", ""], t);
    }
}
function reduceShadow(){
    if (!preventDecreaseShadow)
        tasks(function a(e){document.getElementsByClassName('time')[0].style.opacity = e}, [0, 1], 600);
}
function runTime(n){return comment(timeFormat(new Date().getTime() - initTime, n ? n : 3, true));}
function noCache(){return "?noCache=" + document.body.clientWidth + "." + document.body.clientHeight + "." + ("" + Math.random()).slice(2, 9);}
function frontZero(a, n){
    if (!n) n = 2;
    if (typeof a != 'object')
        a = [a];
    for (var i = 0; i < a.length; i++)
        if (typeof a[i] == 'number' || !isNaN(parseInt(a[i]))){
            a[i] = a[i].toString();
            for (var j = n - a[i].length; j > 0; j--)
                a[i] = '0' + a[i];
        }
    return a.join('');
}
function timeFormat(s, n, noPlus){
    s = Math.floor(s);
    if (s == 0) return "";
    if (!n) n = 3;
    var str = "";
    var a = "";
    var isTweak = n==1;// eg. 1h59m =not=1h> 119m, 120m =still> 2h; 1Y<=s<2Y =like=1Y2M3d..> 14M
    if (s > 0)
        a = "+";
    else {
        a = '-';
        s = -s;
    }
    if (s < 1000)
        str = "." + frontZero(s, 3) + "s";
    else {
        var f = [[10, 100, 60, 60, 24, 30.4375, 12, 100, 10, 100000], ["", "s", "m", "h", "d", "M", "Y", "C", "T", "B"]];
        var fsum = 1;
        for (var i=0;i<f[0].length;i++)
            fsum *= f[0][i];
        for (i = f[0].length - 1; i > 0 && n > 0; i--){
            if (s >= fsum && !(isTweak && i!=0 && s<fsum*2)){
                str += Math.floor(s / fsum) + f[1][i];
                s %= fsum;
                n--;
            }
            fsum /= f[0][i];
        }
        if (s != 0 && n > 0)
            str += frontZero(Math.floor(s / fsum), 2) + f[1][0];
    }
    return (!noPlus || a == '-' ? a : "") + str;
}
function timeOffsetFormat(n){return timeFormat(timeOffset, !n ? 2 : n);}
function how(){
    var inspect = ['runTime(2)', 'weeklyTomato.length', 'countIcs()'];
    var o = '';
    var res;
    for (var i = 0; i < inspect.length; i++){
        res = eval(inspect[i]);
        if (typeof res == 'number' && res > 5 * 60 * 1000)
            res = timeFormat(res, 2, true);
        o += inspect[i].slice(0, 6) + ':' + res + ',';
    }
    o += '[' + (Object.keys(cmdList).length - 1) + ',' + dateString(nextCmdList) + ']:';
    for (i in cmdList)
        o += i + (cmdList[i][1] !== true ? ',' + timeFormat(cmdList[i][1], 2, true) + ',' : 'T') + dateString(cmdList[i][2]) + '|';
    return o.slice(0, -1);
}
function wipe(){basket.innerHTML = '';}
function test(){
    forTestUse=true;
    document.getElementsByClassName('weath')[0].src = "about:blank";
    comment(how());
    testIcs();
    timeAnimation(15);
    setInterval('timeOffset+=57*1000;update()', 100);
}
function f5(append){
    location.replace(location.hostname + location.pathname + (append ? append : ''));
    location.reload();
}
var help = {
    vari: ['who', 'credit', 'help'],
    func: ['how', 'wipe', 'test', 'testIcs', 'f5'],
    who: navigator.userAgent,
    credit: JSON.stringify(info).replace(/"/g, '')
};
[].push.apply(help.help = help.func, help.vari);
function correctPrompt(){
    var userInput = prompt('Change kindle time: [;st ' + dateString('YMdhm') + ']\nDisable sleep: [~ds]\nPlease INPUT Time (hhmmss) or Cmd:\n' + 'Format: [' + dateString('hms').replace(/:/g, '') + '] ([123456] means reset)\nCMDs: [' + help.help+']');
    if (!timeCorrect(userInput))
        try {
            if (help.vari.indexOf(userInput) != -1)
                userInput = 'help.' + userInput;
            else if (help.func.indexOf(userInput) != -1)
                userInput += '()';
            comment(eval(userInput));
        } catch (e){
            comment('<span style="color:maroon">' + e + '</span>');
        }
}
function timeCorrect(correct){//000000~235959
    if (!correct || correct.length != 5 && correct.length != 6)
        return false;
    if (correct == "123456")
        timeOffset = 0;
    else {
        var hms = [correct.slice(-6, -4), correct.slice(-4, -2), correct.slice(-2)];
        var allow = [[0, 23], [0, 59], [0, 59]];
        for (var i = 0; i < hms.length; i++){
            hms[i] = Math.floor(parseInt(hms[i]));
            if (!(hms[i] >= allow[i][0] && hms[i] <= allow[i][1]))
                return false;
        }
        var date = new Date();
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + 480);
        timeOffset = (((hms[0] - date.getHours()) * 60 + (hms[1] - date.getMinutes())) * 60 + (hms[2] - date.getSeconds())) * 1000;
    }
    update();
    return true;
}
function getOffsetDate(offset, noShift){
    var date = new Date();
    if (typeof offset != 'number') offset = 0;
    if (!noShift) date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + 480);
    date.setMilliseconds(date.getMilliseconds() + timeOffset + offset);
    return date;
}
function getOffsetTime(offset, noShift){
    return getOffsetDate(offset, noShift).getTime();
}
function updateInterval(){
    var mscs = getOffsetTime();
    setTimeout(updateInterval, lessDisturbUpdateWhenTomato ? ((599999 - mscs % 600000) + 50) : (59999 - mscs % 60000) + 50);//(60*10)*1000+50

    runTaskOnPageChange();
    update();
}
function update(){
    var date = getOffsetDate();
    if (timeOffset == 0)//fix the bug on kindle
        date.setMinutes(date.getMinutes() + 1);
    var hour = document.getElementById("hour");
    var minute = document.getElementById("minute");
    var calendar = document.getElementsByClassName("date")[0];
    var old_date = document.getElementsByClassName("old_date")[0];
    hour.innerHTML = frontZero(date.getHours()) + ':';
    minute.innerHTML = frontZero(date.getMinutes());
    var weekday = '日一二三四五六'[date.getDay()];
    calendar.innerHTML = (date.getMonth() + 1) + '月' + date.getDate() + '日'
        + (hasModule('lunaryear') ? '(' + weekday + ') ' + getLunarDay(false, false, true, true) : ' 星期' + weekday)
        + '<span style="font-size:1.5rem;position:absolute;"> ' + (forTestUse ? '#envTest' : '') + ' ' + tickListAlarm + "</span>";
    old_date.innerHTML = "子丑寅卯辰巳午未申酉戌亥"[Math.floor((date.getHours()>=23?0:date.getHours()+1)/2)];// + "初正"[1-date.getHours()%2];
    return date;
}
function weatherInterval(){
    var date = getOffsetDate();
    var nextRefresh = 0;
    document.getElementById('net').innerHTML = '初始化同步';
    if (date.getTime() - lastSyncTime > refreshRate + 100000)
        nextRefresh = 10 * 60 * 1000;
    else if (date.getHours() + refreshRate / 1000 / 3600 < 24)
        nextRefresh = refreshRate;
    else//calculate time till 00:00
        nextRefresh = 24 * 3600 * 1000 - date.getTime() % (24 * 3600 * 1000) + 50;
    addTaskOnPageChange("weatherInterval()", nextRefresh, true);

    if (date.getTime() - lastSyncTime > 10000)
        setTimeout(function onlineWeather(){
            var _doc = document.body;
            var script = document.createElement('img');
            script.setAttribute('src', '//tianqi.2345.com/favicon.ico' + noCache());
            _doc.appendChild(script);
            script.onload = script.onreadystatechange = function (){
                weather(!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete');
                script.onload = script.onreadystatechange = null;
            };
            _doc.removeChild(script);
        }, 10);
}
function weather(connected){
    if (!connected)
        document.getElementById('net').innerHTML = '无网络连接';
    var date = getOffsetDate();
    lastSyncTime = date.getTime();
    if (!forTestUse && isOnKindle){
        var ifrm = document.getElementsByClassName('weath')[0];
        ifrm.src = "//tianqi.2345.com/plugin/widget/index.htm?s=1&z=1&t=0&v=0&d=3&bd=0&k=&f=&ltf=009944&htf=cc0000&q=1&e=0&a=1&c=54511&w=385&h=96&align=left";//change iframe
        document.getElementById('net').innerHTML = '完成上一次同步';
    } else {
        console.warn('[iframeRefresh:disabled] isOnKindle == false');
        document.getElementById('net').innerHTML = '测试模式';
    }
    document.getElementById('sync').innerHTML = date.getFullYear() + '-' + frontZero([date.getMonth() + 1, '-', date.getDate(), ' ', date.getHours(), ':', date.getMinutes(), ':', date.getSeconds()]);
    document.getElementById('timeoffset').innerHTML = timeOffsetFormat();
}
function timeAnimation(sixty, isAlter){
    clearTimeout(timeAnimationInterval);
    var loader=document.getElementsByClassName('loader')[0];
    if (!sixty)
        sixty=60;
    if (isAlter){
        // 00 -> 10 -> 11 -> 01 -> 00
        var base=6;
        var frames=15;// 1/(60/2/base/frames)=3fps
        var growth=range(10, 50, frames+1, function act(i){return i+"%"});// 2 3 2 1

        if (!timeAnimationInterval){
            loader.innerHTML='<div style="height: 2rem; transform: scaleY(-1)">'+repeat('<div class="bar"></div>', base)+"</div>";
        }
        var seconds=getOffsetTime()/1e3%sixty;
        var circle=sixty/2/base;
        var next=(circle-seconds%circle)*1e3;
        //console.log(Math.floor(seconds/circle)%base, circle-seconds%circle, circle, seconds);
        tasks(function act(e){
            loader.children[0].children[Math.floor(seconds/circle)%base].style.height=e;
            }, (seconds<(sixty/2)?growth:growth.reverse()).slice(1), circle/frames*1e3, true);
    } else {
        // bagua
        if (!timeAnimationInterval)
            loader.innerHTML='<div style="width: 1.5rem">'+repeat('<div class="gua"></div><div class="gua" style="width: .3rem"></div><div class="gua"></div>', 6)+'</div>';
        var state=decBin(getOffsetTime()/1e3%sixty/sixty*64, 6);
        var next=sixty/64;
        for (var i=0;i<state.length;i++)
            loader.children[0].children[i*3+1].style.opacity=state[i]?"1":"0";
    }
    timeAnimationInterval=setTimeout("timeAnimation("+sixty+", "+isAlter+")", next+10);//bug on timer activate 0.000999927520751s earlier

    function decBin(d, n){
        var r=[];
        var s=Math.floor(d).toString(2);
        var l=s.length;
        for (var i=0;i<l;i++)
            r.push(s[i]=="1"?1:0);
        for (var j=r.length;j<n;j++)
            r.unshift(0);
        return r;
    }

    function range(start, end, n, f){
        var res=[];
        for (var i=start;i<=end;i+=(end-start)/(n-1))
            res.push(f(i));
        return res;
    }

    function repeat(s, n){
        var r='';
        for (;n>0;n--)
            r+=s;
        return r;
    }
}


/*                TOMATO: Tomato Timer                */
var toStatus, ispaused, weeklyTomato = [];
var timerEntity;
var signalTired = 0;
var toWorkTimer = 25 * 60;//Second
var timerEnd, restWhenPaused;
var toRestTimer = 5 * 60;
var expireTomato = 30;//Day
var tomatoMsg = [document.getElementById('tom'), document.getElementById('ato')];
var buttonStyle = [document.getElementById('hour').style, document.getElementById('minute').style];
var shinningSignal = [document.getElementById('ato').style, document.getElementsByClassName('inform')[0].style, document.getElementsByClassName('date')[0].style];
var isHomeShrink = false;
//dumpTomato();gatherTomato(719);
function dumpTomato(){rottenTomato(-1);}
function gatherTomato(fakeTomatos){
    if (!weeklyTomato.length) eatTomato();
    if (fakeTomatos)
        for (var i = 0; i < fakeTomatos; i++)
            weeklyTomato.push(-1);
    else
        weeklyTomato.push(Math.floor(new Date().getTime() / (24 * 3600 * 1000)));
    canTomato();
    showTomato("Gather");
}
function canTomato(){document.cookie = "tomato=" + compressTomato() + ";expires=" + new Date(0x7fffffff * 1e3).toUTCString();}
function compressTomato(){
    var compressed = "";
    for (var i = 0; i < weeklyTomato.length; i++){
        if (i != 0) compressed += '.';
        compressed += Math.floor(weeklyTomato[i]).toString(36);
    }
    return compressed;
}
function showTomato(source){
    basket.textContent = "";
    var f = [1, 2, 20, 60, 180];
    var res = 0;
    var tomatos = weeklyTomato.length;
    for (var i = f.length - 1; i >= 0 && tomatos != 0; i--){
        res = Math.floor(tomatos / f[i]);
        tomatos %= f[i];
        for (var j = 0; j < res; j++)
            enchantTomato(basket, ['opacity: 0.5;', "", 'border:0.1rem dashed black;', 'border:0.1rem solid black;', 'border:0.1rem solid black; background-color: #c0c0c0'][i]);
    }
    if (weeklyTomato.length != 0) basket.insertAdjacentHTML("beforeend", weeklyTomato.length);
    logTomato(source);
}
function enchantTomato(e, magicType){
    var script = document.createElement('img');
    script.setAttribute('class', 'tImg');
    if (magicType) script.setAttribute('style', magicType);
    e.appendChild(script);
}
function eatTomato(){
    var offset = document.cookie.indexOf("tomato=");
    var end = document.cookie.indexOf(";", offset);
    if (offset != -1){
        offset += "tomato=".length;
        if (end == -1) end = document.cookie.length;
        var content = document.cookie.substring(offset, end);
        if (content){
            weeklyTomato = Array();
            content = content.split(".");
            for (var i in content)
                if (parseInt(content[i], 36))
                    weeklyTomato.push(parseInt(content[i], 36));
        }
        logTomato("Read");
    }
}
function logTomato(source){
    if (weeklyTomato.length == 0)
        console.log("Empty >ToMaMaTo< Store from " + source);
    else
        console.log("Len:" + weeklyTomato.length + " " + source + ":" + weeklyTomato.slice(0, 5));
}
function rottenTomato(expire){
    var date = Math.floor(new Date().getTime() / (24 * 3600 * 1000)) - (!expire ? expireTomato : expire);
    weeklyTomato.sort(function (a, b){return b - a;});
    for (var i = 0; i < weeklyTomato.length; i++)
        if (weeklyTomato[i] < date){
            weeklyTomato = weeklyTomato.slice(0, i);
            break;
        }
    canTomato();
    setTimeout(rottenTomato, expireTomato * 24 * 3600 * 1000 / 3);
    showTomato("Rotten");
}
function updateMsg(tom, sliceIndex){
    if (tom){
        if (sliceIndex) tom += tomatoMsg[0].innerHTML.slice(sliceIndex);
        if (tom.slice(-2) != ": ") tom += ": ";
        tomatoMsg[0].innerHTML = tom;
    }
    var s = Math.round((timerEnd - new Date().getTime()) / 1000);
    var timeString = "" + frontZero(Math.floor(s / 60)) + ":" + frontZero(s % 60);
    if (!document.hidden){
        tomatoMsg[0].style.background = toStatus == 'work' ? 'gray' : '';
        tomatoMsg[1].innerHTML = timeString;
    } else
        document.title = timeString + (toStatus == 'work' ? " <TOM" : " <ATO");
}
function fridgeTomato(){
    killShadow();
    tomatoMsg[0].style.background = '';
    tomatoMsg[0].innerHTML = toStatus && toStatus != 'stop' ? 'MATO' : 'TOMA';
    tomatoMsg[1].innerHTML = toStatus && toStatus != 'stop' ? 'TOMA' : 'MATO';
    prepareTomato();
    document.title = initialTitle;
    if (isHomeShrink){
        isHomeShrink = false;
        var butts = document.getElementsByClassName('h_switch');
        for (var i = 0; i < butts.length; i++)
            butts[i].style.height = '';
    }
}
function prepareTomato(){
    //quit from tomato
    preventDecreaseShadow = false;
    lessDisturbUpdateWhenTomato = false;
    killShadow();
    toStatus = 'stop';//work,rest,stop
    ispaused = false;
    eatTomato();
    clearTimeout(timerEntity);
    updateButton();
}
function switchTomato(){
    if (!toStatus){
        prepareTomato();
        showTomato('INIT');
    }
    switch (toStatus){
        case 'stop':
            toStatus = 'work';
            setTimer();
            preventDecreaseShadow = true;
            lessDisturbUpdateWhenTomato = true;
            timerEnd = new Date().getTime() + toWorkTimer * 1000;
            updateMsg("番茄开始");
            updateButton();
            if (!isHomeShrink){
                isHomeShrink = true;
                var butts = document.getElementsByClassName('h_switch');
                for (var i = 0; i < butts.length; i++)
                    butts[i].style.height = '8rem';
            }
            break;
        case 'work':
            toStatus = 'rest';
            restWhenPaused = toRestTimer * 1000;
            timerEnd = new Date().getTime() + restWhenPaused;
            clearTimeout(timerEntity);
            updateMsg("番茄中场");
            pauseTomato();
            break;
        case 'rest':
            toStatus = 'work';
            restWhenPaused = toWorkTimer * 1000;
            timerEnd = new Date().getTime() + restWhenPaused;
            clearTimeout(timerEntity);
            updateMsg("番茄工作");
            pauseTomato();
            break;
    }
}
function setTimer(){
    clearTimeout(timerEntity);
    timerEntity = setTimeout(function tomatoTimer(){
        if (timerEnd < new Date().getTime()){
            if (toStatus == 'work')
                gatherTomato();
            switchTomato();
        } else {
            updateMsg();
            setTimer();
        }
    }, 1000);
}
function updateButton(){
    buttonStyle[1].color = (ispaused) ? '#303030' : '#a9a9a9';
    if (toStatus == 'stop') buttonStyle[1].color = '#000000';
    buttonStyle[0].color = ['#000000', '#303030', '#a9a9a9'][['stop', 'work', 'rest'].indexOf(toStatus)];
}
function updateSignal(){
    if (ispaused && toStatus != 'stop'){
        if (signalTired > toWorkTimer){
            document.title = initialTitle;
            for (var i = 0; i < shinningSignal.length; i++)
                shinningSignal[i].color = '#000000';
        } else {
            if (signalTired % 2 == 0){
                document.title = '✔ * * * ✔';
                for (var i = 0; i < shinningSignal.length; i++)
                    shinningSignal[i].color = '#ffffff';
            } else {
                document.title = '* RELAX *';
                for (var i = 0; i < shinningSignal.length; i++)
                    shinningSignal[i].color = '#000000';
            }
            if (signalTired == 0 || signalTired == toWorkTimer)
                killShadow(true);
            signalTired++;
            setTimeout(updateSignal, 800);
        }
    } else {
        signalTired = 0;
        document.title = initialTitle;
        for (var i = 0; i < shinningSignal.length; i++)
            shinningSignal[i].color = '#000000';
    }
}
function pauseTomato(){
    if (!toStatus || toStatus == "stop") return;
    ispaused = !ispaused;
    if (ispaused){
        clearTimeout(timerEntity);
        restWhenPaused = timerEnd - new Date().getTime();
        updateMsg("暂停", -4);
    } else {
        setTimer();
        timerEnd = new Date().getTime() + restWhenPaused;
        updateMsg("番茄", -4);
    }
    updateButton();
    updateSignal();
}


/*                TICKLIST: Ticktick Reminder
Note: you need set a Nginx server to proxy the GET method to the
        calendar server to download the .ics file. Add those lines
        to your Nginx config file to avoid CORS problem as the
        request directly from your browser is banned for some
        security reason.
        
location /ics/ {
    proxy_redirect off;
    proxy_buffering off;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
    add_header Access-Control-Allow-Methods *;
    add_header Access-Control-Allow-Credentials true;
    add_header Access-Control-Allow-Origin $http_origin;
    if ($request_method = OPTIONS){
    return 200;
    }
    access_log off;
    proxy_pass https://XXX/pub/calendar/feeds/XXXXX/basic.ics;
}
*/
var tickList = {};
var tickListStatus = 0;
var tickListTaskIndex = 0;
var tickListMaxLine = 21;
var tickListReminderList = {};
var reminder = document.getElementsByClassName('reminder')[0];
function dDay(t){return dHour(t, 24);}
function dHour(t, h){return parseInt(dMs(t, (!h ? 1 : h) * 3600 * 1000));}
function dMs(t, ms){return (t - getOffsetTime()) / (!ms ? 1 : ms);}
function dateString(timeStamp, YMdhms){
    var s = '';
    var all = 'YMdhms';
    var date = getOffsetDate();
    if (timeStamp)
        if (String(timeStamp).match(/\d/))
            date = new Date(timeStamp);
        else if (!YMdhms)
            YMdhms = timeStamp;
    if (!YMdhms) YMdhms = 'hm';
    var res = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
    for (var i = 0; i < all.length; i++)
        if (YMdhms.indexOf(all[i]) != -1)
            s += frontZero([res[i], '-- :: '[i]]);
    return s.slice(0, -1);
}
function randInt(n, from){if (from == undefined) from = 0; return Math.ceil(Math.random() * (n - from)) + from;}
function countIcs(){
    var b = [];
    for (var i = 0; i < tickList.length; i++)
        b.push(tickList[i].length);
    return b;
}
function testIcs(n){
    var s = '';
    if (!n) n = 16;
    var d = new Date();
    d.setMinutes(d.getMinutes() + d.getTimezoneOffset() + 15 + 1);
    for (var i = 0; i < n; i++)
        s += "BEGIN:VEVENT\nDTSTART:" + (2018 + randInt(3)) + frontZero(randInt(12, 1)) + '01T020304Z\nSUMMARY:Default\nDESCRIPTION:e\n'
            + "BEGIN:VEVENT\nDTSTART:" + d.getFullYear() + frontZero([d.getMonth() + 1, d.getDate(), 'T', d.getHours(), randInt(59, 0)]) + '08Z' + '\nSUMMARY:Default\nDESCRIPTION: e' + space(5) + '测试测试测试测试测试测试测试测试测试测试' + '\nRRULE:FREQ=WEEKLY;INTERVAL=3\n';
    readIcs(s);
    tickListStatus++; showIcs(true);
}
function getIcs(){httpReq("/ics/", function a(s){readIcs(s); showIcs(true);}, comment);}
function readIcs(s){
    s = s.replace(/\r/g, '').split('\n');
    var r = [];
    var tag = ['DTSTART', 'DTSTART;VALUE=DATE', 'SUMMARY', 'DESCRIPTION', 'TRIGGER', 'RRULE', 'DTSTART;TZID=Asia/Shanghai'];//TIMEZONE-NOTE
    for (var i = 0; i < s.length; i++){
        var splitter = s[i].indexOf(':');
        var line = [s[i].slice(0, splitter).trim(), s[i].slice(splitter + 1).trim()];
        if (line[0] == 'BEGIN'){
            if (line[1] == 'VEVENT')
                r.push({});
        } else if (tag.indexOf(line[0]) != -1 && r.length != 0 && r[r.length - 1][line[0]] == undefined){
            switch (line[0]){
            case tag[6]:
                line[0]=tag[0];
            case tag[0]:// not using Date.parse for compatiablity
                line[1] = new Date(line[1].slice(0, 4), line[1].slice(4, 6)-1, line[1].slice(6, 8), line[1].slice(9, 11), line[1].slice(11, 13), line[1].slice(13, 15)).getTime(); //+ (new Date().getTimezoneOffset() + 480) * 60 * 1000;//TIMEZONE-NOTE
                break;
            case tag[1]:
                line[0] = tag[0];
                line[1] = new Date(line[1].slice(0, 4), line[1].slice(4, 6)-1, line[1].slice(6, 8), '08', '00', '00');
                r[r.length - 1]['isDateOnly'] = true;
                break;
            case tag[3]:
                for (var j = i + 1; j < s.length && s[j][0] == ' '; j++)
                    line[1] += s[j].slice(1);
                line[1] = line[1].replace(/\\n|\\|\n/g, '').trim();
                if (line[1].startsWith('- ') && line[1].indexOf(' - ') != -1)
                    line[1] = line[1].slice(2).replace(/ - /g, ' / ');
                break;
            case tag[5]:
                r[r.length - 1]['FREQ'] = '';
                line[1] = line[1].split(';');
                for (var j in line[1]){
                    line[1][j] = line[1][j].split('=');
                    if (line[1][j][0] == 'FREQ')
                        r[r.length - 1]['FREQ'] += '年月周日'[['ANNUALLY', 'MONTHLY', 'WEEKLY', 'DAILY'].indexOf(line[1][j][1])];
                    else if (line[1][j][0] == 'INTERVAL')
                        r[r.length - 1]['FREQ'] = (line[1][j][1] <= 9 ? '零 两三四五六七八九'[parseInt(line[1][j][1])] : line[1][j][1]) + r[r.length - 1]['FREQ'];
                }
                continue;
            }
            r[r.length - 1][line[0]] = line[1];
        }
    }
    sortIcs(r, 1);
    return tickList;
}
function sortIcs(r, sortNum){
    clearReminder(true);
    tickList = {important: [], normal: [], noDate: []};
    var func = [[function (d){return d > -14},
    function (a, b){return b.DTSTART - a.DTSTART}],
    [function (d, freq){return d >= (freq ? -7 : -14) && d <= (freq ? 3 : 90)},
    function (a, b){
        var c = [a.DTSTART, b.DTSTART];
        var d = [a, b];
        for (var i = 0; i < c.length; i++){
            c[i] -= getOffsetTime();
            var isNeg = c[i] != (c[i] = Math.abs(c[i]));
            c[i] *= (isNeg ? c[i] > 180 ? 3 : 2 : 1) * (d[i].isDateOnly ? c[i] > 180 ? 6 : 3 : 1) * (d[i].FREQ ? c[i] > 4 ? 8 : 3 : 1);
        }
        return c[0] - c[1];
    }]][sortNum];
    for (var i = 0; i < r.length; i++)
        if (r[i].DTSTART){
            var dD = dDay(r[i].DTSTART);
            if (dD<=0&&dD>-3)
                alarmIcs(r[i]);
            if (func[0](dD, r[i].FREQ))
                tickList.important.push(r[i]);
            else
                tickList.normal.push(r[i]);
        } else
            tickList.noDate.push(r[i]);
    tickList.important.sort(function (a, b){return a.DTSTART - b.DTSTART;});
    tickList.normal.sort(func[1]);
}
function showIcs(keep){
    if (!tickListTaskIndex && !forTestUse)
        tickListTaskIndex = addTaskOnPageChange('getIcs()', 6 * 3600 * 1000);
    var t = document.getElementsByClassName('tickList')[0];
    var tickTable = t.getElementsByTagName('table')[0];
    tickTable.innerHTML = '';
    var tickImg = t.getElementsByClassName('tImg')[0];
    if (!keep) tickListStatus++;
    if (!keep && tickListStatus % 6 == 1){
        tickTable.innerHTML = tickListStatus;
        getIcs();
    } else if (tickListStatus % 3 == 0){
        t.innerHTML = '<div></div><img class="tImg" style="padding:1rem"><table></table>';
    } else {
        if (tickImg) t.removeChild(tickImg);
        var limit = (tickListStatus % 3 == 1) ? 5 : tickListMaxLine;
        var s = '<tr><td style="opacity:.3">' + dateString() + '<span style="opacity:0">100.00</span></td><td style="font-size:1.5rem;opacity:0;line-height:0">1000</td></tr>';
        var cross30;
        for (var j in tickList){
            var l = tickList[j];
            for (var i = 0; i < l.length; i++){
                if (--limit < 0) break;
                var dD = dDay(l[i].DTSTART);
                var adD = Math.abs(dD);
                var td_divider = '';
                if (cross30 == undefined)
                    cross30 = adD;
                if (adD >= 30 && cross30 < 30){
                    cross30 = 31;
                    td_divider = 'background: lightgray; ';
                }
                if (l[i].SUMMARY.length + l[i].DESCRIPTION.length > 25){
                    var sum='<b>'+l[i].SUMMARY.slice(0, 10)+'</b>';
                    var des=(l[i].SUMMARY.slice(10) + (l[i].SUMMARY.length > 10 && l[i].DESCRIPTION ? ': ' : '') + l[i].DESCRIPTION.slice(0, 200 - Math.min(10, l[i].SUMMARY.length) * 6)).trim();
                } else {
                    var sum=('<b>'+l[i].SUMMARY + '</b> ' + l[i].DESCRIPTION).trim();
                    var des='';
                }
                var freq = (l[i].FREQ) ? '<sup style="font-size:xx-small;border-radius:20%;border:solid">' + l[i].FREQ + '</sup>' : '';
                s += '<tr style="' + (!dD ? 'font-weight:bold; ' : '') + '"><td style="' + td_divider + (l[i].isDateOnly?'text-align: center;':"") + '">' + dateString(l[i].DTSTART, l[i].isDateOnly?'Md':'Mdhm') + '</td><td class="countdown" style="color:hsl(0,0%,' + Math.floor(adD / (!j ? 120 : 480) * 100) + '%);'+(dD<0?'font-size: 1.2rem':'')+'">' + (adD < 7 ? '<img class="tImg" style="height:1.5rem;margin-left:-2rem"><div class="tomato" style="height:' + Math.ceil(adD / 10 * 2) / 2 * 1.5 + 'rem"></div>' : '') + (dD ? dD : '') + '</td><td class="content"><span class="summary"> ' + (!dD ? '<i>' + dHour(l[i].DTSTART) + 'h</i> ' : '') + freq + sum + '</span>' + '<span style="background:white;">' + des + '</span></td></tr>';
            }
        }
        tickTable.innerHTML = s;
        addTaskOnPageChange('displayReminder()', 2.5 * 3600 * 1000, true);//2.5*2=5<6<2.5*3=7.5
    }
}
function alarmIcs(tick){
    var dH = dHour(tick.DTSTART);
    var d = dMs(tick.DTSTART);
    tickListAlarm = '';
    remindIcs("tickListAlarm='['+'" + dateString(tick.DTSTART) + ' ' + tick.SUMMARY.slice(0, 20) + "'+']'", (dH - 12) * 3600 * 1000);
    remindIcs("tickListAlarm=''", (dH + 12) * 3600 * 1000);
    if (dH >= -1){
        remindIcs(function remind(){
            tickListReminderList[hashString(tick)] = tick;
            killShadow(true);
            displayReminder()
        }, d - 15 * 60 * 1000);
        remindIcs('killShadow(true)', d - 1 * 60 * 1000);
    }
}
function deleteReminder(tickId){
    if (confirm('Job\'s done?')){
        delete tickListReminderList[String(tickId)];
        var i = document.getElementById('tick' + tickId);
        var p = i.parentNode;
        p.removeChild(i);
        if (!p.hasChildNodes())
            p.style.display = 'none';
    }
    stopBubble();
}
function hashString(tick){
    var s = tick.SUMMARY + tick.DESCRIPTION;
    var hash = 0, i;
    for (i = 0; i < s.length; i++){
        hash = ((hash << 5) - hash) + s.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return (hash + Math.floor(tick.DTSTART / 1000)).toString(36);
}
function displayReminder(){
    var l = Object.keys(tickListReminderList).length;
    var s = '';
    if (!l)
        return;
    for (var i in tickListReminderList){
        var tick = tickListReminderList[i];
        s += '<span style="display:block" id="tick' + i + '" onclick="deleteReminder(\'' + i + '\')">' + (tick.FREQ ? '<sup style="font-size:small;border-radius:20%;border:solid">' + tick.FREQ + '</sup>' : '') + '[' + dateString(tick.DTSTART, 'Mdhm') + timeFormat(dMs(tick.DTSTART), 1) + ']<br>' + tick.SUMMARY + '<br>' + tick.DESCRIPTION + '</span>';
    }
    s = s ? s.slice(0, -11) + '</span>' : '';
    if (l > 3)
        reminder.style.cssText = "margin: -28rem 10rem;max-height: 25.5rem;";
    else
        reminder.style.cssText = "";
    reminder.innerHTML = s;
    reminder.style.display = 'block';
    (function shinning(){
        if (Object.keys(tickListReminderList).length){
            tasks(function f(e){reminder.firstChild.style.opacity=e;}, [0, 1, 0, 1, 0, 1], 1e3);
            setTimeout(shinning, 60e3);
        }
    })();
}
function clearReminder(force){
    var r = force?force:confirm('*CLEAN ALL?*');
    if (r){
        tickListReminderList = {};
        reminder.style.display = 'none';
    }
    return r;
}
function remindIcs(cmd, timeout){addTaskOnPageChange(cmd, timeout, true);}//-12h,-15m,-1m,+12h


/*                DANMU: Bilibili Live Danmu
sudo apt-get install python3-distutils
sudo apt-get install python3-pip
sudo pip3 install aiohttp [-i https://source]
python3 sample.py 92613
sudo nano /etc/nginx/nginx.conf
sudo systemctl restart nginx

location /blive/ {
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Headers X-Requested-With;
    add_header Access-Control-Allow-Methods GET,POST,PUT,OPTIONS;
    access_log off;
    proxy_pass http://localhost:8099;
}

# USED IN TAMPERMONKEY for auto-change room-id
// ==UserScript==
// @name         DANMU_ROOM
// @match        *://live.bilibili.com/*
// ==/UserScript==
(function(){
'use strict';
var i=location.pathname.split('/')[1];
if (!isNaN(parseInt(i))){
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function(){
        if (xmlhttp.readyState == 4){
            document.title=(xmlhttp.status==200?'√ ':'['+xmlhttp.status)+document.title;
            console.log("["+i+"] "+xmlhttp.status+" "+xmlhttp.responseText)
        }
    }
    xmlhttp.open('GET', "https://debian10/blive/?"+i);
    xmlhttp.send();
}
})();
*/
var streamer = [[   'fu'],
               [0x1dd4ae, 0x163a23b, 0x160f887, 0x46f479, 0x1596acd]];
var liveVol = [         ,        .3];
//var streamer={0x1dd4ae: {name: 'fu', vol: .15}}
var liveDefaultVol=.6;
var streamerTime = Array(streamer[1].length);
var streamerTitle = Array(streamer[1].length);
var streamerUid = [];
var liveOther = {};// 'e.g.': {title:'', time:''}
var danmuLimit={
    max: 100,
    line: 15,
};
var dInfo={// danmuInfo // *** setter/getter NOT work well on KINDLE *** // may caused by return in setter
    roomId: 0,
    roomIndex: -1,
    setRoomId: function(n){
        if ((n=parseInt(n))!=2){// server return 2 when other_room set and room_id not set
            this.roomIndex=streamer[1].indexOf(n);
            return this.roomId=n;
        }
    },
    last: '',
    start: 0,
    flow: 0,
    xmlReq: undefined,
    flag: {
        on: 0,// 0 off, 1 live, 2 watch, 3 remove
        reconfirm: false,
        bird: false,
    },
    count: {
        req: 0,
        retry: 0,
        live: 0,
    },
    pop: 0,
    popTrend: '',
    setPop: function(p){
        this.setTrend(parseInt(p), 'pop', 'popTrend', '_popLast', 10000);
    },
    _popLast: [],
    purse: 0,
    purseTrend: '',
    setPurse: function(p){
        this.setTrend(parseInt(p), 'purse', 'purseTrend', '_purseLast');
    },
    _purseLast: [],
    setTrend: function(val, k, trend, last, unit){// p, 'purse', 'purseTrend', '_purseLast'
        var range=3*60*1000;
        var t=new Date().getTime();
        this[k]=val;
        if (this[last][0]<t-range){// negative lookbehind not supported in older browser
            this[trend]=((val-this[last][1])/(unit>1?unit:1)/(t-this[last][0])*range).toFixed(unit?1:0);
            this[trend]=this[trend]?((this[trend]>0?'+':'')+this[trend]).replace(/^(-?)0\./g, '$1.').replace(/\.0$/g, '').replace(/^[+-]?0?$/g, ''):'';
        }
        if (val>1&&(!this[last].length||this[last][0]<t-range)){
            this[last]=[t, val];
            setTimeout(danmuStatus, 50);
        }
    },
    sc: '',
    lyrc: {n: 0, last: ''},
    other_room: '',
    setOther_room: function(s){
        s=this.extractOther_room(s);
        if (this.other_room!=(this.other_room=s)&&isDanmuOnly&&liveOption.enable&&s)
            parseOtherRoom(s, true);
        return this.other_room;
    },
    extractOther_room: function(s, isRaw){
        var m=s.toLowerCase().match(/(huya\.com|cc\.163\.com|douyu\.com)\/(\d+)/);
        return isRaw?m:(m?m[0]:s);
    },
    liveQuality: 0,
    watch: 0,
    watch_time: 0,
    setWatch: function(p){
        if (!p||this.flag.on!=2)
            return false;
        if (!this.watch_time)
            this.watch=p;
        this.watch_time=new Date().getTime();
        var self=this;
        setTimeout(function(){
            if (self.flag.on==2&&self.watch&&self.watch_time&&self.watch_time+10e3-100<new Date().getTime()){
                danmuOn(self.watch, true);
                self.watch_time=0;
                setTimeout(function(){
                    if (!self.other_room&&parseInt(self.watch)==self.roomId&&liveOption.quality<=3&&!isLiveOff()&&self.liveQuality>=10000)
                        liveFromRoom('', '', true);
                }, 100e3);// bilibili live's lower quality stream is available after 2 mins
            }
        }, 10e3);
    },
};
var danmuArea='';
var danmuCollectRooms=[];
var danmuTask={
    content: 0,
    info: 0,
    other_info: 0,
    tuber: 0,
    guard: 0,
    liveRetry: 0,
};
var livePlayer;
var liveBlock=[0xb911, 0xe53cd, 0x1610b66, 0x14b11b6, 0x1455367, 0x14e7659, 0x1467c9c, 0x491146, 0x15ac9d1, 0x1593147, 0x1586bb6];

function space(n, s){
    s = s != undefined ? String(s) : '';
    for (n -= s.length * 1.8; n-- > 0;)
        s += ' ';
    return s;
}
function danmuSwitch(){
    switch (dInfo.flag.on){
        case 0:
            danmuSet(true);
            danmuOn(liveOption.occupy?'kick':'');
            dInfo.start+=5-dInfo.start%5;// init as danmuTuber index record
            break;
        default:
            if (isDanmuOnly)
                danmuFullScreen();
            else if (dInfo.start+5e3>getOffsetTime()){
                var up = prompt('Current: ' + dInfo.roomId + '\nStreamer:\n' + streamer[0] + '\nControl:\n'
                    +['[bliveRoomId or otherUrl] 打开直播', 'w 切换 watch', 'f 窗口模式', 'url 添加 #danmuonly', 'kick 独享', 'history 历史弹幕', 'restart 重启', 'status 统计', 'call: 通话', 'js: 远程脚本', 'clients 客户端', 'cors: 跨域请求', 'time 时间戳', 'upgrade 更新']);
                if (up != null)
                    if (up == '' && (dInfo.pop <= 1||isDanmuOnly))
                        danmuOff('<b>quit</b>');
                    else
                        danmuOn(up, true);// due to user-gesture policy, fs disabled here
            } else
                danmuOff('<b>connect</b>' + dInfo.count.req);
    }
}
function danmuOn(roomId, withoutFullScreen){
    if (isDanmuOnly&&!withoutFullScreen)
        danmuFullScreen(true);
    liveOption.enable=isDanmuOnly&&liveOption.enable;
    roomId=roomId?String(roomId):'';
    var m=roomId.match(/live\.bilibili\.com\/(?:h5\/)(\d+)/);
    if (m)
        roomId=m[1];
    if (streamer[0].indexOf(roomId) != -1)
        roomId = streamer[1][streamer[0].indexOf(roomId)];
    if (!roomId)
        danmuWrite('[ON@'+dateString()+'] '+(liveOption.occupy?'kicking':''), true, true);
    if (!dInfo.start)
        dInfo.start = getOffsetTime();
    dInfo.count.retry = 0;
    dInfo.setPop(0);
    dInfo.setPurse(0);
    dInfo.setOther_room('');
    dInfo._popLast=[];
    dInfo._purseLast=[];
    danmu_fr.style.opacity = 1;
    danmuArea='';
    switch (roomId){
        case 'url':
            f5('#danmuonly');
            break;
        case 'w':
            dInfo.flag.on=dInfo.flag.on==2?1:2;
            break;
        case 'f':
            isDanmuFullWindow=!isDanmuFullWindow;
            break;
        case 'kick':
            liveOption.occupy=true;
            danmuWrite('[kick] ing...')
        default:
            if (dInfo.xmlReq){
                dInfo.xmlReq.isAbort=true;
                dInfo.xmlReq.abort();
            }
            if (dInfo.flag.on==0||dInfo.flag.on==3)
                dInfo.flag.on=1;
            danmuContent(roomId?roomId:'');
    }
    setRoomId(roomId, true);
    danmuAlter(false);
}
function clearDanmuTask(s){
    clearTimeout(danmuTask[s]);
    danmuTask[s]=0;
}
function danmuOff(s){
    if (!dInfo.flag.on) return;
    dInfo.flag.on = 0;
    dInfo.flag.bird=false;
    liveOff(false, 'maually');
    clearDanmuTask("content");
    clearDanmuTask("info");
    setTimeout(function danmuClear(){
        if (!dInfo.flag.on&&!isDanmuOnly){
            danmu_fr.style.opacity = 0;
            danmu_info.innerHTML = '';
        }
    }, 10 * 60e3);
    danmuAlter(true);
    if (isDanmuOnly)
        danmuSet();
    danmuWrite('<b>[OFF@'+ dateString() +']</b> ' + (s ? s + ' ' : '') + '<b>U</b>' + timeFormat(getOffsetTime() - dInfo.start, 2, true));
    dInfo.start=0;
    dInfo.setPop(0);
    dInfo.setPurse(0);
    dInfo.setRoomId(0);
    dInfo.setOther_room('');
}
function danmuTitle(s, i){
    var isOther=(i==undefined&&s==undefined&&dInfo.other_room&&liveOther[dInfo.other_room]);
    if (i==undefined)
        i=dInfo.roomIndex;
    if (typeof s=="string")
        streamerTitle[i]=s;
    return isOther?liveOther[dInfo.other_room].title:(streamerTitle[i]?streamerTitle[i]:'... ');
}
function danmuAlter(beLess){
    if (beLess){
        danmu.style.background = 'white';
        danmu_fr.classList.remove('more');
        danmu_fr.classList.remove('fullwindow');
    } else {
        if (dInfo.flag.on){
            danmuContent();
            danmuFirstStatus();
        }
        danmu.style.background = '';
        danmu_fr.classList.add('more');
        if (isDanmuFullWindow)
            danmu_fr.classList.add('fullwindow');
        else
            danmu_fr.classList.remove('fullwindow');
    }
}
function danmuFirstStatus(){
    danmuReq("status", danmuParseStatus);
}
function setDanmuPop(p){
    if (dInfo.flag.on && p != dInfo.pop || (dInfo.pop == 9999 && p != 1)){
        var old = dInfo.pop;
        dInfo.setPop(p);
        if (old == 0 && p > 1)
            reduceShadow();
        if (p == 9999)
            danmuAlter(true);
        else if (old>1 && p == 1){
            danmuAlter(true);
            danmuWrite('TRANSMIT' + dateString(), true);
            if (dInfo.flag.on==1)
                danmuTuber();
            else
                setTimeout(function (){
                    if (dInfo.pop==1&&(dInfo.flag.on==2&&dInfo.watch&&(dInfo.other_room&&dInfo.watch!=dInfo.other_room)||(!dInfo.other_room&&parseInt(dInfo.watch)!=dInfo.roomId)&&!dInfo.watch_time))
                        danmuOn(dInfo.watch, true)
                }, 30e3);
        } else if (old == 9999 || (old == 1 && p > 1))
            danmuAlter(false);
        if (isDanmuOnly&&liveOption.enable&&old<=1&&p>1&&p!=9999&&dInfo.roomId&&isLiveOff()){
            if (!isLiveOff()&&danmu_fr.clientHeight<danmu_fr.clientWidth&&mpegts.isSupported()&&(!liveOption.lowPower||p<9e4))
                danmu.classList.add('better_view');
            else if (p>10e4)
                danmu.classList.remove('better_view');
            if (!dInfo.other_room)
                liveFromRoom();
        }
        if (forTestUse)
            console.log('Pop', p);
    }
}
function scrollAnimation(){
    if (isDanmuOnly)// css changes not immediately thus needs twice calls
        requestAnimationFrame(function outer(){
            requestAnimationFrame(function slow(){
                if (!danmu_fr.classList.contains('rotate'))
                    danmu.scrollTop=danmu.scrollHeight;
                else {
                    danmu.scrollTop=0;
                    danmu.scrollLeft=-danmu.scrollWidth;
                }
            });
        });
}
function danmuWrite(s, isBold, isReverse, isInSameLine, stillShowDuplicate){
    if (!s||!s.length||!stillShowDuplicate&&dInfo.last == (dInfo.last = s)) return;
    if (isBold) s = '<b>' + s + '</b>';
    if (isReverse) s = '<small> ' + s + '</small>';
    if (isDanmuOnly)
        danmu.insertAdjacentHTML('beforeend', (isInSameLine ? ' |' : '<br>')+s);
    else
        danmu.insertAdjacentHTML('afterbegin', s+(isInSameLine ? ' |' : '<br>'));
    danmuGC(danmu, danmuLimit.max);
    scrollAnimation();
    return s;
}
function danmuGC(e, limit){
    var len=e.childNodes.length;
    if (len>limit*15)
        for (var i=isDanmuOnly?0:len-1;isDanmuOnly?i<limit:i>limit;isDanmuOnly?i++:i--)
            e.removeChild(e.childNodes[i]);
}
function htmlEscape(s){
    return String(s).replace(/[\u00A0-\u9999<>&]/g, function(i) {return '&#'+i.charCodeAt(0)+';'});
}
function danmuShow(s){
    if (!s) return;
    var sn = s.split('<br>');
    var dup=[];
    s = [];
    var count=0;
    if (dInfo.pop == 1 && sn.length > 5)
        setDanmuPop(2);
    for (var i = 0; i < sn.length; i++)
        if (sn[i] = sn[i].trim()){
            if (!sn[i].indexOf('<!--')&&sn[i].slice(-3)=='-->')
                danmuParseStatus(sn[i].slice(4, -3));
            else if (dedup(sn[i], s));
            else if (sn[i].startsWith('[LYRC] '))
                parseLyrc(sn[i].slice(7));
            else if (sn[i].startsWith('[SLEEP]')||sn[i].startsWith('[UPGRADE]'))
                parseLyrc(sn[i]);
            else {
                count+=1;
                if (sn[i].startsWith('[EXCEP')){
                    var limit=60;
                    console.log([sn[i].slice(0, limit), sn[i].slice(limit)]);
                    if (sn[i].startsWith('[EXCEP:cors]')&&sn[i].length>limit)
                        sn[i]=sn[i].slice(0, limit)+'...';
                }
                if (sn[i].startsWith('[JS]'))
                    parseJS(sn[i].slice(4));
                if (sn[i][0] == '[' && sn[i].indexOf(']') != -1)
                    sn[i]='> '+sn[i];
                if (dInfo.pop == 1)
                    sn[i] = '<small>' + dateString() + ' </small>' + sn[i];
                s.push(sn[i]);
            }
        }
    dInfo.flow=Math.floor(dInfo.flow>4?count:count>dInfo.flow?dInfo.flow*.9+count*.1:dInfo.flow*.99+count*.01);
    applyDup();
    danmuWrite(s.slice(-danmuLimit.line).join("<br>"));

    function parseJS(s){
        setTimeout(function run(){
            try {
                var res=eval(s);
                if (res!=undefined){
                    (isDanmuOnly?danmuWrite:comment)(' > '+(typeof res=='object'?htmlEscape(JSON.stringify(res)).replace(/"|\\u\d{4}/g, ''):res));
                }
            } catch (e){
                (isDanmuOnly?danmuWrite:comment)(' < '+e);
            }
        }, 0);
    }
    function parseLyrc(s){
        var extra=document.getElementsByClassName('danmu_info')[0].getElementsByClassName('extra')[0];
        if (extra){
            var lyrc=extra.getElementsByClassName('lyrc')[0];
            if (dInfo.lyrc.n!=0)
                var inner='<span style="font-weight: bold"> - '+s+'</span><span style="float: right">'+dInfo.lyrc.last+'</span>';
            else
                var inner='<span>'+dInfo.lyrc.last+'</span><span style="float: right; font-weight: bold"> - '+s+'</span>';
            dInfo.lyrc={n: (dInfo.lyrc.n+1)%2, last: s};
            if (lyrc)
                lyrc.innerHTML=inner;
            else
                extra.insertAdjacentHTML('afterbegin', '<div class="lyrc" style="width: 100vw">'+inner+'</div>');
        }
    }
    function dedup(s, l){
        s=extract(s);
        if (s)
            for (var j=0;j<l.length;j++){
                var sim=similarity(s, extract(l[j]));
                if (sim>=(dInfo.flow<danmuLimit.line?.3:.2)){
                    if (dup[j]){//[{count: 11, sim: 0.1, content: 'TEST'}, ]
                        dup[j].count++;
                        if (sim<dup[j].sim){
                            dup[j].sim=sim;
                            dup[j].content=s;
                        }
                    } else
                        dup[j]={count: 1, sim: sim, content: s};
                    return true;
                }
            }
        return false;

        function extract(s){
            var start=s.indexOf('<!---->');
            return start>0?s.slice(start+7, s.indexOf('</span>', start)):'';
        }
    }
    function applyDup(){
        var k=Object.keys(dup);
        var tmp=[];
        for (var i=k.length-1;i>=0;i--){//ordered array
            tmp.splice(dInfo.flow>50&&dup[k[i]].count>9?tmp.length:0, 0, (dup[k[i]]?'<span style="font-size: .64em;">('+dup[k[i]].count+')':'')+'</span>'+s[k[i]]+(dup[k[i]].count>=5?boldSize(' '+dup[k[i]].content, 1.2):''));
            s.splice(k[i], 1);
        }
        if (tmp.length)
            s=isDanmuOnly?s.concat(tmp):tmp.concat(s);
    }
}
function similarity(s1, s2) {
      var longer = s1;
      var shorter = s2;
      if (s1.length < s2.length) {
        longer = s2;
        shorter = s1;
      }
      var longerLength = longer.length;
      if (longerLength == 0) {
        return 1.0;
      }
      return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength);
    }

    function editDistance(s1, s2) {
      s1 = s1.toLowerCase();
      s2 = s2.toLowerCase();
      var costs = new Array();
      for (var i = 0; i <= s1.length; i++) {
        var lastValue = i;
        for (var j = 0; j <= s2.length; j++) {
          if (i == 0)
            costs[j] = j;
          else {
            if (j > 0) {
              var newValue = costs[j - 1];
              if (s1.charAt(i - 1) != s2.charAt(j - 1))
                newValue = Math.min(Math.min(newValue, lastValue),
                  costs[j]) + 1;
              costs[j - 1] = lastValue;
              lastValue = newValue;
            }
          }
        }
        if (i > 0)
          costs[s2.length] = lastValue;
      }
      return costs[s2.length];
}
function danmuSC(l){
    if (!l)
        return false;
    var old=dInfo.sc;
    dInfo.sc = '';
    var d = getOffsetTime(0, true);
    for (var i = 0; i < l.length; i++){
        l[i][0] = Math.floor((l[i][0] - d) / (60 * 1000));
        if (l[i][0] >= 0)
            dInfo.sc = '<b>￥' + l[i][1] + '</b><small>[+' + l[i][0] + '分]</small> ' + l[i][2] + '<br>' + dInfo.sc;
    }
    if (old!=dInfo.sc)
        danmuStatus();
}
function setDanmuCover(src){
    if (isDanmuOnly&&(!danmu_live_cover.getAttribute("data-roomid")||danmu_live_cover.getAttribute("data-roomid")!=dInfo.roomId.toString())){
        danmu_live_cover.src=src.replace('http:', 'https:');
        danmu_live_cover.setAttribute("data-roomid", dInfo.roomId.toString());
        setTimeout(function wipe(){
            if (!isLiveOff()&&livePlayer._mediaDataSource&&livePlayer._mediaDataSource.hasVideo)
                danmu_live_cover.src='';
        }, 20e3);
    }
}
function danmuTuber(area){
    clearDanmuTask("tuber");
    if (area==true){
        dInfo.flag.bird=!dInfo.flag.bird;
        danmuWrite(dInfo.flag.bird?'⋛⋋( ‘Θ’)⋌⋚ Bird Launch':' (＋Θ＋)  Bird Back', true);
    }
    if (dInfo.flag.bird||typeof area=='number'){
        danmuTask.tuber=setTimeout(danmuTuber, 15*60e3);
        danmuReq('cors:https://api.live.bilibili.com/room/v3/area/getRoomList?parent_area_id='+(area&&["number", "string"].indexOf(typeof area)!=-1?area:9)+'&page_size=20', parseRank);
    }

    function parseRank(s){
        s=JsonParse(s);
        if (!dInfo.flag.on||s.code!=0)
            return danmuWrite('HUNT FAILED', true, true);
        var block=[];
        s=s.data.list.filter(function f(n){
            if (liveOption.blockList&&liveBlock.indexOf(parseInt(n.roomid))!=-1){
                block.push(n.uname);
                return false;
            }
            return true;
        });
        for (var i=1;i<s.length&&s<4;i++)
            if (streamer[1].indexOf(parseInt(s[i].roomid))!=-1){
                s.unshift(s.splice(i, 1)[0]);
                break;
            }
        if (area==true)
            dInfo.start++;
        var i=dInfo.start%Math.min(5, s.length);
        if (i<s.length&&String(s[i].roomid)!=dInfo.roomId){
            setDanmuCover(s[i].system_cover?s[i].system_cover:s[i].cover);
            danmuWrite(!block.length&&i+1<s.length?'aside with '+s[i+1].uname+'#'+(s[i+1].online/1e4).toFixed(1):'skip '+block.join(', '));
            danmuWrite('ヾ(・Θ・)ノ〃 '+(i?'No.'+(i+1):'Bird')+' Target Locked '+s[i].uname+'#'+s[i].title, true);
            danmuOn(s[i].roomid, true);
            danmuArea='【'+s[i].area_name+(i?'#'+(i+1):block.length?-block.length:'')+'】';
        }
    }
}
function getNanoSecond(){
    return (window.performance.now()/1e3%10).toFixed(6);
}
function danmuReq(roomId, f, fOnBoth, post, contentType){
    if (++dInfo.count.retry >= 15){
        danmuOff('<b>(〃>_<;〃) R</b>' + dInfo.count.retry + '>=15 <b>#</b>' + (roomId?roomId:dInfo.roomId));
        return;
    } else if (dInfo.count.retry > 6)
        danmuStatus();
    return httpReq("/blive/" + (roomId ? '?' + roomId : ''), function succ(s){
        dInfo.flag.reconfirm=false;
        if (s.indexOf('[EXCEP]') == -1)
            dInfo.count.retry=0;
        (typeof f=='function'?f:function log(s){console.log(JsonParse(s, true))})(s);
        dInfo.count.req++;
    }, function fail(s, p){
        if (dInfo.xmlReq&&dInfo.xmlReq.isAbort)
            dInfo.xmlReq.isAbort=false;
        else if (dInfo.flag.on){
            if (dInfo.flag.reconfirm=(s.split(':')[0]=='0'))
                danmuStatus();
            s='[local:' + s + '] ' + p;
            console.warn(dateString(), dInfo.count.retry, s);
            danmuWrite(s, false, true);
        }
    }, post, '', fOnBoth, contentType);
}
function danmuContent(roomId){
    clearDanmuTask("content");
    if (dInfo.flag.on){
        // T(total, >1s)=[server wait, .1~15s]+[client js, ~.2s]+[css render, .6~5s]+[sleep till next, y=2x+2, .1~30s]
        var t=(dInfo.count.retry>6?15e3:200)*(!isDanmuOnly?2:1)+(!isDanmuOnly?2:0);
        dInfo.xmlReq=danmuReq(roomId, danmuShow, function next(){
            if (!danmuTask.content)
                danmuTask.content = setTimeout(danmuContent, t);
        });
    }
}
function danmuFullScreen(forceFullScreen){
    if (!isDanmuOnly)
        return false;
    try {
        if (!forceFullScreen&&(document.fullscreenElement||document.mozFullScreenElement||document.webkitFullScreenElement||document.msFullscreenElement))
            (document.exitFullscreen||document.mozCancelFullScreen||document.webkitCancelFullScreen||document.msCancelFullscreen).call(document);
        else
            (danmu_fr.requestFullscreen||danmu_fr.mozRequestFullScreen||danmu_fr.webkitRequestFullScreen||danmu_fr.msRequestFullscreen).call(danmu_fr);
        setTimeout(scrollAnimation, 2e3);
    } catch (e){
        console.warn('[danmuFullScreen] '+e.message);
    }
}
function setRoomId(s, force){
    if (parseInt(s)){
        if (dInfo.roomId != dInfo.setRoomId(s)||force){
            if (dInfo.roomIndex==-1){
                if (!dInfo.flag.bird&&!dInfo.other_room)
                    dTool.add;
                else
                    streamer[1][-1]=parseInt(dInfo.roomId);
            }
            if (isDanmuOnly&&liveOption.enable&&!dInfo.other_room)
                liveFromRoom();
            danmuRoomInfo(-1);
            danmuOtherRoomInfo();
        }
    }
}
function fMoney(n){
    if (n<10||n>=1e9)
        return n.toString();
    var f=['拾', '佰', '仟', '万', '拾万', '佰万', '仟万', '亿'];
    for (var i=0;i<8;i++)
        if ((n/=10)<1)
            return "零壹贰叁肆伍陆柒捌玖拾"[Math.floor(n*10)]+f[i-1];
}
function danmuSet(isLoad){// input JSON-string to mannually sync to the server
    if (isLoad==true)
        danmuReq("store", function parse(s){
            console.log("danmuSet('"+s+"')");
            s=JsonParse(s);
            var msg='setLoad';
            if (streamer[0].indexOf('firstroom')==-1&&Array.isArray(s.extra)&&s.extra.length){
                streamer[0][streamer[1].length]='firstroom';
                streamer[1]=streamer[1].concat(s.extra);
                msg+=':streamer';
            }
            if (Array.isArray(s.liveOther)&&s.liveOther.length){
                for (var i=0;i<s.liveOther.length;i++)
                    liveOther[s.liveOther[i]]={};
                msg+=':live';
            }
            if (Array.isArray(s.danmuCollectRooms)&&s.danmuCollectRooms.length){
                danmuCollectRooms=s.danmuCollectRooms;
                msg+=':collect';
            }
            danmuStatus();
            console.log(msg);
        });
    else
        danmuReq("store", typeof isLoad=='string'?function set(){
            danmuReq('js:f5()');// refresh after mannually syncing
        }:'', '', typeof isLoad=='string'?isLoad:JSON.stringify({
            extra: streamer[0].indexOf('firstroom')!=-1?streamer[1].slice(streamer[0].indexOf('firstroom')):[],
            liveOther: Object.keys(liveOther),
            danmuCollectRooms: danmuCollectRooms,
        }));
}
function danmuParseStatus(s){
    var status = JsonParse(s);
    if (Object.keys(status).length){
        var p = parseInt(status.pop);
        if (dInfo.flag.on&&!status.room_id&&(status.other_room||dInfo.roomId)&&p<=1){
            danmuSet();
            danmuOn(dInfo.other_room?dInfo.other_room:dInfo.roomId, true);
        } else {
            dInfo.setPurse(status.purse);
            dInfo.setOther_room(status.other_room);
            setRoomId(status.room_id);
            danmuSC(status.super_chat);
            setDanmuPop(parseInt(status.que_size) > 5 && p == 1 ? 2 : p);
        }
    }
}
function danmuDark(toggle){
    var d=getOffsetDate();
    var on=d.getHours()>=22||d.getHours()<=10;
    if (liveOption.dark=='dark')
        on=true;
    else if (liveOption.dark=='light')
        on=false;
    else if (liveOption.dark=='off')
        return false;
    if (toggle==true)
        danmu_fr.classList.toggle('dark');
    else if (toggle==undefined){
        if (on)
            danmu_fr.classList.add('dark');
        else
            danmu_fr.classList.remove('dark');
    }
}
var dTool={
    get clean(){danmuWrite('<div style="height: 75vh; width: 0;"></div>')},
    get sleep(){
        if (liveOption.enable){
            document.body.style.background="black";
            liveOption.enable=false;
            liveOff();
            danmuWrite('[sleep:on] click to quit');
            danmu_live.src='pink.mp3';
            danmu_live.playbackRate=1;
            danmu_live.volume=1;
            danmu_live.ontimeupdate=function c(){
                var buffer = 1;// .44;
                if(this.currentTime > this.duration - buffer){
                    this.currentTime = buffer;// 0;
                    this.play();
                }
            };
            danmu_live.play();
            setTimeout(function b(){
                if (!liveOption.enable){
                    danmu_fr.style.opacity="0";
                    danmu_fr.onclick=function a(){dTool.sleep};
                }
            }, 3e3);
            if (!dInfo.on)
                danmuFullScreen(true);
        } else {
            liveOption.enable=true;
            danmu_fr.onclick=danmuSwitch;
            danmu_live.ontimeupdate=undefined;
            danmu_fr.style.opacity="";
            danmuWrite('[sleep:off]');
            danmu_live.pause();
            if (dInfo.on)
                danmuOn('', true);
        }
    },
    get rotate(){danmu_fr.classList.remove('rotate_left');danmu_fr.classList.toggle('rotate');setTimeout(scrollAnimation, 3e3)},
    get rotateleft(){danmu_fr.classList.remove('rotate');danmu_fr.classList.toggle('rotate_left');setTimeout(scrollAnimation, 3e3)},
    get store(){danmuSet()},
    get light(){hSwitch(1)},
    get dark(){danmuDark(true)},
    get scrollinput(){danmuScrollInput()},
    get cancelscroll(){danmuScrollInput(true)},
    get watch(){dInfo.flag.on=dInfo.flag.on==2?1:2;danmuStatus()},
    get firstbird(){danmuTuber(true)},
    get refresh(){danmuSet();f5('#danmuOnly')},
    get collect(){danmuCollects()},
    get showall(){danmuStatus(true)},
    get remove(){
        if (dInfo.flag.on==1){
            dInfo.flag.on=3;
            danmuWrite('[remove:enter] Remove mode, be careful');
        } else if (dInfo.flag.on==3){
            dInfo.flag.on=1;
            danmuWrite('[remove:quit]');
        } else
            danmuWrite('[remove:info] not enter, [dInfo.flag.on==1] required');
        danmuStatus();
    },
    get add(){
        if (dInfo.roomIndex==-1&&parseInt(dInfo.roomId)){
            if (streamer[0].indexOf('firstroom')==-1)
                streamer[0][streamer[1].length]='firstroom';
            streamer[1].push(parseInt(dInfo.roomId));
            dInfo.roomIndex=streamer[1].indexOf(parseInt(dInfo.roomId));
            return dInfo.roomId;
        }
    },
    toString: function (){return Object.keys(this).join(', ')},
    toJSON: function (){return this.toString()},
};
function danmuActivate(room){
    if (room){
        if (dInfo.flag.on==3){
            if (parseInt(room)){
                var i=streamer[1].indexOf(parseInt(room));
                if (i!=-1){
                    streamer[1].splice(i, 1);
                    streamerTime = Array(streamer[1].length);
                    streamerTitle = Array(streamer[1].length);
                    danmuRoomInfo();
                } else
                    danmuWrite('[remove:notExist] '+room+' failed');
            } else
                delete liveOther[room];
            dInfo.flag.on=1;// prevent unwanted click
            danmuWrite('[remove:done] '+room+', don\'t forget to save (store/refresh in dTool)');
            danmuStatus();
        } else
            danmuOn(room);
    }
}
function danmuStatus(force){
    var status = dInfo.count.retry > 6 ? ' ⁉' + dInfo.count.retry : ['OFF', 'oи' + (dInfo.pop == 9999 ? '☕' : ''), 'ᗯατcᏥ', 'Яemove'][dInfo.flag.on];
    if (dInfo.flag.on==1){
        if (dInfo.other_room&&liveOther[dInfo.other_room]){
            if (liveOther[dInfo.other_room].time)
                status=liveOther[dInfo.other_room].time;
        } else if (streamerTime[dInfo.roomIndex])
            status=streamerTime[dInfo.roomIndex];
    }
    var roomStatus='';
    var extraButton=atag((dInfo.flow>=4?'<sup>'+Math.round(dInfo.flow)+'</sup>':'<b>☾</b>')+(!isLiveOff()&&livePlayer.volume!=undefined?Math.round(livePlayer.volume*10):'')+' ', false, 'Dark\nLight')+atag('<b>∞</b>'+(typeof danmuScrollNum=='string'?danmuScrollNum+(danmuScrollCurrentNum!=undefined?danmuScrollCurrentNum:'N'):' '), false, 'ScrollInput\nCancelScroll')+(dInfo.purse>10?'<sup>'+fMoney(dInfo.purse)+' '+dInfo.purseTrend+'</sup>':'');
    if (isDanmuOnly){
        for (var i=0;i<streamer[1].length;i++)
            if (force||streamerTime[i]&&dInfo.roomId!=i)
                roomStatus+=atag(streamerTime[i]+' '+(streamerTitle[i]?streamerTitle[i].slice(0, 15):''), false, (streamer[0][i]?streamer[0][i]+':':'')+streamer[1][i]+' \n'+streamerTitle[i], 'room', "danmuActivate("+streamer[1][i]+")", "liveFromRoom(false,"+streamer[1][i]+")")+' | ';
        var k=Object.keys(liveOther);
        for (var j=0;j<k.length;j++)
            if (force||liveOther[k[j]].time)
                roomStatus+=atag(liveOther[k[j]].time+' '+liveOther[k[j]].title, false, k[j]+' \n'+liveOther[k[j]].title, 'room', "danmuActivate('"+k[j]+"')", "parseOtherRoom('"+k[j]+"',true)")+' | ';
        roomStatus=boldSize(roomStatus+atag('['+dateString('Mdhm')+']', false, 'ShowAll\nRemove'), .8)+'<br>';
    }
    var dTrends = dInfo.pop < 1e4 ? (dInfo.pop < 1e3 ? String(dInfo.pop):(dInfo.pop / 1e3).toFixed(1) + 'K'):(dInfo.pop / 1e4).toFixed(1) + '万';
    if (dTrends.indexOf('.') != -1){
        dTrends = dTrends.split('.');
        dTrends[1] = '<sup>' + dTrends[1][0] + '</sup>' + dTrends[1].slice(1);
        dTrends = dTrends.join('');
    }
    var signal=Math.round(Math.min(1, streamerTime.filter(function f(s){return s&&s!=''}).length/12)*6);
    signal=new Array(signal+1).join('•')+new Array(6-signal+1).join('◦');
    danmu_info.innerHTML = '<div class="base">'+atag(!dInfo.flag.on ? '热度' : !streamerTime.join('') ? '人气' : '<big>' + signal + '</big> ', false, 'Sleep\nClean', 'shrink') + atag(dTrends+(isDanmuOnly?'<sup>'+dInfo.popTrend+'</sup>':''), false, 'Rotate\nRotateLeft') + ' ' + (isDanmuOnly?extraButton:'') +(dInfo.flag.reconfirm?atag('点击此处重新确认 Click here to re-confirm', '/blive/?status', '', 'title'):atag(danmuTitle()+danmuArea+(isLiveOff()?'⊖':''), 'https://live.bilibili.com/blanc/'+dInfo.roomId, '#'+dInfo.roomId+'\nStore', 'right title'))+atag(isDanmuOnly?(dInfo.flag.bird?'├⊏⊐■=─ ':'├■■■=─ '):'', false, 'Watch\nFirstBird', 'right shrink')+ '<b>' + atag(status, false, 'Refresh\nCollect', 'right') + '</b></div><div class="extra">' + roomStatus + dInfo.sc + '</div>';

    function atag(inner, href, title, className, onclick, oncontext){
        if (href)
            onclick=(onclick?onclick:'')+";window.open('"+href+"', '_target');";//+(href?' href="'+href+'" target="_blank"':'')
        if (title){
            if (title.indexOf('\n')!=-1){
                if (!oncontext&&title.split('\n')[1].indexOf('#')==-1)//ignore # start
                    oncontext="dTool."+title.split('\n')[1].toLowerCase();
                if (!href&&!onclick&&title.split('\n')[0].indexOf('#')==-1)
                    onclick="dTool."+title.split('\n')[0].toLowerCase();
            } else if (!href&&!onclick)
                onclick="dTool."+title.toLowerCase();
        }
        return (isOnKindle?'<a':'<a'+(onclick?' onclick="'+onclick+'"':'')+(title?' title="'+title+'"':'')+(oncontext?' oncontextmenu="'+oncontext+';stopBubble();"':'')) +(className?' class="'+className+'"':'')+' >' + inner + '</a>';
    }
}
function danmuScrollInput(isAlter){
    if (isAlter){
        if (typeof danmuScrollNum=='string')
            danmuScrollNum=(danmuScrollNum.length>1)?danmuScrollNum.slice(0, -1):undefined;
        danmuScrollCurrentNum=undefined;
        return true;
    }
    if (typeof danmuScrollNum!='string'){
        danmuScrollNum='';
    } else {
        if (danmuScrollCurrentNum!=undefined){
            danmuScrollNum+=String(danmuScrollCurrentNum);
            danmuScrollCurrentNum=undefined;
        } else {
            danmuOn(danmuScrollNum);
            danmuScrollNum=undefined;
        }
    }
    danmuStatus();
}
function danmuRoomInfo(n){// parseH5 to get all uids (lots of requests) -> use parseUids in new api (1 request)
    var guardCount=0;
    var isRoomChange=(n==-1);
    clearDanmuTask("info");
    if (dInfo.flag.on&&streamer[1].length){
        if (!isUidValid()){
            //danmuWrite('warm up');
            danmuReq("cors:https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id=" + (isRoomChange&&dInfo.roomId?dInfo.roomId:streamer[1][n==undefined?n=0:n]), parseH5);
            danmuTask.info = setTimeout('danmuRoomInfo(' + ((n+1)%streamer[1].length) + ')', n==streamer[1].length-1 || dInfo.count.retry > 6 ? 3*60e3 : 1e3);
        } else {
            if (dInfo.roomIndex==-1&&dInfo.roomId)
                danmuReq("cors:https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id=" + dInfo.roomId, parseH5);
            else
                sendUids();
            danmuTask.info = setTimeout(danmuRoomInfo, 2*60e3);
        }
    }

    function sendUids(){
        danmuReq("cors:https://api.live.bilibili.com/room/v1/Room/get_status_info_by_uids", parseUids, '', JSON.stringify({uids: streamerUid.concat(streamerUid[-1]?streamerUid[-1]:undefined)}));
    }
    function isUidValid(){
        if (streamerUid.length==streamer[1].length){
            for (var i=0;i<streamer[1].length;i++)
                if (!streamerUid[i])
                    return false;
        } else
            return false;
        return true;
    }
    function parseUids(s){//like h5, but all in one
        var stat = JsonParse(s);
        if (stat.code == 0){
            var data=stat.data;
            var keys=Object.keys(data);
            var i=-1;
            var isUpdated;
            for (var j=0; j<keys.length; j++){
                i=streamerUid.indexOf(parseInt(keys[j]));
                var old=streamerTime[i];
                streamerTime[i] = data[keys[j]].live_status&&data[keys[j]].live_time>0?timeHuman(data[keys[j]].live_time):'';
                if (!old!=!streamerTime[i]){
                    isUpdated=true;
                    if (streamerTime[i]&&i!=-1)
                        dInfo.setWatch(streamer[1][i]);
                }
                danmuTitle(data[keys[j]].uname.slice(0, 6) + data[keys[j]].title, i);
                if (isRoomChange&&dInfo.roomIndex==i){
                    setDanmuCover(data[keys[j]].keyframe?data[keys[j]].keyframe:data[keys[j]].cover_from_user?data[keys[j]].cover_from_user:data[keys[j]].face);
                    parseLastDanmu(data[keys[j]].room_id);
                    if (isDanmuOnly&&data[keys[j]].live_status&&!dInfo.other_room){
                        parseOnlineGuard(data[keys[j]].uid, data[keys[j]].room_id);
                        parseRank(data[keys[j]].uid, data[keys[j]].room_id);
                    }
                }
            }
            if (isUpdated)
                danmuStatus();
        } else
            streamerUid=[];
    }
    function parseH5(s){// -> time, title, area, cover (-> lastDanmu -> 5*onlineGuard)
        var stat = JsonParse(s);
        if (stat.code == 0){
            var data = stat.data;
            var isUpdated;
            var old=streamerTime[n];
            streamerUid[n]=data.room_info.uid;
            streamerTime[n] = data.room_info.live_status&&data.room_info.live_start_time>0?timeHuman(data.room_info.live_start_time):'';
            isUpdated=!old!=!streamerTime[n];// XOR
            danmuTitle(data.anchor_info.base_info.uname.slice(0, 6) + data.room_info.title, n);
            if (isRoomChange){
                setDanmuCover(data.room_info.cover?data.room_info.cover:data.anchor_info.base_info.face);
                if (!dInfo.flag.bird)
                    danmuArea='【'+data.room_info.area_name+'】';
                parseLastDanmu(data.room_info.room_id);
                if (isDanmuOnly&&data.room_info.live_status&&!dInfo.other_room){
                    parseOnlineGuard(data.room_info.uid, data.room_info.room_id);
                    parseRank(data.room_info.uid, data.room_info.room_id);
                }
            }
            if (isUpdated){
                danmuStatus();
                if (streamerTime[n]&&n!=-1)
                    dInfo.setWatch(streamer[1][n]);
            }
        } else if (stat.code == -502)
            comment(stat.excep);
        else
            danmuReq("cors:https://api.live.bilibili.com/room/v1/Room/room_init?id=" + (isRoomChange&&dInfo.roomId?dInfo.roomId:streamer[1][n]), parseTime);
    }
    function parseTime(s){//-> time:'101m' -> title (-> lastDanmu -> 5*onlineGuard)
        var stat = JsonParse(s);
        if (stat.code == 0){
            var data = stat.data;
            if (streamerTime[n] != (streamerTime[n] = data.live_time>0?timeHuman(data.live_time):'')&&streamerTime[n])
                parseTitle(data.uid);
            if (isRoomChange){
                parseLastDanmu(data.room_id);
                if (isDanmuOnly&&!dInfo.other_room){
                    parseOnlineGuard(data.room_info.uid, data.room_info.room_id);
                    parseRank(data.room_info.uid, data.room_info.room_id);
                }
            }
        }
    }
    function parseTitle(u){
        danmuReq("cors:https://api.bilibili.com/x/space/acc/info?mid=" + u, function a(s){
            var stat = JsonParse(s);
            if (stat.code == 0&&stat.data.live_room){
                if (isRoomChange)
                    setDanmuCover(stat.data.live_room.cover?stat.data.live_room.cover:stat.data.face);
                danmuTitle(stat.data.name.slice(0, 6) + stat.data.live_room.title, n);
                danmuStatus();
            }
        });
    }
    function parseLastDanmu(u){
        danmuReq("cors:https://api.live.bilibili.com/xlive/web-room/v1/dM/gethistory?roomid=" + u, function history(s){
            var stat = JsonParse(s);
            if (stat.code == 0&&stat.data.room){
                s=stat.data.room;
                var l=[];
                if (isOnKindle)
                    s=s.slice(-5);
                for (var i=0;i<s.length;i++)
                    l.push('<small>'+(!i||i==s.length-1&&s[i].check_info.ts?dateString(s[i].check_info.ts*1e3)+' ':'*')+'</small><span style="font-size: .64em">'+s[i].nickname+' </span>'+boldSize(s[i].text, 1.2));
                if (isDanmuOnly){
                    danmuWrite(l.join('<br>'));
                    setTimeout(scrollAnimation, 3e3);
                } else
                    tasks(function act(e){danmuWrite(e)}, l, !isOnKindle?100:1e3);//render speed limit
            }
        });
    }
    function parseRank(u, r){
        danmuReq("cors:https://api.live.bilibili.com/xlive/general-interface/v1/rank/getOnlineGoldRank?ruid="+u+"&roomId="+r+"&page=1&pageSize=50", function a(s){
            var stat = JsonParse(s);
            if (stat.code==0){
                var l=stat.data.OnlineRankItem;
                var s='';
                for (var i=0;i<3&&i<l.length;i++)
                    s+=' <small>('+(l[i].medalInfo?l[i].medalInfo.medalName+':':'')+l[i].score+')</small>'+l[i].name;
                danmuWrite('[Rank:'+stat.data.onlineNum+']'+s, true, true);
            }
        });
    }
    function parseOnlineGuard(u, r, n){
        if (n==undefined)
            n=1;
        if (n==1)
            clearDanmuTask("guard");
        danmuReq("cors:https://api.live.bilibili.com/xlive/app-room/v2/guardTab/topList?ruid="+u+"&roomid="+r+"&page="+n+"&pageSize=29", function a(s){
            var stat = JsonParse(s);
            if (stat.code==0){
                var l=stat.data.list;
                if (stat.data.info.now==1){
                    l=stat.data.top3.concat(l);
                    if (stat.data.info.num>=10)
                        danmuArea='<small>×'+stat.data.info.num+'</small>';
                }
                for (var i=0;i<l.length;i++)
                    if (l[i].is_alive){
                        guardCount++;
                        danmuArea+=' <img style="vertical-align: text-top; height: 1.1em; border-radius: 1em" src="'+l[i].face.replace('http:', 'https:')+'" title="'+l[i].username+'">';
                    }
                if (guardCount<20&&++n<=10&&n>=1&&stat.data.info.now<stat.data.info.page&&dInfo.flag.on&&!dInfo.other_room)
                    danmuTask.guard=setTimeout(function (){parseOnlineGuard(u, r, n)});
                else
                    danmuStatus();
            }
        });
    }
}
function danmuCollects(l, monitorMinutes, isAnalyze, table){
    // cw.htm#danmuOnly#danmuCollects([...],true)
    l=Array.isArray(l)?(l.length?l:danmuCollectRooms):(l?[l]:danmuCollectRooms);
    if (l.length){
        if (!table){
            danmuCollectRooms=l.slice();
            danmu.insertAdjacentHTML('beforeend', '<div style="font-size: .64em">=='+new Date().toLocaleTimeString()+'==</div>');
            table=document.createElement('table');
            if (isAnalyze)
                table.innerHTML='<thead><th>Name</th><th>Medal</th><th>RMedal</th><th>Guard</th><th>RGuard</th><th>Pay</th><th>Income</th></thead>';
            else
                table.innerHTML='<thead><th>Name</th><th>Online</th><th>OtherMedal</th><th>Pay</th><th>Title</th><th>Guard</th><th>Medal</th><th>Other</th><th>Income</th></thead>';
            danmu.append(table);
            danmuStatus();
        }
        var res={room: l.shift()};
        danmuReq("cors:https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id=" + res.room, parseH5);
        if (l.length)
            setTimeout(function a(){danmuCollects(l, '', isAnalyze, table)}, 500);
        if (monitorMinutes)
            setInterval(function a(){danmuCollects(l)}, monitorMinutes>1?monitorMinutes*60e3:120e3, isAnalyze);
    } else
        danmuWrite('[Collect:error] please run cw.htm?js:danmuCollects([room1, room2]) first');

    function parseH5(s){//uid, name, time, online, title -> parseRank -> parseFans -> parseGuard
        var stat = JsonParse(s);
        if (stat.code == 0){
            var data = stat.data;
            res.uid=data.room_info.uid;
            res.time=data.room_info.live_status&&data.room_info.live_start_time>0?timeHuman(data.room_info.live_start_time):'';
            res.name=data.anchor_info.base_info.uname;
            res.title=data.room_info.title;
            res.online=data.room_info.online;
            res.medal=['', 0];
            res.guard={};
            parseRank();
        } else if (stat.code == -502)
            comment(stat.excep);
    }
    function parseRank(){//score, goldNum, medalInfo
        danmuReq("cors:https://api.live.bilibili.com/xlive/general-interface/v1/rank/getOnlineGoldRank?ruid="+res.uid+"&roomId="+res.room+"&page=1&pageSize=29", function a(s){
            var stat = JsonParse(s);
            if (stat.code==0){
                var l=stat.data.OnlineRankItem;
                var ingreds={};
                res.score=0;
                res.goldNum=stat.data.onlineNum;
                res.gold={ratio: 0};
                res.top=l.length&&l[0]&&l[0].score>10?l[0].name.slice(0, 3)+':'+Math.floor(l[0].score/10):'';
                res.otherMedal=[];
                for (var i=0;i<l.length;i++){
                    res.gold[l[i].name]={score: l[i].score};
                    if (l[i].score>10)
                        res.score+=l[i].score;
                    if (l[i].medalInfo){
                        res.gold[l[i].name].medal=l[i].medalInfo.medalName+' '+l[i].medalInfo.level;
                        if (l[i].medalInfo.targetId==res.uid)
                            res.medal=[l[i].medalInfo.medalName, res.medal[1]+1];
                        else {
                            if (ingreds[l[i].medalInfo.medalName])
                                ingreds[l[i].medalInfo.medalName].count++;
                            else
                                ingreds[l[i].medalInfo.medalName]={count: 1, fans: []};
                            if (ingreds[l[i].medalInfo.medalName].fans.length<6)
                                ingreds[l[i].medalInfo.medalName].fans.push(l[i].medalInfo.level+l[i].name.slice(0, 5)+':'+l[i].score);
                        }
                    }
                }
                var sorted=Object.keys(ingreds).sort(function(a, b){return ingreds[b].count-ingreds[a].count});
                for (i=0;i<sorted.length;i++)
                    res.otherMedal.push({
                        name: sorted[i],
                        count: ingreds[sorted[i]].count,
                        fans: ingreds[sorted[i]].fans
                    });
                res.gold.ratio=Math.floor(res.medal[1]/(res.goldNum<29?res.goldNum:29)*10);
            }
        }, parseFans);
    }
    function parseFans(){//fans_group
        danmuReq('cors:https://api.live.bilibili.com/xlive/app-ucenter/v2/card/anchor?uid='+res.uid, function a(s){
            var stat = JsonParse(s);
            if (stat.code == 0)
                res.fans_group=stat.data.fans_group;
        }, parseGuard);
    }
    function parseGuard(){//count, cost, online, countReal
        danmuReq("cors:https://api.live.bilibili.com/xlive/app-room/v2/guardTab/topList?ruid="+res.uid+"&roomid="+res.room+"&page=1&pageSize=29", function a(s){
            var stat = JsonParse(s);
            if (stat.code==0){
                var l=stat.data.top3.concat(stat.data.list);
                var cost=[138, 200, 250, 300, 750, 1500, 4e3, 9e3, 1.6e4, 2.8e4, 7e4, 12e4, 20e4, 25e4, 30e4];
                res.guard.count=stat.data.info.num;//26,  27,  28,    29,    30,  31,   32,   33,   34,   35
                res.guard.oldIncome=0;// 100 guards * 8 months = 5w
                res.guard.online=[];
                res.guard.countReal=0;
                for (var i=0;i<l.length;i++){
                    if (l[i].is_alive)
                        res.guard.online.push(l[i].username);
                    if (l[i].medal_info&&l[i].medal_info.medal_level>20&&l[i].medal_info.medal_level<35)
                        res.guard.oldIncome+=(cost[l[i].medal_info.medal_level-21]*.7+cost[l[i].medal_info.medal_level-20]*.3)/2;
                    if (l[i].guard_level<3)
                        res.guard.count--;
                    res.guard.countReal+=[0, 100, 10, 0][l[i].guard_level];
                }
                res.guard.income=(res.guard.count+res.guard.countReal)*138/2;
                res.guard.oldIncome+=((stat.data.info.num-l.length)/2*138/2+3e3)*6;
            }
        }, printRes);
    }
    function printRes(){
        console.log('('+res.guard.online.length+') '+res.guard.online.join(' '), res.gold);
        var row = document.createElement("tr");
        if (isAnalyze)
            row.innerHTML='<td>'+res.name.slice(0, 2)+'</td><td>'+scienceFormat(res.fans_group)+'</td><td>'+(res.medal[1]/(res.goldNum<29?res.goldNum:29)*5).toFixed()+'</td><td>'+Math.floor((res.guard.count+res.guard.countReal)/10)*10+'</td><td>'+Math.floor((res.guard.count+res.guard.countReal)/res.fans_group*100)+'</td><td>+'+numFormat(res.score/10)+'</td><td>'+numFormat(res.guard.oldIncome)+'</td>';
        else {
            if (!res.time)
                row.style.opacity='.6';
            row.innerHTML='<td>'+res.name.slice(0, 2)+'</td><td>'+(res.time?res.time+':'+(res.online<9950?(res.online/1e4).toFixed(2).slice(1):(res.online/1e4).toFixed(1)):'-')+'</td><td>'+(res.otherMedal[0]?res.otherMedal[0].name+res.otherMedal[0].count:'')+'('+res.medal[1]+'/'+res.goldNum+')'+'</td><td>'+Math.floor(res.score/10)+(res.top?':'+res.top:'')+'</td><td>'+res.title.slice(0,2)+'</td><td>'+res.guard.online.length+'/'+res.guard.count+'+'+res.guard.countReal+'</td><td>'+scienceFormat(res.fans_group)+'</td><td><span style="font-size:.7em">'+(res.otherMedal[0]?'['+res.otherMedal[0].name.slice(0,2)+']'+res.otherMedal[0].fans.join(' '):'')+(res.otherMedal[1]?'['+res.otherMedal[1].name.slice(0,2)+']'+res.otherMedal[1].fans.join(' '):'')+'</span></td><td>'+numFormat(res.guard.income)+'/'+numFormat(res.guard.oldIncome)+'</td>';
        }
        table.append(row);
        scrollAnimation();
    }
}
function scienceFormat(n){
    var p=Math.floor(Math.log10(n));
    return Math.floor(n/Math.pow(10, p-1))*Math.pow(10, p-1);
}
function numFormat(n, t){
    var a='';
    var unit='';
    if (n<0){
        a='-';
        n=-n;
    }
    if (n>1e8){
        n/=1e8;
        unit='b';
    } else if (n>1e4){
        n/=1e4;
        unit='w';
    } else if (n>1e3){
        n/=1e3;
        unit='k';
    }
    return a+n.toFixed(typeof t=='number'?t:0)+unit;
}
function timeHuman(t){
    return timeFormat(getOffsetTime()-t*1000, 1, true);
}
function boldSize(s, size){
    return '<span style="font-weight: bold; font-size: '+(size?size:.8)+'em">'+s+'</span>';
}
function liveInfo(title, detail, forceLog, bgColor){
    if (detail==undefined)
        detail='';
    danmuGC(danmu_live_info, danmuLimit.max);
    danmu_live_info.insertAdjacentHTML('afterbegin', boldSize('['+dateString()+'@'+title+'] '+detail, forceLog?1:.64)+(forceLog?'<br>':''));
    var res=' > ['+title+'] '+detail;
    var s=dateString('dhm')+res;
    if (forTestUse||forceLog){
        if (bgColor)
            console.log('%c'+s, 'color: white; background: '+bgColor);
        else
            console.log(s);
    }
    return res;
}
function isLiveOff(){
    return livePlayer==undefined;
}
function danmuOtherRoomInfo(n){
    clearDanmuTask("other_info");
    var k=Object.keys(liveOther);
    if (dInfo.flag.on&&k.length){
        parseOtherRoom(k[n==undefined?n=0:n]);
        danmuTask.other_info = setTimeout('danmuOtherRoomInfo(' + ((n+1)%k.length) + ')', n==k.length-1 || dInfo.count.retry > 6 ? 3*60e3 : 1e3);
    }
}
function parseOtherRoom(url, isLive){
    // credit: real-url@github
    var methods={
        "huya.com": function(){
            danmuReq('cors:https://www.huya.com/'+room, function parseStreamInfo(s){
                var m, p, t=(m=s.match(/"startTime"\s*:\s*(\d+),/i))?timeHuman(parseInt(m[1])):0;
                if (m=s.match(/"live-count".*?>(.*?)</i))
                    p=parseInt(m[1].replaceAll(',', ''))/2;
                setLiveOther(((m=s.match(/"host-name".*?>(.*?)</i))?m[1]:'')+((m=s.match(/"host-title".*?>(.*?)</i))?m[1]:''), (m=s.match(/"isOn"\s*:\s*true/))?platform+(t.slice(-1)=='h'?t.slice(0, -1):t):'', p);
                if (isLive){
                    if (m=s.match(/"stream"\s*:\s*"(\S+?)"/))
                        try {
                            var res=JsonParse(atob(m[1])).data[0].gameStreamInfoList;
                            var url='';
                            for (var i=0;i<res.length;i++)
                                if (res[i].sCdnType=='BD'||(!url&&i==res.length-1))// 0 & 1 & 2 流畅 500, 3 超清 2000, (4M 4000,) 4 10M 10000
                                    url=res[i].sFlvUrl.replace('http:', 'https:')+"/"+res[i].sStreamName+'_'+['500', '500', '500', '2000', '10000'][liveOption.quality]+"."+res[i].sFlvUrlSuffix+"?"+ res[i].sFlvAntiCode.replace(/&amp;/g, '&');
                            liveFromUrl(url);
                        } catch (e){
                            return comment(e);
                        }
                    else
                        comment(platform+'LoadFailed');
                }
            });
        },
        "cc.163.com": function(){
            danmuReq('cors:https://api.cc.163.com/v1/activitylives/anchor/lives?anchor_ccid='+room, function parseStreamInfo(s){
                s=JsonParse(s);
                if (s.code=='OK'){
                    var k=Object.keys(s.data);
                    if (k.length&&Object.keys(s.data[k[0]]).length){
                        var channel_id=s.data[k[0]]['channel_id'];
                        danmuReq('cors:https://cc.163.com/live/channel/?channelids='+channel_id, function parse(s){
                            s=JsonParse(s).data[0];// 0 & 1 low 600, 2 medium 1000, 3 high 2000, (original 3000,) 4 blueray_20M 5120
                            var t=timeFormat(s.liveMinute*60e3, 1, true);
                            var p=s.hot_score/2;
                            setLiveOther(s.nickname+s.title, s.liveMinute!=undefined?platform+(t.slice(-1)=='h'?t.slice(0, -1):t):'', p);
                            if (isLive){
                                var url=s.stream_list[['low', 'low', 'medium', 'high', 'original', 'blueray_20M'][liveOption.quality]];
                                liveFromUrl('https://kspullhdl.cc.netease.com/pushstation/'+url.streamname+'.flv?'+url['CDN_FMT'].ks);
                            }
                        });
                    } else
                        liveOther[cleanUrl].time='';
                } else
                    comment(platform+'LoadFailed');
            });
        },
        "douyu.com": function(){
            danmuReq('cors:https://www.douyu.com/'+room, function parseStreamInfo(s){
                var ori=(s=s.replace(/[\r\n]/gm, ''));
                var m, p;
                if (m=ori.match(/"hot"\s*:\s*"?(\d+)/))
                    p=parseInt(m[1])/4;
                var t=p&&!s.match(/"videoLoop"\s*:\s*1/)?platform:'';//p?platform+(s.match(/"videoLoop"\s*:\s*1/)?'N':''):'';
                setLiveOther(((m=s.match(/"Title-anchorNameH2".*?>(.*?)</i))?m[1]:'')+((m=s.match(/"Title-header".*?>(.*?)</i))?m[1]:''), t, p);
                if (isLive){
                    while (m=s.match(/<script(?: type="text\/javascript")>(.*?function ub98484234.*)/))
                        s=m[1];
                    s=s.match(/(.*?)(?:<\/script>)/)[1];
                    try {
                        var data={
                            did: 'cafb70d769c2cac4c29b872400051501',//'10000000000000000000000000001501',
                            tt: parseInt(getOffsetTime()/1000).toString(),
                            rid: ori.match(/\$ROOM\.room_id\s*=\s*(\d+)/)[1],
                        };
                        data.sign=eval(s+';ub98484234('+data.rid+',"'+data.did+'",'+data.tt+')');
                        danmuReq('cors:https://www.douyu.com/lapi/live/getH5Play/'+data.rid, function parse(s){
                            s=JsonParse(s);// 0 & 1 & 2 & 3 [2]高清 900 1200p, ([3]超清 2000[p], [4]蓝光4M0 4000[p],) 4 [0]1080p60
                            if (s.error==0)
                                liveFromUrl(s.data.rtmp_url+'/'+s.data.rtmp_live);// rate not working
                        }, '', data.sign+'&rid='+data.rid+'&cdn=&rate=2&ver=Douyu_221102105&iar=0&ive=1&hevc=0&fa=0', 'application/x-www-form-urlencoded');
                    } catch (e){
                        return comment(platform+'LoadFailed:'+e);
                    }
                }
            });
        },
    };
    var m=dInfo.extractOther_room(url, true);
    if (m){
        var platform=m[1].toUpperCase().slice(0, 1);
        var room=m[2];
        var cleanUrl=m[0];
        var isLive=isLive;
        var isCurrent=cleanUrl==dInfo.other_room;
        if (!liveOther[cleanUrl])
            liveOther[cleanUrl]={};
        if (methods[m[1]])
            return methods[m[1]]();
    }
    console.log(liveInfo('Live:Failed:'+cleanUrl));

    function setLiveOther(title, t, p){
        var isUpdated=!liveOther[cleanUrl].time!=!t;
        liveOther[cleanUrl].title=title;
        liveOther[cleanUrl].time=t;
        if (isCurrent){
            if (p)
                setDanmuPop(p);
            else if (!liveOther[cleanUrl].time)
                setDanmuPop(1);
            if (isLive)
                danmuArea='';
        } else if (isLive)
            danmuArea=' | '+liveOther[cleanUrl].time+' '+liveOther[cleanUrl].title;
        if (isUpdated){
            danmuStatus();
            if (liveOther[cleanUrl].time)
                dInfo.setWatch(cleanUrl);
        }
    }
}
function liveFromRoom(audioOnly, room, isRequestLowerQuality){
    if (!room)
        room=dInfo.roomId;
    else {
        var i=streamer[1].indexOf(room);
        if (audioOnly==false){// force video when (room == currentRoom)
            if (dInfo.other_room||i!=dInfo.roomIndex){
                danmuArea=' | '+streamerTime[i]+' '+streamerTitle[i];
                audioOnly='';
            } else if (!danmuArea.startsWith('<small>×'))
                danmuArea='';
        }
    }
    dInfo.count.live=0;
    liveInfo('Load'+(audioOnly?'A:':':')+room, 'get url', true, 'SeaGreen');// 2 80, 3 150, (250), (400), 4 10000
    danmuReq('cors:https://api.live.bilibili.com/room/v1/Room/playUrl?cid='+room+'&platform=web&otype=json&quality='+liveOption.quality, function parse(s){
        s=JsonParse(s);
        if (typeof s.data!="undefined"&&s.data.durl&&(!isRequestLowerQuality||s.data.current_qn<10000)){
            var durl=[];
            for (var i=0;i<s.data.durl.length;i++)
                durl.push(s.data.durl[i].url);// true XOR n == not n, not not n != true
            if (audioOnly!=true&&audioOnly!=false)
                audioOnly=(liveOption.quality<4&&s.data.current_qn==10000&&liveOption.lowPower);
            dInfo.liveQuality=s.data.current_qn;
            danmuWrite(liveInfo('Live'+(audioOnly?'A':'')+':qn'+s.data.current_qn+'/'+durl.length, 'Start'), true, true, true);
            liveFromUrl(durl, audioOnly);
        }
    });
}
function liveFromUrl(durl, audioOnly){
    if (!dInfo.flag.on)
        return liveInfo('Quit:On'+dInfo.flag.on+':Live'+liveOption.enable, 'danmu is off', true);
    if (!durl||!durl.length)
        return liveInfo('Quit:'+dInfo.count.live, 'Require dUrl', true);
    if (typeof durl=='string'){
        danmuWrite(liveInfo('Live'+(audioOnly?'A:':':')+durl.replace(/https?:\/\//, '').slice(0, 22)+'.', '', true, 'SeaGreen'), true, true, true);
        durl=[durl];
    }
    clearDanmuTask("liveRetry");
    liveOff(true, 'getLock', 'DimGray', true);
    livePlayer = mpegts.createPlayer({
        type: 'flv', // mse, mpegts, m2ts, flv
        isLive: true,
        url: durl[dInfo.count.live%durl.length],
        hasVideo: !audioOnly,
    }, {
        enableWorker: true,// avoid requests cause danmuContent delay
        liveBufferLatencyChasing: true,
        liveBufferLatencyMaxLatency: 10,
        liveBufferLatencyMinRemain: .5,
        lazyLoad: false,
        reuseRedirectedURL: true,
    });
    livePlayer.on(mpegts.Events.ERROR, function c(errType, errDetail){
        clearDanmuTask("liveRetry");
        if (++dInfo.count.live<durl.length+2){// errDetail=="HttpStatusCodeInvalid"
            if (dInfo.count.live>2)
                liveInfo('Reload:'+dInfo.count.live+':'+errType, errDetail, true, 'burlywood');
            danmuTask.liveRetry=setTimeout(function(){liveFromUrl(durl)}, Math.pow(dInfo.count.live, 2)*1e3);
        } else {
            liveInfo('Quit:'+dInfo.count.live+':'+errType, errDetail);
            liveOff(false, dInfo.count.live+':'+errDetail);
        }
    });
    livePlayer.attachMediaElement(danmu_live);
    mpegts.LoggingControl.enableAll=false;
    if (forTestUse){
        mpegts.LoggingControl.enableError=true;// only on http code error, useless
        mpegts.LoggingControl.enableWarn=true;// too many audio frame correction warns
    }
    livePlayer.load();
    livePlayer.volume=!dInfo.other_room&&liveVol[dInfo.roomIndex]!=undefined?liveVol[dInfo.roomIndex]:liveDefaultVol;
    livePlayer.muted=false;
    danmu_live.playbackRate=1;
    livePlayer.play();
    danmu_live.style.opacity='1';
    danmuDark();
    danmuStatus();
}
function videoFromUrl(url, format){
    // DEBUG use
    // to get bilibili video url https://bilibili.iiilab.com/
    // access from /blive/?js:videoFromUrl('url','mp4')
    liveOff(true, 'getLock', 'DimGray', true);
    livePlayer = mpegts.createPlayer({
        type: format?format:'mp4', // mse, mpegts, m2ts, flv, mp4
        isLive: false,
        url: url
    }, {
        enableWorker: true,// avoid requests cause danmuContent delay
        lazyLoad: false,
        reuseRedirectedURL: true,
    });
    livePlayer.on(mpegts.Events.ERROR, function c(errType, errDetail){
        clearDanmuTask("liveRetry");
        liveInfo('Quit:'+dInfo.count.live+':'+errType, errDetail);
        liveOff(false, dInfo.count.live+':'+errDetail);
    });
    livePlayer.attachMediaElement(danmu_live);
    mpegts.LoggingControl.enableAll=false;
    if (forTestUse){
        mpegts.LoggingControl.enableError=true;// only on http code error, useless
        mpegts.LoggingControl.enableWarn=true;// too many audio frame correction warns
    }
    livePlayer.load();
    livePlayer.volume=liveDefaultVol;
    livePlayer.muted=false;
    danmu_live.playbackRate=1;
    livePlayer.play();
    danmu_live.style.opacity='1';
    dTool.clean;
}
function liveChangeVolume(value){
    if (livePlayer&&typeof livePlayer.volume=='number'){
        value=Math.floor(value*10);
        var oldv=Math.floor(livePlayer.volume*10);
        var newv=Math.floor(oldv+value);
        newv=newv>10?10:newv<0?0:newv;
        livePlayer.volume=newv/10;
        if (!dInfo.other_room)
            liveVol[dInfo.roomIndex]=newv/10;
        return newv;
    }
}
function liveOff(getLock, s, bgColor, notLog){
    var res='';
    if (livePlayer&&livePlayer.destroy){
        livePlayer.destroy();
        res=liveInfo('Ended:'+(s?s:'onendedEvent'), '', !notLog, bgColor?bgColor:'pink');
    }
    livePlayer=getLock?{}:undefined;
    danmu_live.style.opacity='0';
    setTimeout(function clearInfo(){
        if (!livePlayer)
            danmu_live_info.opacity='0';
    }, 10*60e3);
    return res;
}
// https://stackoverflow.com/questions/1655769/fastest-md5-implementation-in-javascript
if (typeof CryptoJS=="undefined"){
    (function(){var md5cycle=function(x,k){var a=x[0],b=x[1],c=x[2],d=x[3];a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3])};var cmn=function(q,a,b,x,s,t){a=add32(add32(a,q),add32(x,t));return add32(a<<s|a>>>32-s,b)};var ff=function(a,b,c,d,x,s,t){return cmn(b&c|~b&d,a,b,x,s,t)};var gg=function(a,b,c,d,x,s,t){return cmn(b&d|c&~d,a,b,x,s,t)};var hh=function(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t)};var ii=function(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t)};var md51=function(s){var txt="";var n=s.length,state=[1732584193,-271733879,-1732584194,271733878],i;for(i=64;i<=s.length;i+=64){md5cycle(state,md5blk(s.substring(i-64,i)))}s=s.substring(i-64);var tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];for(i=0;i<s.length;i++)tail[i>>2]|=s.charCodeAt(i)<<(i%4<<3);tail[i>>2]|=128<<(i%4<<3);if(i>55){md5cycle(state,tail);for(i=0;i<16;i++)tail[i]=0}tail[14]=n*8;md5cycle(state,tail);return state};var md5blk=function(s){var md5blks=[],i;for(i=0;i<64;i+=4){md5blks[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24)}return md5blks};var hex_chr="0123456789abcdef".split("");var rhex=function(n){var s="",j=0;for(;j<4;j++)s+=hex_chr[n>>j*8+4&15]+hex_chr[n>>j*8&15];return s};var hex=function(x){for(var i=0;i<x.length;i++)x[i]=rhex(x[i]);return x.join("")};window.md5=function(s){return hex(md51(s))};var add32=function(a,b){return a+b&4294967295};if(md5("hello")!="5d41402abc4b2a76b9719d911017c592"){var add32=function(x,y){var lsw=(x&65535)+(y&65535),msw=(x>>16)+(y>>16)+(lsw>>16);return msw<<16|lsw&65535}}})();
    var CryptoJS={MD5: md5};
}


/*               HOME: for Hue
http://philips-hue/debug/clip.html
https://developers.meethue.com/develop/get-started-2/

location /hue/ {
    proxy_redirect off;
    proxy_buffering off;
    proxy_http_version 1.1;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection $http_connection;
    add_header Access-Control-Allow-Methods *;
    add_header Access-Control-Allow-Credentials true;
    add_header Access-Control-Allow-Origin $http_origin;
    if ($request_method = OPTIONS){
    return 200;
    }
    access_log off;
    proxy_pass https://philips-hue/api/;
}
*/
var home = document.getElementsByClassName('home')[0];
var hueUser = {devicetype: 'A 3-switch kindle-based controller.'};
var switchs = {};//{1:{on:false, name:"Somelight", reachable:true}}
var hLast = 0;
var hPreventNetworkError=hueBaseUrl!='/hue/';
function hHelp(){
    hFail('1. Press the Hue Link button 2. Run hReg() 3. Change the hueToken in this page file');
    alert('hueToken in *Basic Settings* is invalid');
}
function hCollect(f){
    if (!hueToken){
        hHelp();
        return;
    }
    hLast = new Date().getTime();
    httpReq(hueBaseUrl + hueToken + '/lights/', function hParse(s){
        s = JsonParse(s);
        if (Array.isArray(s)){
            comment(JSON.stringify(s[0]));
            hueToken = '';
        } else {
            switchs = {};
            for (var i in s)
                switchs[i] = {on: s[i].state.on, name: s[i].name, reachable: s[i].state.reachable};
            if (typeof f == "function")
                f();
            else
                hUpdate();
        }
    }, hFail);
}
function hFail(s){
    console.warn(s);
    comment('<a href="'+hueBaseUrl+hueToken+'">'+s+'</a>');
}
function hReg(){
    httpReq(hueBaseUrl, function hParse(s){
        s = JsonParse(s)[0];
        if ("success" in s)
            hueToken = s.success.username;
        else
            comment(JSON.stringify(s));
    }, hFail, JSON.stringify(hueUser));
}
function hSwitch(n){
    if (!hueToken){
        hHelp();
        return;
    }
    var butt = document.getElementsByClassName('hs' + n)[0];
    if (butt)
        butt.style.background = "rgba(128,128,128,.2)";
    if (hPreventNetworkError && hLast && new Date().getTime() - hLast > 3 * 3600 * 1000 && !isHomeShrink)
        f5('#hSwitch(' + n + ')');
    else
        hCollect(function hChange(){
            httpReq(hueBaseUrl + hueToken + '/lights/' + n + '/state/', function hParse(s){
                s = JsonParse(s)[0];
                if ("success" in s)
                    hCollect();
                else
                    comment(JSON.stringify(s));
            }, hFail, JSON.stringify({on: !switchs[n].on, bri: 254, ct: 180, transitiontime: !switchs[n].on?4:0}), 'PUT', isFastLoad&&!isDanmuOnly?window.close:undefined);
        });
    stopBubble();
}
function hUpdate(){
    var l = Object.keys(switchs).length;
    if (!hueToken)
        hHelp();
    else if (!l)
        hCollect();
    else {
        home.innerHTML = '';
        if (l>=3||!hasModule("tomato"))
            home.classList.add('more');
        else
            home.classList.remove('more');
        for (var i in switchs){
            var hs = document.createElement('div');
            hs.setAttribute('class', 'h_switch hs' + i);
            hs.setAttribute('onclick', 'hSwitch(' + i + ')');
            hs.innerHTML='<span style="background: '+(switchs[i].on ? "#444" : "white")+';border-radius: 1rem; padding: 0.5rem;">'+switchs[i].name+"</span>"
            home.appendChild(hs);
            hs.style.cssText = (switchs[i].reachable ? "" : "border-color: gray;")
                + "width: " + (switchs[i].reachable ? 12 : 6)*(hasModule("tomato")?1:2) + "rem;"
                + (isHomeShrink || (toStatus && toStatus != 'stop') ? "height: 8rem;" : "")
                + (switchs[i].on ? "background: rgba(255,255,255, .2);" : "")
                + (switchs[i].on ? "" : "color: black;");
        }
        if (!isOnKindle)
            home.innerHTML += "<div class='h_switch' " + (isHomeShrink ? "style='height:8rem'" : "") + " onclick=\"location.hash='#hSwitch(1)#fastload'\">Star</div>";
    }
}
var loaded = true;
                                                                                                          
                                                                                                          
/*
                                                                                                          
                                                                                                          
$$\   $$\ $$\                 $$\ $$\                                                                     
$$ | $$  |\__|                $$ |$$ |                                                                    
$$ |$$  / $$\ $$$$$$$\   $$$$$$$ |$$ | $$$$$$\                                                            
$$$$$  /  $$ |$$  __$$\ $$  __$$ |$$ |$$  __$$\                                                           
$$  $$<   $$ |$$ |  $$ |$$ /  $$ |$$ |$$$$$$$$ |                                                          
$$ |\$$\  $$ |$$ |  $$ |$$ |  $$ |$$ |$$   ____|                                                          
$$ | \$$\ $$ |$$ |  $$ |\$$$$$$$ |$$ |\$$$$$$$\                                                           
\__|  \__|\__|\__|  \__| \_______|\__| \_______|                                                          
                                                                                                          
                                                                                                          
                                                                                                          
$$\      $$\                      $$\     $$\                                                             
$$ | $\  $$ |                     $$ |    $$ |                                                            
$$ |$$$\ $$ | $$$$$$\   $$$$$$\ $$$$$$\   $$$$$$$\   $$$$$$\   $$$$$$\                                    
$$ $$ $$\$$ |$$  __$$\  \____$$\\_$$  _|  $$  __$$\ $$  __$$\ $$  __$$\                                   
$$$$  _$$$$ |$$$$$$$$ | $$$$$$$ | $$ |    $$ |  $$ |$$$$$$$$ |$$ |  \__|                                  
$$$  / \$$$ |$$   ____|$$  __$$ | $$ |$$\ $$ |  $$ |$$   ____|$$ |                                        
$$  /   \$$ |\$$$$$$$\ \$$$$$$$ | \$$$$  |$$ |  $$ |\$$$$$$$\ $$ |                                        
\__/     \__| \_______| \_______|  \____/ \__|  \__| \_______|\__|                                        
                                                                                                          
                                                                                                          
                                                                                                          
 $$$$$$\  $$\                     $$\                                                                     
$$  __$$\ $$ |                    $$ |                                                                    
$$ /  \__|$$ | $$$$$$\   $$$$$$$\ $$ |  $$\                                                               
$$ |      $$ |$$  __$$\ $$  _____|$$ | $$  |                                                              
$$ |      $$ |$$ /  $$ |$$ /      $$$$$$  /                                                               
$$ |  $$\ $$ |$$ |  $$ |$$ |      $$  _$$<                                                                
\$$$$$$  |$$ |\$$$$$$  |\$$$$$$$\ $$ | \$$\                                                               
 \______/ \__| \______/  \_______|\__|  \__|                                                              
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
$$\ $$\ $$\ $$\ $$\ $$\ $$\ $$\ $$\ $$\ $$\ $$\                                                           
\__|\__|\__|\__|\__|\__|\__|\__|\__|\__|\__|\__|                                                          
                                                                                                          
                                                                                                    
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                                
                                                                                                          
$$$$$$$$\ $$\                                           $$\           $$\                                 
\__$$  __|$$ |                                          \__|          $$ |                                
   $$ |   $$$$$$$\   $$$$$$\         $$$$$$\  $$\   $$\ $$\  $$$$$$$\ $$ |  $$\                           
   $$ |   $$  __$$\ $$  __$$\       $$  __$$\ $$ |  $$ |$$ |$$  _____|$$ | $$  |                          
   $$ |   $$ |  $$ |$$$$$$$$ |      $$ /  $$ |$$ |  $$ |$$ |$$ /      $$$$$$  /                           
   $$ |   $$ |  $$ |$$   ____|      $$ |  $$ |$$ |  $$ |$$ |$$ |      $$  _$$<                            
   $$ |   $$ |  $$ |\$$$$$$$\       \$$$$$$$ |\$$$$$$  |$$ |\$$$$$$$\ $$ | \$$\                           
   \__|   \__|  \__| \_______|       \____$$ | \______/ \__| \_______|\__|  \__|                          
                                          $$ |                                                            
                                          $$ |                                                            
                                          \__|                                                            
$$\                                                          $$$$$$\                                      
$$ |                                                        $$  __$$\                                     
$$$$$$$\   $$$$$$\   $$$$$$\  $$\  $$\  $$\ $$$$$$$\        $$ /  \__|$$$$$$\  $$\   $$\                  
$$  __$$\ $$  __$$\ $$  __$$\ $$ | $$ | $$ |$$  __$$\       $$$$\    $$  __$$\ \$$\ $$  |                 
$$ |  $$ |$$ |  \__|$$ /  $$ |$$ | $$ | $$ |$$ |  $$ |      $$  _|   $$ /  $$ | \$$$$  /                  
$$ |  $$ |$$ |      $$ |  $$ |$$ | $$ | $$ |$$ |  $$ |      $$ |     $$ |  $$ | $$  $$<                   
$$$$$$$  |$$ |      \$$$$$$  |\$$$$$\$$$$  |$$ |  $$ |      $$ |     \$$$$$$  |$$  /\$$\                  
\_______/ \__|       \______/  \_____\____/ \__|  \__|      \__|      \______/ \__/  \__|                 
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
      $$\ $$\   $$\ $$$$$$\$$$$\   $$$$$$\   $$$$$$$\        $$$$$$\ $$\    $$\  $$$$$$\   $$$$$$\        
      \__|$$ |  $$ |$$  _$$  _$$\ $$  __$$\ $$  _____|      $$  __$$\\$$\  $$  |$$  __$$\ $$  __$$\       
      $$\ $$ |  $$ |$$ / $$ / $$ |$$ /  $$ |\$$$$$$\        $$ /  $$ |\$$\$$  / $$$$$$$$ |$$ |  \__|      
      $$ |$$ |  $$ |$$ | $$ | $$ |$$ |  $$ | \____$$\       $$ |  $$ | \$$$  /  $$   ____|$$ |            
      $$ |\$$$$$$  |$$ | $$ | $$ |$$$$$$$  |$$$$$$$  |      \$$$$$$  |  \$  /   \$$$$$$$\ $$ |            
      $$ | \______/ \__| \__| \__|$$  ____/ \_______/        \______/    \_/     \_______|\__|            
$$\   $$ |                        $$ |                                                                    
\$$$$$$  |                        $$ |                                                                    
 \______/                         \__|                                                                    
  $$\     $$\                       $$\                                           $$\                     
  $$ |    $$ |                      $$ |                                          $$ |                    
$$$$$$\   $$$$$$$\   $$$$$$\        $$ | $$$$$$\  $$$$$$$$\ $$\   $$\        $$$$$$$ | $$$$$$\   $$$$$$\  
\_$$  _|  $$  __$$\ $$  __$$\       $$ | \____$$\ \____$$  |$$ |  $$ |      $$  __$$ |$$  __$$\ $$  __$$\ 
  $$ |    $$ |  $$ |$$$$$$$$ |      $$ | $$$$$$$ |  $$$$ _/ $$ |  $$ |      $$ /  $$ |$$ /  $$ |$$ /  $$ |
  $$ |$$\ $$ |  $$ |$$   ____|      $$ |$$  __$$ | $$  _/   $$ |  $$ |      $$ |  $$ |$$ |  $$ |$$ |  $$ |
  \$$$$  |$$ |  $$ |\$$$$$$$\       $$ |\$$$$$$$ |$$$$$$$$\ \$$$$$$$ |      \$$$$$$$ |\$$$$$$  |\$$$$$$$ |
   \____/ \__|  \__| \_______|      \__| \_______|\________| \____$$ |       \_______| \______/  \____$$ |
                                                            $$\   $$ |                          $$\   $$ |
                                                            \$$$$$$  |                          \$$$$$$  |
                                                             \______/                            \______/ 
                                                                                                          
                                                                                                          
*/
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          
                                                                                                          