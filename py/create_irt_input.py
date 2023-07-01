import pandas as pd
import numpy as np
import json
import csv
import os
import itertools


with open('table.json', 'r', encoding="utf-8") as ft:
    table = json.load(ft)

with open('course.json', 'r', encoding="utf-8") as fc:
    course = json.load(fc)

table = table + course

dir = os.listdir('./ir')
users = []
#IR取得データからユーザー一覧を作る
for i in range(len(dir)):
#for i in range(10):
    print('\r' + 'Creating user list: ' + str(i+1) + '/' + str(len(dir)) + ' ' +  dir[i], end="")
    with open('./ir/'+dir[i]) as f:
        csv_reader = csv.reader(f, delimiter=',')
        song_table = np.array([row for row in csv_reader])
        users = np.concatenate([users, song_table[:, 0]], 0)
print('')
users = list(set(users))
users = ['u_' + user for user in users]
#全ユーザーのEASY・HARDクリア状況テーブルを作る
songs = [song.replace('.csv', '') for song in dir]
clear_columns = ['e_' + song for song in songs]
clear_columns.extend(['h_' + song for song in songs])
score_columns = ['a_' + song for song in songs]

#print(type(users[0]))
#print(clear_columns)
nans = np.zeros((len(users), len(score_columns)))
nans[:,:] = np.nan
clears = pd.DataFrame(np.hstack([nans, nans]), users, clear_columns)
scores = pd.DataFrame(nans, users, score_columns)

for i in range(len(dir)):
#for i in range(10):
    print('\r' + 'Creating user/song table: ' + str(i+1) + '/' + str(len(dir)) + ' ' +  dir[i], end='')
    with open('./ir/'+dir[i]) as f:
        csv_reader = csv.reader(f, delimiter=',')
        song_table = np.array([row for row in csv_reader])
        song_hash = dir[i].replace('.csv', '')
        for k in range(len(song_table)):
            user_ID = 'u_' + song_table[k][0]
            clears.at[user_ID, 'e_' + song_hash] = song_table[k][1]
            clears.at[user_ID, 'h_' + song_hash] = song_table[k][2]
            scores.at[user_ID, 'a_' + song_hash] = song_table[k][3]
print('')
#ブラックリストのユーザーを削除
with open('./data/blacklist.csv') as f:
    blacklist = csv.reader(f, delimiter=',')
    users = np.array([row for row in blacklist])
    users = users[users != '']
    for i in range(len(users)):
        user = 'u_' + str(users[i])
        if user in clears.index.values:
            clears = clears.drop(index=user)
            scores = scores.drop(index=user)
            print('Dropped user: ' + user)

#プレイ曲数が規定数未満のプレイヤーを削除
threashold = 30 #規定数
drop_users = []
for i in range(clears.shape[0]):
    print('\r' + 'User decimate: '+str(i+1), end='')
    user_songs = clears.iloc[i, :]
    user_songs_num = user_songs.dropna(how='all').shape[0]
    if user_songs_num < threashold:
        user = clears.index.values[i]
        drop_users = drop_users + [user]
        print('')
        print('Dropped user: ' + user + '('+ str(user_songs_num) +')')
clears = clears.drop(index=drop_users)
scores = scores.drop(index=drop_users)
print('')

clears.to_csv('./data/clears_table.csv')
scores.to_csv('./data/scores_table.csv')

clears_column = pd.DataFrame(list(itertools.chain.from_iterable(clears.values.tolist())), columns=['clear'])
scores_column = pd.DataFrame(list(itertools.chain.from_iterable(scores.values.tolist())), columns=['clear'])

user_idx = clears.index
song_idx = clears.columns
user_num = len(user_idx)
song_num = len(song_idx)

user_idx = pd.DataFrame(user_idx)
user_idx.to_csv('./data/user_idx.csv')
song_idx = pd.DataFrame(song_idx)
song_idx.to_csv('./data/song_idx.csv')

clears_list = pd.DataFrame(columns=['user', 'song'])
clears_list_append = pd.DataFrame(
    np.hstack(
        [
            np.reshape(np.zeros(song_num), (song_num, 1)),
            np.reshape(np.array(range(song_num)),(song_num, 1))
        ]
    ), columns=['user', 'song']
)
scores_list = pd.DataFrame(columns=['user', 'song'])
scores_list_append = pd.DataFrame(
    np.hstack(
        [
            np.reshape(np.zeros(int(song_num/2)), (int(song_num/2), 1)),
            np.reshape(np.array(range(int(song_num/2))),(int(song_num/2), 1))
        ]
    ), columns=['user', 'song']
)

for i in range(clears.shape[0]):
#for i in range(3):
    print('\r' + 'Creating clear table for IRT: ' + str(i+1) + '/' + str(clears.shape[0]), end='')
    clears_list_append['user'] = i
    clears_list = pd.concat([clears_list, clears_list_append])
print('')

clears_list = clears_list.reset_index()

for i in range(scores.shape[0]):
    print('\r' + 'Creating score table for IRT: ' + str(i+1) + '/' + str(scores.shape[0]), end='')
    scores_list_append['user'] = i
    scores_list = pd.concat([scores_list, scores_list_append])
print('')
scores_list = scores_list.reset_index()

print(clears_list)
print(clears_column)
print(scores_list)
print(scores_column)

clears_list_out = pd.concat([clears_list, clears_column], axis=1)
scores_list_out = pd.concat([scores_list, scores_column], axis=1)

clears_list_out.to_csv('./data/clears.csv')
scores_list_out.to_csv('./data/scores.csv')