import pandas as pd
import numpy as np
import json
import csv


#難易度表テーブル読み込み
with open('table.json', 'r', encoding="utf-8") as ft:
    diff_table = json.load(ft)
#md5をキーとするdictに変換
diff_table_dict = {}
for i in range(len(diff_table)):
    md5hash = diff_table[i]['md5']
    diff_table_dict[md5hash] = diff_table[i]


#IRT出力結果読み込み
table = pd.read_csv('./output/song_levels.csv', header=0, index_col=0)

#EASY
output = []
for i in range(51):
    lower = i * 2.0
    upper = (i + 1) * 2.0
    idx = table[(table['easy'] >= lower) & (table['easy'] < upper)].index.tolist()
    for k in range(len(idx)):
        md5hash = table.iloc[idx[k], :]['md5']
        if len(md5hash) > 10: #段位はスルー
            song = diff_table_dict[md5hash]
            song['title'] = table.iloc[idx[k], :]['level'] + ' ' + table.iloc[idx[k], :]['title']
            song['level'] = round(lower, 1)
            song_reform = {
                'md5': song['md5'],
                'level': song['level'],
                'title': song['title'],
                'artist': song['artist']
            }
            output.append(song_reform)

with open('./difficulty/easy_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=4, ensure_ascii=False)

#HARD
output = []
for i in range(51):
    lower = i * 2.0
    upper = (i + 1) * 2.0
    idx = table[(table['hard'] >= lower) & (table['hard'] < upper)].index.tolist()
    for k in range(len(idx)):
        md5hash = table.iloc[idx[k], :]['md5']
        if len(md5hash) > 10: #段位はスルー
            song = diff_table_dict[md5hash]
            song['title'] = table.iloc[idx[k], :]['level'] + ' ' + table.iloc[idx[k], :]['title']
            song['level'] = round(lower, 1)
            song_reform = {
                'md5': song['md5'],
                'level': song['level'],
                'title': song['title'],
                'artist': song['artist']
            }
            output.append(song_reform)

with open('./difficulty/hard_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=4, ensure_ascii=False)

#AAA
output = []
for i in range(51):
    lower = i * 2.0
    upper = (i + 1) * 2.0
    idx = table[(table['AAA'] >= lower) & (table['AAA'] < upper)].index.tolist()
    for k in range(len(idx)):
        md5hash = table.iloc[idx[k], :]['md5']
        if len(md5hash) > 10: #段位はスルー
            song = diff_table_dict[md5hash]
            song['title'] = table.iloc[idx[k], :]['level'] + ' ' + table.iloc[idx[k], :]['title']
            song['level'] = round(lower, 1)
            song_reform = {
                'md5': song['md5'],
                'level': song['level'],
                'title': song['title'],
                'artist': song['artist']
            }
            output.append(song_reform)

with open('./difficulty/aaa_data.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=4, ensure_ascii=False)

