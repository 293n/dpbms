import requests
import pandas as pd
import re
import time
import json
import csv

def get_ir_page(md5, page):
    url = "http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?mode=ranking&page=" + page + "&bmsmd5=" + md5
    playerID_pattern = r'playerid\=([0-9]*)'
    print("get from: " + url)

    try:
        time.sleep(5)
        
        response = requests.get(url)
        response.raise_for_status()
        response.encoding = 'shift_jis'
        raw_table = pd.read_html(response.text, match='順位', extract_links='body')[0]
    except:
        return []
    ranking = []
    for i in range(len(raw_table)):
        if i % 2 == 0:
            clear = raw_table["クリア"][i][0]
            if 'FULLCOMBO' in clear or 'HARD' in clear:
                easy = 1
                hard = 1
            elif 'CLEAR' in clear or 'EASY' in clear:
                easy = 1
                hard = 0
            else:
                easy = 0
                hard = 0

            score = raw_table["ランク"][i][0]

            if 'AAA' in score:
                triple_a = 1
            else: 
                triple_a = 0
            playerID = re.search(playerID_pattern, raw_table["プレイヤー"][i][1])
            ranking.append([playerID.group(1), easy, hard, triple_a])
    return ranking

def get_ir(md5):
    page = 0
    ranking = []
    while(1):
        page = page + 1
        rank = get_ir_page(md5, str(page))
        if len(rank) == 0:
            break
        else:
            ranking = ranking + rank
    return ranking

with open('table.json', 'r', encoding="utf-8") as f:
    table = json.load(f)

for i in range(len(table)):
    print('getting table... ' + str(i+1) + '/' + str(len(table)))
    md5 = table[i]['md5']
    ir_data = get_ir(md5)
    with open('ir/' + md5 + '.csv', 'w') as f:
        writer = csv.writer(f, lineterminator='\n')
        writer.writerows(ir_data)