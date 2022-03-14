package main

/*
#/usr/share/applications
[Desktop Entry]
Name=Hue Switch
Comment=A switch.
GenericName=Switch
Exec=/PATH/TO/work/bin/hueswitch
Type=Application
Terminal=false
Categories=Development;
Keywords=switch;
*/
import (
	"bytes"
	"crypto/tls"
	"encoding/json"
	"flag"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"time"
)

var (
	hueBaseUrl, hueToken string
	lightI               string
	isVerbose            bool
	isReg                bool
	onState              int
	bri                  int
	ct                   int
	retry                int
	timeout              int
	start                time.Time
	client               *http.Client
)

func init() {
	log.SetFlags(log.Ldate | log.Ltime | log.Lshortfile)
	// tls takes ~70ms extra lag and its cert is self-signed
	flag.StringVar(&hueBaseUrl, "url", "http://philips-hue/api/", "Indicate where your hue api path is")
	flag.StringVar(&hueToken, "token", "UDp1xs0RpZiOho4oX7PY-L7fpAOe8pYnOMTK1tfo", "Hue api token you get")
	flag.StringVar(&lightI, "light", "1", "Light Index number")
	flag.IntVar(&onState, "on", -1, "Force set light state (0, 1)")
	flag.BoolVar(&isVerbose, "v", false, "Verbose output")
	flag.BoolVar(&isReg, "reg", false, "Get token (need to press the link button)")
	flag.IntVar(&bri, "bri", 254, "Brightness < 255")
	flag.IntVar(&ct, "ct", 180, "Color temperature 153-500")
	flag.IntVar(&retry, "retry", 3, "Retry times")
	flag.IntVar(&timeout, "timeout", 2, "Timeout for each connection")
	flag.Parse()
	client = &http.Client{Timeout: time.Second * time.Duration(timeout), Transport: &http.Transport{
		TLSClientConfig:   &tls.Config{InsecureSkipVerify: true},
		DisableKeepAlives: false,
		ForceAttemptHTTP2: true,
	}}
	start = time.Now()
}

func getToken() {
	fmt.Println("=== Reg mode ===\nPlease press the link Button on your hue bridge.")
	for {
		var jsonData = []byte(`{"devicetype": "hueswitch"}`)
		request, _ := http.NewRequest("POST", hueBaseUrl, bytes.NewBuffer(jsonData))
		request.Header.Set("Content-Type", "application/json; charset=UTF-8")
		response, err := client.Do(request)
		if err != nil {
			log.Println(err)
			<-time.After(time.Second * 5)
			continue
		}
		var res interface{}
		json.NewDecoder(response.Body).Decode(&res)
		if res != nil {
			if isVerbose {
				log.Println(res)
			}
			success, ok := res.([]interface{})[0].(map[string]interface{})["success"]
			if ok {
				token := success.(map[string]interface{})["username"].(string)
				log.Println("token:", token)
				fmt.Println("This token only show once, don't get it lost.")
			}
		}
		response.Body.Close()
		<-time.After(time.Second)
	}
}

func getLightState(n string) (bool, bool) {
	hueStateUrl := hueBaseUrl + hueToken + "/lights/" + n
	request, _ := http.NewRequest("GET", hueStateUrl, bytes.NewBuffer([]byte("")))
	response, err := client.Do(request)
	if err != nil {
		log.Println(err)
		return false, true
	}
	defer response.Body.Close()
	var res interface{}
	json.NewDecoder(response.Body).Decode(&res)
	if res != nil {
		return res.(map[string]interface{})["state"].(map[string]interface{})["on"].(bool), false
	} else {
		return false, true
	}
}

func alert(s string) {
	fmt.Printf("\a")
	log.Panicln(s)
}

func light(url string, on bool, bri, ct int) bool {
	var jsonData = []byte(`{
		"on": ` + strconv.FormatBool(on) + `,
		"bri":` + strconv.Itoa(bri) + `,
		"ct": ` + strconv.Itoa(ct) + `
	}`)
	log.Println("Switch:\t", on)
	request, _ := http.NewRequest("PUT", url, bytes.NewBuffer(jsonData))
	request.Header.Set("Content-Type", "application/json; charset=UTF-8")
	response, err := client.Do(request)
	if err != nil {
		log.Println(err)
		return false
	}
	defer response.Body.Close()

	if isVerbose {
		body, _ := ioutil.ReadAll(response.Body)
		log.Println("Code:\t", response.Status)
		log.Println("Body:\t", string(body))
	}
	return true
}

//lessCall
func lightAct(url string) bool {
	var lightState bool
	if onState == 0 {
		lightState = false
	} else if onState == 1 {
		lightState = true
	} else {
		var err bool
		lightState, err = getLightState(lightI)
		if err {
			log.Println("Cannot find (light", lightI, ") in response")
			return false
		}
		lightState = !lightState
	}
	if isVerbose {
		log.Println("First call:\t", time.Since(start))
	}
	if !light(url, lightState, bri, ct) {
		return false
	}

	currentLight, err := getLightState(lightI)
	log.Println("Current:\t", currentLight)

	if !err && currentLight != lightState {
		log.Println("It seems light state not changed as expected")
		return false
	}
	return true
}

func main() {
	defer func(start time.Time) {
		log.Println("Total use:\t", time.Since(start))
	}(time.Now())

	if isReg {
		getToken()
		return
	}

	if hueBaseUrl[len(hueBaseUrl)-1] != '/' {
		hueBaseUrl += "/"
	}
	hueControlUrl := hueBaseUrl + hueToken + "/lights/" + lightI + "/state/"
	log.Println("Dest:", hueBaseUrl+hueToken[0:3]+"**"+hueToken[len(hueToken)-3:]+"/lights/"+lightI+"/state/")

	for i := 0; i <= retry; i++ {
		if i != 0 {
			time.Sleep(time.Millisecond * 100)
		}
		if lightAct(hueControlUrl) {
			break
		} else {
			log.Println("Retry:", i+1)
		}
		if i >= retry {
			alert("Too many retries.")
		}
	}
}
