import requests
import json
import time
import re

sl_table = requests.get('https://stellabms.xyz/dp/score.json').json()
is_table = requests.get('http://dpbmsdelta.web.fc2.com/table/data/insane_data.json').json()
oj_table = requests.get('http://ereter.net/static/analyzer/json/overjoy.json').json()

for i in range(len(sl_table)):
    sl_table[i]["level"] = "sl" + sl_table[i]["level"]
for i in range(len(is_table)):
    is_table[i]["level"] = "★" + is_table[i]["level"]
for i in range(len(oj_table)):
    oj_table[i]["level"] = "★★" + oj_table[i]["level"]

#table = dict({sl_table, is_table, oj_table})
table = sl_table + is_table + oj_table

for i in range(len(table)):
    print(i)
    if not 'sha256' in table[i]:
        try:
            url = 'https://cinnamon.link/charts/' + table[i]['md5']
            response = requests.get(url)
            sha256  = re.findall(r'\"https\:\/\/mocha\-repository\.info\/song\.php\?sha256\=(.*?)\"', response.text)[0]
            table[i]['sha256'] = sha256
            time.sleep(5)
        except:
            print('hash error')
            table[i]['sha256'] = 'hash error'

fw = open('table.json', 'w', encoding='utf-8')
json.dump(table, fw, indent=4, ensure_ascii=False)