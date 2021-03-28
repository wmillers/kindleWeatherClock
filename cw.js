"use strict";
var initialTitle = document.title;
var clearCommentTime = 0;
var basket = document.getElementsByClassName('basket')[0];
function comment(s, isJam) {
    var lag = 30 * 60 * 1000;
    s = s == undefined ? 'und' : String(s);
    setTimeout("clearComment()", lag + 1000);
    if (basket.innerHTML.length == 0 || isJam)
        basket.innerHTML = s;
    else
        basket.innerHTML = (basket.innerHTML + '|' + s).slice(-150);
    clearCommentTime = new Date().getTime() + lag;
    return s;
}
function clearComment() {
    if (new Date().getTime() < clearCommentTime) return;
    basket.innerHTML = '';
}
function httpReq(path, f, fOnfailed, post, method, fOnBoth) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                if (f)
                    f(xmlhttp.responseText);
            } else if (fOnfailed)
                fOnfailed(xmlhttp.status);
            if (fOnBoth)
                fOnBoth();
        }
    }
    xmlhttp.open(method ? method : post ? 'POST' : 'GET', path);
    if (post)
        xmlhttp.setRequestHeader("Content-type", "application/json");
    xmlhttp.send(post);
}
setTimeout(function modulesControl() {
    var funcList = [['tomato', 'ticklist', 'danmu', 'home', 'lunaryear'],
    ['switchTomato', 'showIcs', 'danmuSwitch', 'hSwitch', 'getLunarDay']];
    for (var i in funcList[0])
        if (!hasModule(funcList[0][i]))
            eval(funcList[1][i] + '=' + 'function disabled(){comment("' + funcList[0][i] + ' is DISABLED");return "";}');
    if (!hasModule('home'))
        home.innerHTML = '';
});
setTimeout(function autoStart() {
    if (!testStatus)
        if (navigator.userAgent.indexOf('Windows') != -1)
            comment('Autostart disabled in Windows');
        else
            for (var i = 0; i < autostart.length; i++)
                [showIcs, danmuSwitch, hUpdate][['ticklist', 'danmu', 'home'].indexOf(autostart[i])]();
});
var isFastLoad = location.hash != (location.hash = location.hash.replace('#fastload', ''));
setTimeout(function loadFromHash() {
    //resume task from #a()#b()
    var run = location.hash.split('#');
    location.hash = "";
    for (var i = 0; i < run.length; i++)
        setTimeout(decodeURI(run[i]));
});


//Lunar Year
var tgString = "甲乙丙丁戊己庚辛壬癸";
var dzString = "子丑寅卯辰巳午未申酉戌亥";
var numString = "一二三四五六七八九十";
var monString = "正二三四五六七八九十冬腊";
var sx = "鼠牛虎兔龙蛇马羊猴鸡狗猪";
var cYear, cMonth, cDay, cLastRecord;
var CalendarData = [0xA4B, 0x5164B, 0x6A5, 0x6D4, 0x415B5, 0x2B6, 0x957, 0x2092F, 0x497, 0x60C96, 0xD4A, 0xEA5, 0x50DA9, 0x5AD, 0x2B6, 0x3126E, 0x92E, 0x7192D, 0xC95, 0xD4A, 0x61B4A, 0xB55, 0x56A, 0x4155B, 0x25D, 0x92D, 0x2192B, 0xA95, 0x71695, 0x6CA, 0xB55, 0x50AB5, 0x4DA, 0xA5B, 0x30A57, 0x52B, 0x8152A, 0xE95, 0x6AA, 0x615AA, 0xAB5, 0x4B6, 0x414AE, 0xA57, 0x526, 0x31D26, 0xD95, 0x70B55, 0x56A, 0x96D, 0x5095D, 0x4AD, 0xA4D, 0x41A4D, 0xD25, 0x81AA5, 0xB54, 0xB6A, 0x612DA, 0x95B, 0x49B, 0x41497, 0xA4B, 0xA164B, 0x6A5, 0x6D4, 0x615B4, 0xAB6, 0x957, 0x5092F, 0x497, 0x64B, 0x30D4A, 0xEA5, 0x80D65, 0x5AC, 0xAB6, 0x5126D, 0x92E, 0xC96, 0x41A95, 0xD4A, 0xDA5, 0x20B55, 0x56A, 0x7155B, 0x25D, 0x92D, 0x5192B, 0xA95, 0xB4A, 0x416AA, 0xAD5, 0x90AB5, 0x4BA, 0xA5B, 0x60A57, 0x52B, 0xA93, 0x40E95];
var madd = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
function GetBit(m, n) {
    return (m >> n) & 1;
}
function setLunarDay(TheDate) {
    if (!TheDate) TheDate = getOffsetDate();
    var total, m, n, k;
    var isEnd = false;
    var tmp = TheDate.getYear();
    cLastRecord = TheDate.getDate();
    if (tmp < 1900) {
        tmp += 1900;
    }
    total = (tmp - 1921) * 365 + Math.floor((tmp - 1921) / 4) + madd[TheDate.getMonth()] + TheDate.getDate() - 38;

    if (TheDate.getYear() % 4 == 0 && TheDate.getMonth() > 1) {
        total++;
    }
    for (m = 0; ; m++) {
        k = (CalendarData[m] < 0xfff) ? 11 : 12;
        for (n = k; n >= 0; n--) {
            if (total <= 29 + GetBit(CalendarData[m], n)) {
                isEnd = true; break;
            }
            total = total - 29 - GetBit(CalendarData[m], n);
        }
        if (isEnd) break;
    }
    cYear = 1921 + m;
    cMonth = k - n + 1;
    cDay = total;
    if (k == 12) {
        if (cMonth == Math.floor(CalendarData[m] / 0x10000) + 1) {
            cMonth = 1 - cMonth;
        }
        if (cMonth > Math.floor(CalendarData[m] / 0x10000) + 1) {
            cMonth--;
        }
    }
}
function getLunarDay(year, spirit, month, day, TheDate) {
    if (getOffsetDate().getDate() != cLastRecord)
        setLunarDay(TheDate);
    var tmp = "";
    var all = !(year || spirit || month || day);
    if (all || year)
        tmp += tgString.charAt((cYear - 4) % 10) + dzString.charAt((cYear - 4) % 12);
    if (all || spirit)
        tmp += sx.charAt((cYear - 4) % 12) + "年";
    if (all || month) {
        if (cMonth < 1) {
            tmp += "闰";
            tmp += monString.charAt(-cMonth - 1);
        } else {
            tmp += monString.charAt(cMonth - 1);
        }
        tmp += "月";
    }
    if (all || day) {
        tmp += (cDay < 11) ? "初" : ((cDay < 20) ? "十" : ((cDay < 30) ? "廿" : "三十"));
        if (cDay % 10 != 0 || cDay == 10) {
            tmp += numString.charAt((cDay - 1) % 10);
        }
    }
    return tmp;
}


/*                Time Display & Weather                */
var refreshRate = 8 * 3600 * 1000;
var hardwareLagRate = 6.66;//+1s/6.66h
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
var weatherTaskIndex = 0;
var tickListAlarm = '';
if (!isFastLoad) {
    initDateFromServer();
    adjustAgainstHardwareTimeLag();//extra offset cycle
    initClockWeather();
}
initBrowserPage();

function adjustAgainstHardwareTimeLag(lag) {
    if (lag == undefined || lag < hardwareLagRate * 3600 * 1000) lag = hardwareLagRate * 3600 * 1000;//add 1s offset every xxx hour
    if (hasClockInit) timeOffset += 1000;
    setTimeout("adjustAgainstHardwareTimeLag(" + lag + ")", lag);
}
function initDateFromServer() {
    httpReq('/blive/?time', function s(a) {averageTimeOffset=[parseInt(a) - new Date().getTime(),1]; sumDateFromServer(true)});//timeDateByBlive
    setTimeout('if (!timeOffset) sumDateFromServer()', 500);//alternative
}
function sumDateFromServer(calculate) {
    if (calculate) {
        if (!averageTimeOffset[0]) return false;
        var oldHardwareLagRate = hardwareLagRate;
        var dOffsetPerSecond = "";
        var dTimeOffset = 0;
        if (!initTimeOffset && timeOffset) initTimeOffset = timeOffset;
        if (initTimeOffset) {
            var uptime = new Date().getTime() - initTime;
            if (Math.abs(timeOffset - initTimeOffset) > 200) {
                dTimeOffset = timeOffset - initTimeOffset;
                if (uptime > 3600 * 1000) {
                    var newHardwareLagRate = Math.floor((uptime / 1000 / 3600) / (dTimeOffset / 1000) * 100) / 100;
                    dOffsetPerSecond = "1s/" + newHardwareLagRate + "h" + "(" + oldHardwareLagRate + ")";
                    if (uptime > 3 * 24 * 3600 * 1000) hardwareLagRate = newHardwareLagRate;
                }
            }
        }
        dTimeOffset = dTimeOffset ? "(" + timeFormat(dTimeOffset) + ")" : "";
        console.log(comment(timeOffsetFormat(2) + dTimeOffset + "#" + dOffsetPerSecond + "#" + timeFormat(uptime, 3, true) + ""));
        document.getElementById('timeoffset').innerHTML = timeOffsetFormat();
        initClockWeather();//immediately after date time got from server
        return true;
    } else {
        averageTimeOffset = [0, 0];
        for (var i=0;i<=20;i++)
            setTimeout('singleDateFromServer(' + i + ')', 50*i);
    }
}
function singleDateFromServer(n) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("HEAD", noCache(), true);
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            if (networkFaliure) {
                networkFaliure = false;
                return;
            }
            if (n >= 20) {
                sumDateFromServer(true);
                return;
            }
            if (xmlhttp.status != 0) {
                var serverTime = new Date(xmlhttp.getResponseHeader("Date")).getTime();
                var clientTime = new Date().getTime();
                averageTimeOffset[0]+=serverTime - clientTime + 2300;
                averageTimeOffset[1]++;
                timeOffset = Math.floor(averageTimeOffset[0] / averageTimeOffset[1]);//preset lag==>+1s(screen refresh time)
                console.log(frontZero(n + 1) + "#" + Math.floor(serverTime / 1e5) + ":S" + serverTime % 1e5 / 1000 + ".:C" + clientTime % 1e5 / 1000 + ":" + timeOffsetFormat());
                //comment("Calculating..." + timeOffsetFormat(3), true);
            } else {
                networkFaliure = true;
                comment("Failed(ServerTime)#1s/" + hardwareLagRate + "h(" + timeOffsetFormat(3) + ")");
            }
        }
    }
    xmlhttp.send(null);
}
function addTaskOnPageChange(cmd, interval, isTimeout) {
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
function runTaskOnPageChange() {
    //nextCmdList=1500, cmdList={tag0:['f()', interval, end], tag1:['f()', 86400*1000, 15000000], tag2:['',true,1500]};
    try {
        var t = getOffsetTime();
        if (nextCmdList - 59 * 1000 < t) {
            nextCmdList = 0;
            for (var i in cmdList) {
                if (cmdList[i][2] - 59 * 1000 < t) {
                    if (typeof cmdList[i][0] == 'function')
                        cmdList[i][0]();
                    else
                        eval(cmdList[i][0]);
                    if (cmdList[i][1] === true)
                        cmdList[i][1] = false
                    else
                        cmdList[i][2] = getOffsetTime(cmdList[i][1]);
                }
            }
            refreshTaskOnPageChange();
        }
    } catch (e) {
        document.title = e.stack.replace(/ /g, '');
        comment(e);
    }
}
function deleteTaskOnPageChange(tId) {
    if (tId) delete cmdList[tId];
}
function refreshTaskOnPageChange() {
    for (var i in cmdList)
        if (cmdList[i][1] === false)
            deleteTaskOnPageChange(i);
        else
            if (nextCmdList == 0 || cmdList[i][2] < nextCmdList)
                nextCmdList = cmdList[i][2];
}
function initBrowserPage() {
    setIcon();
    killShadow();
    addTaskOnPageChange("killShadow()", 86300 * 1000);//24*3600=86400 & 1700 --> 17*24*3600
    addTaskOnPageChange("reduceShadow()", 3100 * 1000);//prime number 60*60=3600
}
function initClockWeather() {
    if (hasClockInit) return;//avoid duplicated init clock;
    hasClockInit = true;
    updateInterval();
    weatherInterval();
}
function setIcon() {
    for (var i in document.styleSheets)
        for (var j in document.styleSheets[i].cssRules)
            if (document.styleSheets[i].cssRules[j].selectorText == '.tImg') {
                document.getElementById('ico').href = document.styleSheets[i].cssRules[j].style.content.slice(5, -2);
                return true;
            }
    return false;
}
function tasks(f, l, t, i) {
    if (i == undefined) i = 0;
    if (i < l.length) {
        f(l[i++]);
        setTimeout(function a() {tasks(f, l, t, i)}, t);
    }
}
function killShadow(force) {
    var t = 400;
    var cleaner = document.getElementsByClassName('cleaner')[0].style;
    if (force || !preventDecreaseShadow) {
        tasks(function a(e) {cleaner.display = e}, ["", "", "none"], t);
        tasks(function b(e) {cleaner.background = e}, ["", "white", ""], t);
        tasks(function c(e) {document.body.style.color = e}, ["", "", "", "white", ""], t);
    }
}
function reduceShadow() {
    if (!preventDecreaseShadow)
        tasks(function a(e) {document.getElementsByClassName('time')[0].style.opacity = e}, [0, 1], 600);
}
function runTime(n) {return timeFormat(new Date().getTime() - initTime, n ? n : 3, true);}
function noCache() {return "?noCache=" + document.body.clientWidth + "." + document.body.clientHeight + "." + ("" + Math.random()).slice(2, 9);}
function frontZero(a, n) {
    if (!n) n = 2;
    if (typeof a != 'object')
        a = [a];
    for (var i = 0; i < a.length; i++)
        if (typeof a[i] == 'number' || !isNaN(parseInt(a[i]))) {
            a[i] = a[i].toString();
            for (var j = n - a[i].length; j > 0; j--)
                a[i] = '0' + a[i];
        }
    return a.join('');
}
function timeFormat(s, n, noPlus) {
    s = Math.floor(s);
    if (s == 0) return "";
    if (!n) n = 3;
    var str = "";
    var a = "";
    if (s > 0)
        a = "+";
    else {
        a = '-';
        s = -s;
    }
    if (s < 1000)
        str = "." + frontZero(s, 3) + "s";
    else {
        var f = [[10, 100, 60, 60, 24, 365, 100, 10], ["", "s", "m", "h", "d", "Y", "C", "T"]];
        var fsum = 1;
        for (var i in f[0])
            fsum *= f[0][i];
        for (var i = f[0].length - 1; i > 0 && n > 0; i--) {
            if (s >= fsum) {
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
function timeOffsetFormat(n) {return timeFormat(timeOffset, !n ? 2 : n);}
function how() {
    var inspect = ['runTime(2)', 'weeklyTomato.length', 'countIcs()', 'hardwareLagRate'];
    var o = '';
    var res;
    for (var i = 0; i < inspect.length; i++) {
        res = eval(inspect[i]);
        if (typeof res == 'number' && res > 5 * 60 * 1000)
            res = timeFormat(res, 2, true);
        o += inspect[i].slice(0, 6) + ':' + res + ',';
    }
    o += '[' + (Object.keys(cmdList).length - 1) + ',' + dateString(nextCmdList) + ']:';
    for (var i in cmdList)
        o += i + (cmdList[i][1] !== true ? ',' + timeFormat(cmdList[i][1], 2, true) + ',' : 'T') + dateString(cmdList[i][2]) + '|';
    return o.slice(0, -1);
}
function wipe() {basket.innerHTML = '';}
function test(s) {
    testStatus = !testStatus
    if (testStatus) {
        comment(how());
        testIcs();
        testInterval = setInterval('comment(how(), true)', (s == undefined ? 29 : s) * 1000);
    } else
        clearInterval(testInterval);
    update();
}
function f5(p, g) {location.replace(location.protocol + '//' + (p ? p : location.hostname) + location.pathname + (location.search ? "" : "?1") + (g ? g : ''));}
function loop() {
    document.getElementsByClassName('weath')[0].src = "about:blank";
    test(3);
    setInterval('timeOffset+=57*1000;update()', 50);
}
function correctPrompt() {
    var help = {
        vari: ['who', 'credit', 'help'],
        func: ['how', 'wipe', 'test', 'loop', 'testIcs', 'f5'],
        who: navigator.userAgent,
        credit: JSON.stringify(info).replace(/"/g, '')
    };
    [].push.apply(help.help = help.func, help.vari);
    var userInput = prompt(timeOffsetFormat(3) + '\nTo Manually change kindle system time:\n;st ' + dateString('', 'YMdhm') + '\n\nPlease ENTER number:\nformat: ' + dateString('', 'hms').replace(/:/g, '') + ' (hhmmss->' + dateString('', 'hms') + ')\n* 123456 means reset *\n' + help.help);
    if (!timeCorrect(userInput))
        try {
            if (help.vari.indexOf(userInput) != -1)
                userInput = 'help.' + userInput;
            else if (help.func.indexOf(userInput) != -1)
                userInput += '()';
            comment(eval(userInput));
        } catch (e) {
            comment('<span style="color:maroon">' + e + '</span>');
        }
}
function timeCorrect(correct) {//000000~235959
    if (!correct || correct.length != 5 && correct.length != 6) return false;
    if (correct == "123456")
        timeOffset = 0;
    else {
        var hms = [correct.slice(-6, -4), correct.slice(-4, -2), correct.slice(-2)];
        var allow = [[0, 23], [0, 59], [0, 59]];
        for (var i = 0; i < hms.length; i++) {
            hms[i] = Math.floor(parseInt(hms[i]));
            if (!(hms[i] >= allow[i][0] && hms[i] <= allow[i][1])) return false;
        }
        var date = new Date();
        date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + 480);
        timeOffset = (((hms[0] - date.getHours()) * 60 + (hms[1] - date.getMinutes())) * 60 + (hms[2] - date.getSeconds())) * 1000;
    }
    update();
    return true;
}
function getOffsetDate(offset, noShift) {
    var date = new Date();
    if (typeof offset != 'number') offset = 0;
    if (!noShift) date.setMinutes(date.getMinutes() + date.getTimezoneOffset() + 480);
    date.setMilliseconds(date.getMilliseconds() + timeOffset + offset);
    return date;
}
function getOffsetTime(offset, noShift) {
    return getOffsetDate(offset, noShift).getTime();
}
function updateInterval() {
    var mscs = getOffsetTime();
    setTimeout("updateInterval()", lessDisturbUpdateWhenTomato ? ((599999 - mscs % 600000) + 50) : (59999 - mscs % 60000) + 50);//(60*10)*1000+50
    update();
}
function update() {
    var date = getOffsetDate();
    runTaskOnPageChange();
    if (timeOffset == 0)//fix the bug on kindle
        date.setMinutes(date.getMinutes() + 1);
    var hour = document.getElementById("hour");
    var minute = document.getElementById("minute");
    var calendar = document.getElementsByClassName("date")[0];
    hour.innerHTML = frontZero(date.getHours()) + ':';
    minute.innerHTML = frontZero(date.getMinutes());
    var weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    calendar.innerHTML = (date.getMonth() + 1) + '月' + date.getDate() + '日'
        + (hasModule('lunaryear') ? '(' + weekday + ') ' + getLunarDay(false, false, true, true) : ' 星期' + weekday)
        + '<span style="font-size:1.5rem;position:absolute;"> ' + (testStatus ? '#envTest' : '') + ' ' + tickListAlarm + "</span>";
    return date;
}
function weatherInterval() {
    var date = getOffsetDate();
    var nextRefresh = 0;
    document.getElementById('net').innerHTML = '初始化同步';
    if (date.getTime() - lastSyncTime > refreshRate + 100000)
        nextRefresh = 10 * 60 * 1000;
    else if (date.getHours() + refreshRate / 1000 / 3600 < 24)
        nextRefresh = refreshRate;
    else//calculate time till 00:00
        nextRefresh = 24 * 3600 * 1000 - date.getTime() % (24 * 3600 * 1000) + 50;
    if (weatherTaskIndex == 0)
        weatherTaskIndex = addTaskOnPageChange('weatherInterval()', nextRefresh);
    else
        addTaskOnPageChange(weatherTaskIndex, nextRefresh);
    if (date.getTime() - lastSyncTime > 10000)
        setTimeout(function onlineWeather() {
            var _doc = document.body;
            var script = document.createElement('img');
            script.setAttribute('src', '//www.163.com/favicon.ico' + noCache());
            _doc.appendChild(script);
            script.onload = script.onreadystatechange = function () {
                weather(!this.readyState || this.readyState == 'loaded' || this.readyState == 'complete');
                script.onload = script.onreadystatechange = null;
            }
            _doc.removeChild(script);
        }, 10);
}
function weather(connected) {
    if (!connected)
        document.getElementById('net').innerHTML = '无网络连接';
    var date = getOffsetDate();
    lastSyncTime = date.getTime();
    var ifrm = document.getElementsByClassName('weath')[0];
    ifrm.src = "//i.tianqi.com/index.php?c=code&id=2&bdc=%23&icon=5&num=3&site=15";//change iframe
    document.getElementById('sync').innerHTML = date.getFullYear() + '-' + frontZero([date.getMonth() + 1, '-', date.getDate(), ' ', date.getHours(), ':', date.getMinutes(), ':', date.getSeconds()]);
    document.getElementById('timeoffset').innerHTML = timeOffsetFormat();
    document.getElementById('net').innerHTML = '完成上一次同步';
}


/*                TOMATO: Tomato Timer                */
var toStatus, ispaused, weeklyTomato = [];
var timerEntity;
var signalTired = 0;
var toWorkTimer = 25 * 60;//Second
var timerEnd, restWhenPaused;
var toRestTimer = 5 * 60
var expireTomato = 30;//Day
var tomatoMsg = [document.getElementById('tom'), document.getElementById('ato')];
var buttonStyle = [document.getElementById('hour').style, document.getElementById('minute').style]
var shinningSignal = [document.getElementById('ato').style, document.getElementsByClassName('inform')[0].style, document.getElementsByClassName('date')[0].style];
var isHomeShrink = false;
//dumpTomato();gatherTomato(719);
function dumpTomato() {rottenTomato(-1);}
function gatherTomato(fakeTomatos) {
    if (!weeklyTomato.length) eatTomato();
    if (fakeTomatos)
        for (var i = 0; i < fakeTomatos; i++)
            weeklyTomato.push(-1);
    else
        weeklyTomato.push(Math.floor(new Date().getTime() / (24 * 3600 * 1000)));
    canTomato();
    showTomato("Gather");
}
function canTomato() {document.cookie = "tomato=" + compressTomato() + ";expires=" + new Date(0x7fffffff * 1e3).toUTCString();}
function compressTomato() {
    var compressed = "";
    for (var i = 0; i < weeklyTomato.length; i++) {
        if (i != 0) compressed += '.';
        compressed += Math.floor(weeklyTomato[i]).toString(36);
    }
    return compressed;
}
function showTomato(source) {
    basket.textContent = "";
    var f = [1, 2, 20, 60, 180];
    var res = 0;
    var tomatos = weeklyTomato.length;
    for (var i = f.length - 1; i >= 0 && tomatos != 0; i--) {
        res = Math.floor(tomatos / f[i]);
        tomatos %= f[i];
        for (var j = 0; j < res; j++)
            enchantTomato(basket, ['opacity: 0.5;', "", 'border:0.1rem dashed black;', 'border:0.1rem solid black;', 'border:0.1rem solid black; background-color: #c0c0c0'][i]);
    }
    if (weeklyTomato.length != 0) basket.insertAdjacentHTML("beforeend", weeklyTomato.length);
    logTomato(source);
}
function enchantTomato(e, magicType) {
    var script = document.createElement('img');
    script.setAttribute('class', 'tImg');
    if (magicType) script.setAttribute('style', magicType);
    e.appendChild(script);
}
function eatTomato() {
    var offset = document.cookie.indexOf("tomato=");
    var end = document.cookie.indexOf(";", offset);
    if (offset != -1) {
        offset += "tomato=".length
        if (end == -1) end = document.cookie.length;
        var content = document.cookie.substring(offset, end);
        if (content) {
            weeklyTomato = Array();
            content = content.split(".");
            for (var i in content)
                if (parseInt(content[i], 36))
                    weeklyTomato.push(parseInt(content[i], 36));
        }
        logTomato("Read");
    }
}
function logTomato(source) {
    if (weeklyTomato.length == 0)
        console.log("Empty >ToMaMaTo< Store from " + source);
    else
        console.log("Len:" + weeklyTomato.length + " " + source + ":" + weeklyTomato.slice(0, 5));
}
function rottenTomato(expire) {
    var date = Math.floor(new Date().getTime() / (24 * 3600 * 1000)) - (!expire ? expireTomato : expire);
    weeklyTomato.sort(function (a, b) {return b - a;});
    for (var i = 0; i < weeklyTomato.length; i++)
        if (weeklyTomato[i] < date) {
            weeklyTomato = weeklyTomato.slice(0, i);
            break;
        }
    canTomato();
    setTimeout("rottenTomato()", expireTomato * 24 * 3600 * 1000 / 3);
    showTomato("Rotten");
}
function updateMsg(tom, sliceIndex) {
    if (tom) {
        if (sliceIndex) tom += tomatoMsg[0].innerHTML.slice(sliceIndex);
        if (tom.slice(-2) != ": ") tom += ": "
        tomatoMsg[0].innerHTML = tom;
    }
    var s = Math.round((timerEnd - new Date().getTime()) / 1000);
    var timeString = "" + frontZero(Math.floor(s / 60)) + ":" + frontZero(s % 60);
    if (!document.hidden) {
        tomatoMsg[0].style.background = toStatus == 'work' ? 'gray' : '';
        tomatoMsg[1].innerHTML = timeString;
    } else
        document.title = timeString + (toStatus == 'work' ? " <TOM" : " <ATO");
}
function fridgeTomato() {
    killShadow();
    tomatoMsg[0].style.background = '';
    tomatoMsg[0].innerHTML = toStatus && toStatus != 'stop' ? 'MATO' : 'TOMA';
    tomatoMsg[1].innerHTML = toStatus && toStatus != 'stop' ? 'TOMA' : 'MATO';
    prepareTomato();
    document.title = initialTitle;
    if (isHomeShrink) {
        isHomeShrink = false;
        var butts = document.getElementsByClassName('h_switch');
        for (var i = 0; i < butts.length; i++)
            butts[i].style.height = '';
    }
}
function prepareTomato() {
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
function switchTomato() {
    if (!toStatus) {
        prepareTomato();
        showTomato('INIT');
    }
    switch (toStatus) {
        case 'stop':
            toStatus = 'work';
            setTimer();
            preventDecreaseShadow = true;
            lessDisturbUpdateWhenTomato = true;
            timerEnd = new Date().getTime() + toWorkTimer * 1000;
            updateMsg("番茄开始");
            updateButton();
            if (!isHomeShrink) {
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
function setTimer() {
    clearTimeout(timerEntity);
    timerEntity = setTimeout(function tomatoTimer() {
        if (timerEnd < new Date().getTime()) {
            if (toStatus == 'work')
                gatherTomato();
            switchTomato();
        } else {
            updateMsg();
            setTimer();
        }
    }, 1000);
}
function updateButton() {
    buttonStyle[1].color = (ispaused) ? '#303030' : '#a9a9a9';
    if (toStatus == 'stop') buttonStyle[1].color = '#000000';
    buttonStyle[0].color = ['#000000', '#303030', '#a9a9a9'][['stop', 'work', 'rest'].indexOf(toStatus)];
}
function updateSignal() {
    if (ispaused && toStatus != 'stop') {
        if (signalTired > toWorkTimer) {
            document.title = initialTitle;
            for (var i = 0; i < shinningSignal.length; i++)
                shinningSignal[i].color = '#000000';
        } else {
            if (signalTired % 2 == 0) {
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
            setTimeout('updateSignal()', 800);
        }
    } else {
        signalTired = 0;
        document.title = initialTitle;
        for (var i = 0; i < shinningSignal.length; i++)
            shinningSignal[i].color = '#000000';
    }
}
function pauseTomato() {
    if (!toStatus || toStatus == "stop") return;
    ispaused = !ispaused
    if (ispaused) {
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
        to your Nginx config file to avoid CROS problem as the
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
var tickListFloatIndex = 0;
var reminder = document.getElementsByClassName('reminder')[0];
function dDay(t) {return dHour(t, 24);}
function dHour(t, h) {return parseInt(dMs(t, (!h ? 1 : h) * 3600 * 1000));}
function dMs(t, ms) {return (t - getOffsetTime()) / (!ms ? 1 : ms);}
function dateString(timeStamp, format) {
    var s = '';
    var all = 'YMdhms';
    var date = timeStamp ? new Date(timeStamp) : getOffsetDate();
    if (!format) format = 'hm';
    var res = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()];
    for (var i = 0; i < all.length; i++)
        if (format.indexOf(all[i]) != -1)
            s += frontZero([res[i], ['-', '-', ' ', ':', ':', ' '][i]]);
    return s.slice(0, -1);
}
function randInt(n, from) {if (from == undefined) from = 0; return Math.ceil(Math.random() * (n - from)) + from;}
function countIcs() {
    var b = [];
    for (var i = 0; i < tickList.length; i++)
        b.push(tickList[i].length);
    return b;
}
function testIcs(n) {
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
function getIcs() {httpReq("/ics/", function a(s) {readIcs(s); showIcs(true);}, comment);}
function readIcs(s) {
    s = s.replace(/\r/g, '').split('\n');
    var r = [];
    var tag = ['DTSTART', 'DTSTART;VALUE=DATE', 'SUMMARY', 'DESCRIPTION', 'TRIGGER', 'RRULE'];
    for (var i = 0; i < s.length; i++) {
        var splitter = s[i].indexOf(':');
        var line = [s[i].slice(0, splitter).trim(), s[i].slice(splitter + 1).trim()];
        if (line[0] == 'BEGIN') {
            if (line[1] == 'VEVENT')
                r.push({});
        } else if (tag.indexOf(line[0]) != -1 && r.length != 0 && r[r.length - 1][line[0]] == undefined) {
            if (line[0] == tag[0])
                line[1] = Date.parse(line[1].slice(0, 4) + '-' + line[1].slice(4, 6) + '-' + line[1].slice(6, 11) + ':' + line[1].slice(11, 13) + ':' + line[1].slice(13)) + (new Date().getTimezoneOffset() + 480) * 60 * 1000;
            else if (line[0] == tag[1]) {
                line[0] = tag[0]
                line[1] = Date.parse(line[1].slice(0, 4) + '-' + line[1].slice(4, 6) + '-' + line[1].slice(6, 8) + 'T08:00:00Z');
                r[r.length - 1]['isDateOnly'] = true;
            } else if (line[0] == tag[3]) {
                for (var j = i + 1; j < s.length && s[j][0] == ' '; j++)
                    line[1] += s[j].slice(1);
                line[1] = line[1].replace(/\\n|\\|\n/g, '').trim();
                if (line[1].slice(0, 2) == '- ' && line[1].indexOf(' - ') != -1)
                    line[1] = line[1].slice(2).replace(/ - /g, ' / ');
            } else if (line[0] == tag[5]) {
                r[r.length - 1]['FREQ'] = '';
                line[1] = line[1].split(';');
                for (var j in line[1]) {
                    line[1][j] = line[1][j].split('=');
                    if (line[1][j][0] == 'FREQ')
                        r[r.length - 1]['FREQ'] += '年月周日'[['ANNUALLY', 'MONTHLY', 'WEEKLY', 'DAILY'].indexOf(line[1][j][1])];
                    else if (line[1][j][0] == 'INTERVAL')
                        r[r.length - 1]['FREQ'] = (line[1][j][1] <= 9 ? '零一两三四五六七八九'[parseInt(line[1][j][1])] : line[1][j][1]) + r[r.length - 1]['FREQ'];
                }
                continue;
            }
            r[r.length - 1][line[0]] = line[1];
        }
    }
    sortIcs(r, 1);
    return tickList;
}
function sortIcs(r, sortNum) {
    tickList = {important: [], normal: [], noDate: []};
    var func = [[function (d) {return d > -14},
    function (a, b) {return b.DTSTART - a.DTSTART}],
    [function (d, freq) {return d >= (freq ? -7 : -14) && d <= (freq ? 3 : 90)},
    function (a, b) {
        var c = [a.DTSTART, b.DTSTART];
        var d = [a, b];
        for (var i = 0; i < c.length; i++) {
            c[i] -= getOffsetTime();
            var isNeg = c[i] != (c[i] = Math.abs(c[i]));
            c[i] *= (isNeg ? c[i] > 180 ? 3 : 2 : 1) * (d[i].isDateOnly ? c[i] > 180 ? 6 : 3 : 1) * (d[i].FREQ ? c[i] > 4 ? 8 : 3 : 1);
        }
        return c[0] - c[1];
    }]][sortNum];
    for (var i = 0; i < r.length; i++)
        if (r[i].DTSTART) {
            var dD = dDay(r[i].DTSTART);
            if (!dD)
                alarmIcs(r[i]);
            if (func[0](dD, r[i].FREQ))
                tickList.important.push(r[i]);
            else
                tickList.normal.push(r[i]);
        } else
            tickList.noDate.push(r[i]);
    tickList.important.sort(function (a, b) {return a.DTSTART - b.DTSTART;});
    tickList.normal.sort(func[1]);
}
function showIcs(keep) {
    if (!tickListTaskIndex && !testStatus)
        tickListTaskIndex = addTaskOnPageChange('getIcs()', 6 * 3600 * 1000);
    var t = document.getElementsByClassName('tickList')[0];
    var tickTable = t.getElementsByTagName('table')[0];
    tickTable.innerHTML = '';
    var tickImg = t.getElementsByClassName('tImg')[0];
    if (!keep) tickListStatus++;
    if (!keep && tickListStatus % 6 == 1) {
        tickTable.innerHTML = tickListStatus;
        getIcs();
    } else if (tickListStatus % 3 == 0) {
        t.innerHTML = '<div></div><img class="tImg" style="padding:1rem"><table></table>';
    } else {
        if (tickImg) t.removeChild(tickImg);
        var limit = (tickListStatus % 3 == 1) ? 5 : tickListMaxLine;
        var s = '<tr><td style="opacity:.3">' + dateString(0) + '<span style="opacity:0">100.00</span></td><td style="font-size:1.5rem;opacity:0;line-height:0">1000</td></tr>';
        var cross30;
        for (var j in tickList) {
            var l = tickList[j];
            for (var i = 0; i < l.length; i++) {
                if (--limit < 0) break;
                var dD = dDay(l[i].DTSTART);
                var adD = Math.abs(dD);
                var td_divider = '';
                if (cross30 == undefined)
                    cross30 = adD;
                if (adD >= 30 && cross30 < 30) {
                    cross30 = 31;
                    td_divider = ' style="border-top:3px dotted;"';
                } else
                    td_divider = '';
                var sude = (l[i].SUMMARY.length + l[i].DESCRIPTION.length > 25) ? [l[i].SUMMARY.slice(0, 10), (l[i].SUMMARY.slice(10) + (l[i].SUMMARY.length > 10 && l[i].DESCRIPTION ? ': ' : '') + l[i].DESCRIPTION.slice(0, 200 - Math.min(10, l[i].SUMMARY.length) * 6)).trim()] : [(l[i].SUMMARY + ' ' + l[i].DESCRIPTION).trim(), ''];
                var freq = (l[i].FREQ) ? '<sup style="font-size:xx-small;border-radius:20%;border:solid">' + l[i].FREQ + '</sup>' : '';
                s += '<tr style' + (!dD ? '="font-weight:bold"' : '') + '><td' + td_divider + '>' + dateString(l[i].DTSTART, 'Mdhm') + '</td><td class="tl_co" style="color:hsl(0,0%,' + Math.floor(adD / (!j ? 120 : 480) * 100) + '%)">' + (adD < 7 ? '<img class="tImg" style="height:1.5rem;margin-left:-2rem"><div class="tl_to" style="height:' + Math.ceil(adD / 10 * 3) / 3 * 1.5 + 'rem"></div>' : '') + (dD ? dD : '<span style="font-size:small">' + dHour(l[i].DTSTART) + '</span>') + '</td><td class="tl_sude"><span class="tl_su"> ' + freq + sude[0] + '</span>' + '<span style="background:white;">' + sude[1] + '</span></td></tr>';
            }
        }
        tickTable.innerHTML = s;
        if (tickListFloatIndex == 0)
            tickListFloatIndex = addTaskOnPageChange('displayReminder()', 2.5 * 3600 * 1000);//2.5*2=5<6<2.5*3=7.5
        else
            addTaskOnPageChange(tickListFloatIndex, 2.5 * 3600 * 1000);
    }
}
function alarmIcs(tick) {
    var dH = dHour(tick.DTSTART);
    var d = dMs(tick.DTSTART);
    tickListAlarm = '';
    remindIcs("tickListAlarm='['+'" + dateString(tick.DTSTART) + ' ' + tick.SUMMARY.slice(0, 20) + "'+']'", (dH - 12) * 3600 * 1000);
    remindIcs("tickListAlarm=''", (dH + 12) * 3600 * 1000);
    if (dH >= -1) {
        remindIcs(function remind() {
            tickListReminderList[hashString(tick)] = tick;
            killShadow(true);
            displayReminder()
        }, d - 15 * 60 * 1000);
        remindIcs('killShadow(true)', d - 1 * 60 * 1000);
    }
}
function deleteReminder(tickId) {
    event.stopPropagation();
    if (confirm('Job\'s done?')) {
        delete tickListReminderList[String(tickId)];
        var i = document.getElementById('tick' + tickId);
        var p = i.parentNode;
        p.removeChild(i);
        if (!p.hasChildNodes())
            p.style.display = 'none';
    }
}
function hashString(tick) {
    var s = tick.SUMMARY + tick.DESCRIPTION;
    var hash = 0, i;
    for (i = 0; i < s.length; i++) {
        hash = ((hash << 5) - hash) + s.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
    }
    return (hash + Math.floor(tick.DTSTART / 1000)).toString(36);
}
function displayReminder() {
    var l = Object.keys(tickListReminderList).length;
    var s = '';
    if (!l)
        return;
    for (var i in tickListReminderList) {
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
}
function clearReminder() {
    var r = confirm('*CLEAN ALL?*');
    if (r) {
        tickListReminderList = {};
        reminder.style.display = 'none';
    }
    return r;
}
function remindIcs(cmd, timeout) {addTaskOnPageChange(cmd, timeout, true);}//-12h,-15m,-1m,+12h


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
(function() {
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
var danmuStyle = document.getElementsByClassName('danmu_fr')[0].style;
var danmu = document.getElementById('danmu');
var danmuReadCount = 0;
var isDanmuLive = 0;
var danmuStart = 0;
var streamer = [['nc', 'dd', 'pi', 'kf'], [1220, 16548, 92613, 22259479], []];
var danmuControl = ['history', 'bye', 'kick', 'info', 'call[:]', 'c', 'js[:]', 'time'];
var danmuRoomId = '';
var danmuStreamer = '';
var danmuSuperChat = '';
var danmuPop = 0;
var danmuPopTrends = 0;
var danmuTaskIndexs = [0, 0, 0, 0];//read,info,stat,title
var danmuMax = 1600;
var danmuTryToken = 0;
var danmuLoadTime = 0;
var danmuLast = '';
function space(n, s) {
    s = s != undefined ? String(s) : '';
    for (n -= s.length * 1.8; n-- > 0;)
        s += ' ';
    return s;
}
function danmuSwitch() {
    switch (isDanmuLive) {
        case 0:
            danmuOn('');
            break;
        default:
            if (danmuPop <= 1) {
                var up = prompt('Current: ' + danmuRoomId + '\nStreamer:\n' + streamer[0] + '\nControl:\n' + danmuControl);
                if (up != null)
                    if (up == '' && danmuPop == 1)
                        danmuOff('quit');
                    else
                        danmuOn(up);
            } else
                danmuOff('+' + danmuReadCount);
    }
}
function danmuOn(roomId) {
    if (streamer[0].indexOf(roomId) != -1)
        roomId = streamer[1][streamer[0].indexOf(roomId)];
    danmuStart = getOffsetTime();
    danmuTryToken = 0;
    danmuPop = 0;
    streamer[2] = ['', '', '', ''];
    danmuTaskIndexs = [0, 0, 0];
    danmuStyle.opacity = 1;
    roomId = String(roomId);
    switch (roomId.slice(0, 2)) {
        case 'c':
            isDanmuLive = 2;
            danmuInfo();
            break;
        default:
            isDanmuLive = 1;
            danmuRead(roomId);
            danmuInfo();
    }
    danmuAlter(false);
}
function danmuOff(s) {
    if (!isDanmuLive)
        return;
    isDanmuLive = 0;
    clearTimeout(danmuTaskIndexs[0]);
    clearTimeout(danmuTaskIndexs[1]);
    clearTimeout(danmuTaskIndexs[2]);
    clearTimeout(danmuTaskIndexs[3]);
    setTimeout('if (danmuPop==1) danmuClear()', 10 * 60 * 1000);
    danmuAlter(true);
    danmu.innerHTML = '<b>--OFF' + dateString() + '--' + (s != undefined ? s + '-' : '') + timeFormat(getOffsetTime() - danmuStart, 2) + '-</b><br>' + (danmu.innerHTML).slice(0, danmuMax / 5) + '...';
    danmuInfo();
    danmuPop = 0;
}
function danmuAlter(beLess) {
    if (beLess) {
        danmu.style.background = 'white';
        danmuStyle.background = '';
        danmuStyle.marginTop = '14rem';
        danmuStyle.height = '15rem';
    } else {
        danmuRoomStatCollect();
        if (isDanmuLive == 1) {
            danmuRead();
            danmuInfoUpdate();//on danmuRooId change => danmuParseStreamer();
        }
        danmu.style.background = '';
        danmuStyle.background = 'white';
        danmuStyle.marginTop = '9rem';
        danmuStyle.height = '23rem';
    }
}
function setDanmuPop(p) {
    if (p != danmuPop && !(danmuPop == 0 && p == 1 && getOffsetTime() - danmuStart < 2 * 60 * 1000) || (danmuPop == 9999 && p != 1)) {
        var old = danmuPop;
        danmuPopTrends = p < danmuPop ? -1 : (p == danmuPop ? 0 : 1);
        danmuPop = p;
        if (old == 0 && p > 1)
            reduceShadow();
        if (p == 9999)
            danmuAlter(true);
        else if (p == 1) {
            danmuAlter(true);
            danmuWrite('TRANSMIT' + dateString(getOffsetTime(), 'hm'), true);
            if (roomId != streamer[1][0])
                setTimeout("if (danmuPop==1&&roomId!=streamer[1][0]) danmuRead(streamer[1][0])", 5 * 60e3);
        } else if (old == 9999 || (old == 1 && p > 1))
            danmuAlter(false);
    }
}
function danmuBold(s) {return '<b>' + s + '</b>';}
function danmuReverse(s) {return '<span style="margin-left:2rem"><small>' + s + '</small></span>';}
function danmuWrite(s, isBold, isReverse) {
    if (isBold) s = danmuBold(s);
    if (isReverse) s = danmuReverse(s);
    var buffer = danmu.innerHTML.slice(0, danmuMax);
    danmu.innerHTML = s + (buffer ? '<br>' : '') + buffer;
}
function danmuShow(s) {
    if (!s)
        return;
    var sn = s.split('<br>');
    var s = [];
    if (danmuPop == 1 && sn.length > 5)
        setDanmuPop(2);
    for (var i = 0; i < sn.length; i++) {
        if (!(sn[i] = sn[i].trim()) || danmuLast == (danmuLast = sn[i]))
            continue;
        if (sn[i].slice(0, 4) == '[JS]') {
            var r = decodeURI(sn[i].slice(4)).split(';');
            setTimeout(function run() {
                comment('', true);
                try {
                    for (var j = 0; j < r.length; j++)
                        if (r[j])
                            comment(eval(r[j]));
                } catch (e) {
                    comment(e);
                }
            }, 0);
        }
        if (sn[i][0] == '[' && sn[i].indexOf(']') != -1)
            sn[i] = danmuReverse(sn[i]);
        if (sn[i] && sn[i].indexOf('[CAFFEINE]') == -1)
            s.push((danmuPop <= 1 ? '<small>' + dateString(false, 'hm') + ' </small>' : '') + sn[i]);
    }
    s = s.join("<br>");
    if (danmuPop != 1 && s.indexOf('[RECV]') == -1 && s.indexOf('[SLEEP]') != -1)
        setDanmuPop(1);
    else if (s.indexOf('[LIVE]') != -1)
        danmuAlter(false);
    if (s)
        danmuWrite(s);
    if (s || danmuPop == 9999)
        danmuInfo();
}
function danmuSC(l) {
    danmuSuperChat = '';
    var d = getOffsetTime(0, true);
    for (var i = 0; i < l.length; i++) {
        l[i][0] = Math.floor((l[i][0] - d) / (60 * 1000));
        if (l[i][0] >= 0)
            danmuSuperChat += '<b>￥' + l[i][1] + '</b><small>[+' + l[i][0] + '分]</small> ' + l[i][2] + '<br>';
    }
}
function danmuRead(roomId, f) {
    if (++danmuTryToken >= 10) {
        danmuOff('(〃>_<;〃) R' + danmuTryToken + '>9, Id: ' + roomId);
        return;
    } else if (danmuTryToken > 3)
        danmuInfo();
    danmuLoadTime = getOffsetTime();
    httpReq("/blive/" + (roomId ? '?' + roomId : ''), function succ(s) {
        if (s.indexOf('[EXCEP]') == -1)
            danmuTryToken = 0;
        if (f == undefined)
            danmuShow(s);
        else
            f(s);
    }, function fail(n) {
        if (isDanmuLive && n >= 400 && n < 600)
            danmuWrite('[local] server return: ' + n + 'R' + danmuTryToken + 'S' + Math.floor(getOffsetTime() / 1000) % 3600, false, true);
    }, '', '', f == undefined ? function both() {
        var t = getOffsetTime() - danmuLoadTime;
        if (fixBugButCanAddMoreBugs && t >= 5e3 && t < 50e3)
            comment(Math.floor(t / 1000), getOffsetTime() - danmuStart > 10 * 60e3);
        clearTimeout(danmuTaskIndexs[0]);
        if (isDanmuLive)
            danmuTaskIndexs[0] = setTimeout('danmuRead()', danmuTryToken > 5 || danmuPop == 1 ? 2 * 60e3 : danmuPop > 5e4 ? 2e3 : 10e3);
    } : undefined);
}
function danmuInfoUpdate(s) {
    clearTimeout(danmuTaskIndexs[1]);
    if (isDanmuLive) {
        danmuTaskIndexs[1] = setTimeout('danmuRead("info", danmuInfoUpdate)', !s ? 3 * 1000 : danmuPop == 1 ? 3 * 60e3 : 60e3);
        if (s) {
            var info = JSON.parse(s);
            if (danmuRoomId != (danmuRoomId = info.room_id))
                danmuParseStreamer();
            danmuSC(info.super_chat);
            var p = parseInt(info.pop);
            setDanmuPop(parseInt(info.que_size) > 5 && p == 1 ? 2 : p);
            danmuInfo();
        }
    }
}
function danmuInfo() {
    var status = ['◯ OFF', streamer[2][streamer[1].indexOf(danmuRoomId)] ? streamer[2][streamer[1].indexOf(danmuRoomId)] : 'oи' + (danmuPop == 9999 ? '☕' : ''), 'ᗯατcᏥ'][isDanmuLive];
    var dTrends = (danmuPop < 1e4 ? String(danmuPop) : (Math.floor(danmuPop / 1e3) / 10 + '万'));
    if (dTrends.indexOf('.') != -1) {
        dTrends = dTrends.split('.');
        var a = ['sub', '', 'sup'][danmuPopTrends + 1];
        dTrends[1] = '<' + a + '>' + dTrends[1][0] + '</' + a + '>' + dTrends[1].slice(1);
        dTrends = dTrends.join('');
    }
    if (danmuTryToken > 3)
        status = ' ⁉' + danmuTryToken;
    document.getElementsByClassName('danmu_info')[0].innerHTML = (isDanmuLive == 2 || !streamer[2].join('') ? '人气' : '<big>' + streamer[2].reduce(function a(s, n) {return s + (n ? '•' : '◦')}, '') + '</big> ') + dTrends + '<span style="float:right">' + space(24, danmuStreamer ? danmuStreamer : '') + '<b>' + status + ' </b></span><br>' + danmuSuperChat;
}
function danmuRoomStatCollect(n) {
    clearTimeout(danmuTaskIndexs[2]);
    if (isDanmuLive) {
        if (n == undefined)
            n = 0;
        danmuRead("cros:https://api.live.bilibili.com/room/v1/Room/room_init?id=" + streamer[1][n++ % streamer[1].length], danmuParseLive);
        danmuTaskIndexs[2] = setTimeout('danmuRoomStatCollect(' + n + ')', danmuPop == 1 || n % streamer[1].length == 0 || danmuTryToken >= 3 ? 4 * 60e3 : 10e3);
    }
}
function danmuParseStreamer(s) {
    clearTimeout(danmuTaskIndexs[3]);
    if (isDanmuLive == 1) {
        if (s) {
            danmuTaskIndexs[3] = setTimeout('danmuRead("cros:https://api.live.bilibili.com/room/v1/Room/room_init?id=' + danmuRoomId + '", danmuParseStreamer)', danmuTryToken >= 3 ? 600 * 1000 : 300 * 1000);
            var stat = JSON.parse(s);
            danmuRead("cros:https://api.bilibili.com/x/space/acc/info?mid=" + stat.data.uid, function a(s) {
                var stat = JSON.parse(s);
                if (stat.code == 0) {
                    var s = [stat.data.name, stat.data.live_room.title];
                    danmuStreamer = s[0].length + s[1].length > 14 ? (s[0].slice(-3) + s[1]).slice(0, 14) : s[0] + s[1];
                }
            });
        } else {
            if (danmuRoomId)
                danmuRead('cros:https://api.live.bilibili.com/room/v1/Room/room_init?id=' + danmuRoomId, danmuParseStreamer);
            else
                setTimeout('danmuParseStreamer()', 30 * 1000);
        }
    }
}
function danmuParseLive(s) {
    var stat = JSON.parse(s);
    if (stat.code == 0) {
        stat = stat.data;
        var i = streamer[1].indexOf(stat.short_id);
        if (i == -1)
            i = streamer[1].indexOf(stat.room_id);
        if (i != -1)
            if (streamer[2][i] != (streamer[2][i] = stat.live_time > 0 ? Math.floor((getOffsetTime(0, true) / 1000 - stat.live_time) / 60) + 'm' : ''))
                danmuInfo();
        if (isDanmuLive == 2) {
            danmuWrite('> ' + streamer[0][i] + space(3) + space(10, streamer[1][i]) + streamer[2][i] + (!i ? ' ---' : ''), streamer[2][i] != '', true);
            if (streamer[2][i] != '')
                danmuOn(streamer[1][i]);
        }
    }
}
function danmuClear() {
    if (isDanmuLive) return;
    danmuStyle.opacity = 0;
    document.getElementsByClassName('danmu_info')[0].innerHTML = '';
}


/*                HOME: for Hue
http://philips-hue/debug/clip.html
https://developers.meethue.com/develop/get-started-2/
*/
var home = document.getElementsByClassName('home')[0];
var hueBaseUrl = '//philips-hue/api/';//No need CROS Access-Control-Allow-Origin *
var hueUser = {"devicetype": 'A 3-switch kindle-based controller.'};
var hueToken = "UDp1xs0RpZiOho4oX7PY-L7fpAOe8pYnOMTK1tfo";
var switchs = {};//{1:{on:false, name:"Somelight", reachable:true}}
var hLast = 0;
function hHelp() {
    comment('1. Press the Hue Link button 2. Run hReg() 3. Change the hueToken in this page file');
    alert('hueToken around line:1313 is empty');
}
function hCollect(f) {
    if (!hueToken) {
        hHelp();
        return;
    }
    hLast = new Date().getTime();
    httpReq(hueBaseUrl + hueToken + '/lights/', function hParse(s) {
        var s = JSON.parse(s);
        if (Array.isArray(s)) {
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
function hFail() {
    var s="HUE cert need to re-confirm, more in F12";
    console.error(s);
    comment('<span style="color:maroon">'+s+'</span>');
}
function hReg() {
    httpReq(hueBaseUrl, function hParse(s) {
        var s = JSON.parse(s)[0];
        if ("success" in s)
            hueToken = JSON.parse(s)[0].success.username;
        else
            comment(JSON.stringify(s));
    }, hFail, JSON.stringify(hueUser));
}
function hSwitch(n) {
    if (event)
        event.stopPropagation();
    if (!hueToken) {
        hHelp();
        return;
    }
    var butt = document.getElementsByClassName('hs' + n)[0];
    if (butt)
        butt.style.background = "rgba(128,128,128,.2)";
    if (fixBugButCanAddMoreBugs && hLast && new Date().getTime() - hLast > 3 * 3600 * 1000 && !isHomeShrink)
        f5('', '#hSwitch(' + n + ')');
    else
        setTimeout(function a() {
            hCollect(function hChange() {
                httpReq(hueBaseUrl + hueToken + '/lights/' + n + '/state/', function hParse(s) {
                    var s = JSON.parse(s)[0];
                    if ("success" in s)
                        hCollect();
                    else
                        comment(JSON.stringify(s));
                }, hFail, JSON.stringify({'on': !switchs[n].on}), 'PUT');
            });
        });
}
function hUpdate() {
    var l = Object.keys(switchs).length;
    if (!hueToken)
        hHelp();
    else if (!l)
        hCollect();
    else {
        home.innerHTML = '';
        home.style.left = l >= 3 ? "20rem" : "24rem";
        home.style.width = l >= 3 ? "24rem" : "20rem";
        for (var i in switchs) {
            var hs = document.createElement('div');
            hs.setAttribute('class', 'h_switch hs' + i);
            hs.setAttribute('onclick', 'hSwitch(' + i + ')');
            hs.appendChild(document.createTextNode(switchs[i].name));
            home.appendChild(hs);
            hs.style.cssText = (switchs[i].reachable ? "" : "border-color: gray;")
                + "width: " + (switchs[i].reachable ? "12rem;" : "8rem;")
                + (isHomeShrink || (toStatus && toStatus != 'stop') ? "height: 8rem;" : "")
                + (switchs[i].on ? "background: rgba(255,255,255, .2);" : "")
                + (switchs[i].on ? "color: black;" : "");
        }
        if (fixBugButCanAddMoreBugs && l < 3)
            home.innerHTML += "<div class='h_switch' " + (isHomeShrink ? "style='height:8rem'" : "") + " onclick=\"location.hash='#hSwitch(1)#setTimeout(window.close, 3000)#fastload'\">Star</div>";
    }
}

var loaded = true;