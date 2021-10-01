#!/usr/bin/python3
# -*- coding: utf-8 -*-
from time import sleep, ctime
from urllib import request, parse
import base64, ssl, sys, re, math

DEBUG=False
last_lyric=''

def handle(e):
    if e:
        print(repr(e)[:100]+'at'+str(sys.exc_info()[-1].tb_lineno), end='|', flush=True)

def hex2str(s): # 3.5+
    return bytes.fromhex(s).decode()

def parse_item(line):
# hard to use ElementTree to parse, move to regex
    regex = r"<item><type>(([A-Fa-f0-9]{2}){4})</type><code>(([A-Fa-f0-9]{2}){4})</code><length>(\d*)</length>"
    matches = re.findall(regex, line)
    return (hex2str(matches[0][0]), hex2str(matches[0][2]), int(matches[0][4]))

def is_b64data(line):
    return line.startswith('<data encoding="base64">')

def parse_data(line, length):
    line = line[:int(math.ceil(length/3)*4)]
    try:
        data = base64.b64decode(line).decode()
    except (TypeError, UnicodeDecodeError):
        data = ""
    except Exception as e:
        data = ""
        if DEBUG:
            print('['+str(length)+']', line[:50], '...' if len(line)>50 else ''[:50], flush=True)
        handle(e)
    return data

def get(f, method=print):
    # https://github.com/surekap/MMM-ShairportMetadata
    # <item><type>636f7265</type><code>61736172</code><length>16</length><data encoding="base64">dGhlcXVpY2ticm93bmZveGp1bXBzb3ZlcnRoZWxhenlkb2c=</data></item>
    while True:
        line=f.readline()
        if DEBUG:
            print('[raw]', line.replace('\n', '\\n')[:200], '...' if len(line)>200 else '', flush=True)
        if not line:
            break
        elif not line.startswith("<item>"):
            continue
        typ, code, length = parse_item(line)
        if DEBUG:
            print('[item]', typ, code, length, flush=True)

        data = ""
        if (length > 0):
            if (not is_b64data(f.readline())):
                continue
            data = parse_data(f.readline(), length)

        p={
            "core": {
                "asal": 'Album Name',
                "asar": 'Artist',
                "ascm": 'Comment',
                "asgn": 'Genre',
                "minm": 'Title',
                "ascp": 'Composer',
                "asdt": 'File Kind',
                "assn": 'Sort as',
                "clip": 'IP',
            },
            "ssnc": {"snam": "", "prgr": "",  "pfls": "", "pend": "", "prsm": "", "pbeg": "", "PICT": "", "mden": ""},
        }
        metadata={}
        if typ in p and code in p[typ]:
            metadata[p[typ][code] if p[typ][code] else code]=data
        if 'Title' in metadata and metadata['Title']:
            method(metadata['Title'])
        elif DEBUG:
            print('[meta]', metadata if metadata else data, flush=True)
    if DEBUG:
        print('[EOF]', flush=True)

def redirect(url='https://debian10', is_dedup=True):
    def func(s):
        global last_lyric
        if DEBUG:
            print('[lyrc]', s, flush=True)
        if last_lyric==s:
            return False
        else:
            last_lyric=s
        try:
            ssl._create_default_https_context = ssl._create_unverified_context
            request.urlopen(url+'/blive/?call:'+parse.quote('[LYRC] '+s))
        except Exception as e:
            handle(e)
    return func

def main(path='/tmp/shairport-sync-metadata', method=redirect()):
    global DEBUG
    if len(sys.argv)>1:
        if sys.argv[1].lower()=='debug':
            DEBUG=True
    print('--- '+('Start' if not DEBUG else 'Debug')+' at '+ctime()+' ---', flush=True)
    while True:
        try:
            with open(path) as f:
                get(f, method)
        except OSError as e:
            print('+30 '+repr(e), flush=True)
            sleep(30)
        except Exception as e:
            handle(e)
            break
    print('=  End  at '+ctime()+' =', flush=True)

if __name__ == '__main__':
    main()
