package main

import (
	"context"
	"dServer/settings"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tidwall/gjson"
	"github.com/wmillers/blivedm-go/client"
)

func Start() {
	if settings.Debug {
		//grmon.Start()
		fmt.Println(ServerStatus, StatusList[ServerStatus.Status])
	} else {
		gin.SetMode(gin.ReleaseMode)
	}
	fmt.Println(Args(), "\n[Run:"+settings.Port+settings.Path, time.Now().Format("2006-01-02 15:04:05.0-07")+"]")

	srv := StartServer()

	var t Watcher
	for {
		Rooms.RWMutex.Lock()
		if _, ok := Rooms.Value[ServerStatus.Room]; !ok {
			Rooms.Value[ServerStatus.Room] = &Roomstatus{Superchat: []Superchat{}}
		}
		Rooms.RWMutex.Unlock()
		ExiprePurse()

		t = StartPop(ServerStatus.Room, t)

		if GetControl(StartBlive(ServerStatus.Room, HTML), srv) {
			// fork from original blivedm repo
			// changes to Danmuku struct, Stop, Log.Fatal
			continue
		} else {
			break
		}
	}
	fmt.Println("[QUIT]")
}

func GetControl(c *client.Client, srv *http.Server) bool {
	for {
		state := <-control
		switch state.cmd {
		case CMD_CHANGE_ROOM:
			ServerStatus.Room = state.room
			c.Stop()
			return true
		case CMD_UPGRADE:
			//upgrade
			fallthrough
		case CMD_RESTART:
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()
			if err := srv.Shutdown(ctx); err != nil {
				panic("Server Shutdown:" + err.Error())
			}
			RestartServer(c)
			fallthrough
		case CMD_STOP:
			return false
		}
	}
}

func RestartServer(c *client.Client) {
	c.Stop()
	self, err := os.Executable()
	if err != nil {
		fmt.Println("FAILED restart: ", err)
	}

	cmd := exec.Command(self, Args()...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin
	cmd.Env = os.Environ()
	cmd.Run()
}

func StartServer() *http.Server {
	r := InitRouters()
	srv := &http.Server{
		Addr:    settings.Ip + ":" + settings.Port,
		Handler: r,
	}
	go func() {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			panic("listen: " + err.Error())
		}
	}()
	return srv
}

func StartPop(room string, t Watcher) Watcher {
	t.Stop()
	return SetInterval(time.Minute, func() {
		s := CorsAccess("https://api.live.bilibili.com/xlive/web-room/v1/index/getH5InfoByRoom?room_id="+room, "", "GET")
		js := gjson.Get(s, "data.room_info.live_status")
		if js.Int() > 0 {
			js = gjson.Get(s, "data.room_info.online")
			updatePop(int(js.Int()))
		} else {
			updatePop(1)
		}
	})
}

func ExiprePurse() {
	Rooms.RWMutex.Lock()
	defer Rooms.RWMutex.Unlock()
	for _, v := range Rooms.Value {
		if v.PurseExpire.Sub(time.Now()) < 0 {
			v.Purse = 0
		}
		var sc []Superchat
		for _, j := range v.Superchat {
			if j.Expire.Sub(time.Now()) > 0 {
				sc = append(sc, j)
			}
		}
		v.Superchat = sc
	}
}

func Args() []string {
	return []string{
		"-path",
		settings.Path,
		"-port",
		settings.Port,
		"-debug=" + strconv.FormatBool(settings.Debug),
		"-room",
		ServerStatus.Room,
		"-store",
		ServerStatus.Store,
		"-timeout",
		strconv.Itoa(settings.Timeout),
	}
}
