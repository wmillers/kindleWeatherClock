package main

import (
	"context"
	"dServer/settings"
	"encoding/json"
	"fmt"
	"html"
	"io/ioutil"
	"net/http"
	"os/exec"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

func CorsAccess(url string, data string, method string, ori_headers ...map[string][]string) string {
	headers := map[string]string{
		"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36",
		"Accept":     "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
	}
	if len(ori_headers) != 0 {
		if v, ok := ori_headers[0]["Content-Type"]; ok {
			headers["Content-Type"] = v[0]
		}
	}

	request, _ := http.NewRequest(method, url, strings.NewReader(data))
	for k, v := range headers {
		request.Header.Set(k, v)
	}
	client := &http.Client{Timeout: time.Second * time.Duration(settings.Timeout)}
	response, err := client.Do(request)
	//defer response.Body.Close()

	if err != nil {
		return "[ERR:cors] " + err.Error() + "@" + url
	} else if response.StatusCode >= 400 {
		return "[" + strconv.Itoa(response.StatusCode) + ":cors] " + url
	} else {
		body, _ := ioutil.ReadAll(response.Body)
		return string(body)
	}
}

func RunShell(s string, timeout int, isHTML bool) string {
	ctx := context.Background()
	if timeout > 0 {
		var cancel context.CancelFunc
		ctx, cancel = context.WithTimeout(context.Background(), time.Duration(timeout)*time.Second)
		defer cancel()
	}

	cmd := exec.CommandContext(ctx, "/bin/sh", "-c", s)

	out, err := cmd.CombinedOutput()
	res := string(out)
	if res == "" {
		res = err.Error()
	}
	if isHTML {
		res = "<title>" + html.EscapeString(s) + "</title>\r<script src=\"https://cdn.jsdelivr.net/gh/drudru/ansi_up/ansi_up.min.js\">\r</script><script>window.onload=function(){\rvar a=document.body;\ra.innerHTML=new AnsiUp().ansi_to_html(a.innerText)}\r</script><body style=\"background:#222;\rwhite-space:pre-wrap;word-break:break-word;\rfont-family:monospace;color:#ccc\">\r" + html.EscapeString(res) + "</body>\r"
	}
	return res
}

func updatePop(pop int) {
	ServerStatus.Pop = pop
	ServerStatus.IsPopUnread = true
}

func GetServerStatus() gin.H {
	return gin.H{
		"room":           ServerStatus.Room,
		"other_room":     ServerStatus.Other_room,
		"pop":            ServerStatus.Pop,
		"purse":          Rooms.Value[ServerStatus.Room].Purse,
		"que_size":       len(History) - ServerStatus.Index,
		"status":         ServerStatus.Status,
		"status_content": StatusList[ServerStatus.Status],
	}
}

func ChangeRoom(room string) string {
	room_id, _ := strconv.Atoi(room)
	if room_id > 0 && room_id < 1e15 {
		if ServerStatus.Other_room != "" || ServerStatus.Room != room {
			fmt.Println("[kill:" + ServerStatus.Room + "]")
			ServerStatus.Room = room
			ServerStatus.Pop = 0
			ServerStatus.Other_room = ""
			control <- ControlStruct{
				cmd:  CMD_CHANGE_ROOM,
				room: room,
			}
		} else {
			fmt.Println("[recv:butSame]")
		}
		return "[RECV] Room<b>" + room + "</b>"
	} else if room_id == 0 {
		return "[RECV] Room Keeps"
	} else {
		return "[err] Not in safe range: " + room
	}
}

func GetStatus(c *gin.Context) {
	JSON(c, HTTP_OK, GetServerStatus())
}

func Reverse(original []string) []string {
	out := make([]string, len(original))
	for i, k := range original {
		out[len(original)-i-1] = k
	}
	return out
}

func GetDanmu(c *gin.Context) {
	if CheckKick(c) {
		HTMLString(c, `[JS]danmuOff("KICKED")`)
		return
	}
	res := ""
	if ServerStatus.Index >= len(History) {
		ServerStatus.Broker.Send()
		select {
		case <-c.Request.Context().Done():
		case <-ServerStatus.Broker.Back:
		case <-time.After(time.Second * 15):
		}
	}
	i := ServerStatus.Index
	if i < len(History) {
		res = strings.Join(History[i:], "<br>")
		ServerStatus.Index = len(History)
	}
	if ServerStatus.IsPopUnread {
		ServerStatus.IsPopUnread = false
		js, _ := json.Marshal(GetServerStatus())
		res += "<br><!--" + string(js) + "-->"
	}
	HTMLString(c, res)
}

func GetHistory(c *gin.Context) {
	limit := 2000
	former := len(History) - limit
	var res string
	if former > 0 {
		res = fmt.Sprintf("%s<details><summary>%d shown, %d left</summary>%s</details>", strings.Join(Reverse(History[former:]), "<br>"), limit, former, strings.Join(Reverse(History[:former]), "<br>"))
	} else {
		res = strings.Join(Reverse(History), "<br>")
	}
	HTMLString(c, res)
}

func GetFavicon(c *gin.Context) {
	c.Status(204)
}

func RecordClient(c *gin.Context) {
	ServerStatus.Clients.RWMutex.Lock()
	defer ServerStatus.Clients.RWMutex.Unlock()
	ua := c.Request.UserAgent()
	path := c.Request.RequestURI
	if v, ok := ServerStatus.Clients.Value[ua]; ok {
		last, _ := time.Parse("2006-01-02T15:04:05MST", v.Last+time.Now().Format("MST"))
		v.Interval = int(time.Now().Sub(last) / time.Second)
		v.Reads++
	} else {
		ServerStatus.Clients.Value[ua] = &Clients{
			First:    time.Now().Format("2006-01-02T15:04:05"),
			Interval: 0,
			Path:     []string{},
			Reads:    1,
			Kick:     "",
		}
	}

	ServerStatus.Clients.Value[ua].Last = time.Now().Format("2006-01-02T15:04:05")
	paths := ServerStatus.Clients.Value[ua].Path
	if len(paths) >= 4 {
		paths = paths[len(paths)-4:]
	}
	ServerStatus.Clients.Value[ua].Path = append(paths, path)
}

func SetKick(c *gin.Context) {
	ServerStatus.Clients.RWMutex.Lock()
	defer ServerStatus.Clients.RWMutex.Unlock()
	ua := c.Request.UserAgent()
	if _, ok := ServerStatus.Clients.Value[ua]; ok {
		for i, j := range ServerStatus.Clients.Value {
			if i == ua {
				j.Kick = ""
			} else {
				j.Kick = time.Now().Format("2006-01-02T15:04:05")
			}
		}
	}
}

func CheckKick(c *gin.Context) (kick bool) {
	ServerStatus.Clients.RWMutex.Lock()
	defer ServerStatus.Clients.RWMutex.Unlock()
	if k, ok := ServerStatus.Clients.Value[c.Request.UserAgent()]; ok && k.Kick != "" {
		expire, _ := time.Parse("2006-01-02T15:04:05", k.Kick)
		k.Kick = ""
		if time.Now().Sub(expire) < 120*time.Second {
			kick = true
		}
	}
	return false
}
