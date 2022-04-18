package main

import (
	"fmt"
	"time"
)

type Watcher chan struct{}

func GetWatcher() Watcher {
	return make(Watcher, 1)
}

func (ch Watcher) Send() {
	select {
	case _, ok := <-ch:
		if ok {
			ch <- struct{}{}
		}
	default:
		ch <- struct{}{}
	}
}

func (ch Watcher) Stop() {
	if ch != nil {
		select {
		case _, ok := <-ch:
			if ok {
				close(ch)
			}
		default:
		}
	}
}

func (ch Watcher) Clean() {
	for {
		select {
		case _, ok := <-ch:
			if !ok {
				return
			}
		default:
			return
		}
	}
}

type Broker struct {
	Forward Watcher
	Back    Watcher
}

func GetBroker() Broker {
	return Broker{
		Forward: GetWatcher(),
		Back:    GetWatcher(),
	}
}

func (c *Broker) Send() {
	c.Forward.Send()
	c.Back.Clean()
}

func (c *Broker) Reply() {
	c.Back.Send()
	c.Forward.Clean()
}

func cover(f func()) {
	defer func() {
		if pan := recover(); pan != nil {
			fmt.Printf("event error: %v\n", pan)
		}
	}()
	f()
}

func SetInterval(t time.Duration, f func()) Watcher {
	ch := GetWatcher()
	go func() {
		for {
			select {
			case <-ch:
				return
			case <-time.After(t):
				go cover(f)
			}
		}
	}()
	return ch
}
