package main

import (
	"dServer/settings"
	"sync"
	"time"
)

type Superchat struct {
	Expire  time.Time
	Price   int
	Content string
}
type Roomstatus struct {
	Purse       int
	PurseExpire time.Time
	Superchat   []Superchat
}

var History []string

type RoomsMutex struct {
	RWMutex sync.RWMutex
	Value   map[string]*Roomstatus
}

var Rooms RoomsMutex

type Clients struct {
	First    string   `json:"first"`
	Interval int      `json:"interval"`
	Last     string   `json:"last"`
	Path     []string `json:"path"`
	Reads    int      `json:"reads"`
	Kick     string   `json:"kick"`
	//platform string
	//browser  string
}

type ClientsMutex struct {
	RWMutex sync.RWMutex
	Value   map[string]*Clients
}

var ServerStatus struct {
	Index       int
	Room        string
	Other_room  string
	Pop         int
	Status      int
	Store       string
	IsPopUnread bool
	Broker      Broker       `json:"-"`
	Clients     ClientsMutex `json:"-"`
}
var StatusList []string

type ControlStruct struct {
	cmd  int
	room string
}

var control chan ControlStruct

const (
	ServerTimeout   int = 15
	CMD_CHANGE_ROOM     = iota
	CMD_RESTART
	CMD_UPGRADE
	CMD_STOP
)

func init() {
	StatusList = []string{
		"",
		"[SLEEP] no room (CAREFUL with s4f_: cmd)",
		"[SLEEP] & [STUCK] at que.qsize() > 5000",
		"[SLEEP] & [RESTART] pong<-",
		"[UPGRADE] it depends on network",
	}

	ServerStatus.Room = settings.Room
	ServerStatus.Store = settings.Store
	ServerStatus.Broker = GetBroker()
	ServerStatus.Clients = ClientsMutex{Value: make(map[string]*Clients)}

	control = make(chan ControlStruct)

	Rooms = RoomsMutex{Value: make(map[string]*Roomstatus)}
}
