package main

import (
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const (
	HTTP_OK      = 200
	HTTP_INVALID = 400
)

func SetHeaderHTML(c *gin.Context) {
	c.Header("Content-Type", "text/html; charset=utf-8")
}

func Ok(c *gin.Context) {
	JSON(c, HTTP_OK, gin.H{
		"test": "ok",
	})
}

func ApplyMatch(c *gin.Context, statement map[string]func(c *gin.Context), cmd string) {
	isValid := false
	for k, v := range statement {
		if ok, _ := regexp.MatchString("(?i)"+k, cmd); ok {
			isValid = true
			v(c)
			break
		}
	}
	if !isValid {
		JSON(c, HTTP_INVALID, gin.H{"invalid": cmd})
	}
}

func CheckQuery(c *gin.Context) string {
	RecordClient(c)
	cmds := c.Request.URL.Query()
	var cmd string
	if len(cmds) != 0 {
		for k := range cmds {
			cmd = k
			break
		}
	}
	return cmd
}

func HTMLString(c *gin.Context, s string) {
	c.Header("Content-Type", "text/html; charset=utf-8")
	c.String(HTTP_OK, s)
}

func JSON(c *gin.Context, code int, obj interface{}) {
	c.Header("Content-Type", "application/json")
	c.JSON(code, obj)
}

func IndentedJSON(c *gin.Context, code int, obj interface{}) {
	c.Header("Content-Type", "application/json")
	c.IndentedJSON(code, obj)
}

func ParseGet(c *gin.Context) {
	cmd := CheckQuery(c)
	if len(cmd) == 0 {
		GetDanmu(c)
		return
	}
	SetHeaderHTML(c)
	statement := map[string]func(c *gin.Context){
		`^\d+$`: func(c *gin.Context) {
			HTMLString(c, ChangeRoom(cmd))
		},
		`^history$`: GetHistory,
		`^restart$`: func(c *gin.Context) {
			ServerStatus.Pop = 1
			HTMLString(c, "[RESTART] RECV OK")
			control <- ControlStruct{cmd: CMD_RESTART}
		},
		`^upgrade$`: func(c *gin.Context) {
			ServerStatus.Pop = 1
			HTMLString(c, "[UPGRADE] (not implement) Depends on network")
			control <- ControlStruct{cmd: CMD_UPGRADE}
		},
		`^status$`: GetStatus,
		`^clients$`: func(c *gin.Context) {
			// LOWER == private == omit
			IndentedJSON(c, HTTP_OK, ServerStatus.Clients.Value)
		},
		`^kick$`: func(c *gin.Context) {
			SetKick(c)
			GetDanmu(c)
		},
		`^call:`: func(c *gin.Context) {
			addDanmu(cmd[strings.Index(cmd, ":")+1:])
			HTMLString(c, "[CALLING]")
		},
		`^js:`: func(c *gin.Context) {
			if ServerStatus.Pop == 1 {
				ServerStatus.Pop = 9999
			}
			js := cmd[strings.Index(cmd, ":")+1:]
			addDanmu("[JS] " + js)
			HTMLString(c, "[JS-EXCUTING] "+js)
		},
		`^cors:`: func(c *gin.Context) {
			s, _ := c.GetRawData()
			HTMLString(c, CorsAccess(cmd[strings.Index(cmd, ":")+1:], string(s), "GET", c.Request.Header))
		},
		`^time$`: func(c *gin.Context) {
			HTMLString(c, strconv.FormatInt(time.Now().UnixMilli(), 10))
		},
		`^s4f_:`: func(c *gin.Context) {
			HTMLString(c, RunShell(cmd[strings.Index(cmd, ":")+1:], 10, true))
		},
		`^(screen|neo)fetch$`: func(c *gin.Context) {
			HTMLString(c, RunShell(cmd, 10, true))
		},
		`^store$`: func(c *gin.Context) {
			HTMLString(c, ServerStatus.Store)
		},
		`^test$`: func(ctx *gin.Context) {
			JSON(c, HTTP_OK, ServerStatus)
		},
		`^args$`: func(ctx *gin.Context) {
			HTMLString(c, "'"+strings.Join(Args(), "' '")+"'")
		},
		//any
	}
	ApplyMatch(c, statement, cmd)
}

func ParsePost(c *gin.Context) {
	cmd := CheckQuery(c)
	if len(cmd) == 0 {
		JSON(c, HTTP_INVALID, gin.H{"reason": "Empty Query"})
		return
	}
	statement := map[string]func(c *gin.Context){
		`^store$`: func(c *gin.Context) {
			s, _ := c.GetRawData()
			ServerStatus.Store = string(s)
			JSON(c, HTTP_OK, gin.H{
				"store": "done",
			})
		},
		`^cors:`: func(c *gin.Context) {
			s, _ := c.GetRawData()
			HTMLString(c, CorsAccess(cmd[strings.Index(cmd, ":")+1:], string(s), "POST", c.Request.Header))
		},
	}
	ApplyMatch(c, statement, cmd)
}

func ParsePut(c *gin.Context) {
	cmd := CheckQuery(c)
	if len(cmd) == 0 {
		JSON(c, HTTP_INVALID, gin.H{"reason": "Empty Query"})
		return
	}
	statement := map[string]func(c *gin.Context){
		`^cors:`: func(c *gin.Context) {
			s, _ := c.GetRawData()
			HTMLString(c, CorsAccess(cmd[strings.Index(cmd, ":")+1:], string(s), "PUT", c.Request.Header))
		},
	}
	ApplyMatch(c, statement, cmd)
}
