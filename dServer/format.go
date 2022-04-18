package main

import (
	"fmt"
	"strconv"
)

func supbold(s string) string {
	return fmt.Sprintf(`<span style="font-weight: bold; vertical-align: super; font-size: .8em">%s</span>`, s)
}

func bigbold(s string, sizes ...float64) string {
	var size float64
	if len(sizes) == 0 {
		size = 1.2
	} else {
		size = sizes[0]
	}
	return fmt.Sprintf(`<span style="font-weight: bold; font-size: %.2fem">%s</span>`, size, s)
}

func parseLevel(n int64) string {
	if n >= 15 {
		return strconv.Itoa(int(n / 5))
	} else {
		return ""
	}
}
