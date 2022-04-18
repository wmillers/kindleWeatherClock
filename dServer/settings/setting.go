package settings

import (
	"flag"
)

var (
	Room    string
	Debug   bool
	Path    string
	Ip      string
	Port    string
	Store   string
	Timeout int
)

func ReadFlags() {
	flag.StringVar(&Path, "path", "/blive", "base path")
	flag.StringVar(&Ip, "ip", "127.0.0.1", "")
	flag.StringVar(&Port, "port", "8099", "")
	flag.BoolVar(&Debug, "debug", false, "")
	flag.StringVar(&Room, "room", "545068", "number")
	flag.StringVar(&Store, "store", "", "string stored in /?store")
	flag.IntVar(&Timeout, "timeout", 5, "")
	flag.Parse()
}

func init() {
	ReadFlags()
}
