import pandas as pd
import numpy as np
import json

def sigmoid(x):
    return 1 / (1 + np.exp(- x))

def calculate_probability(theta, phi, a, D=1.71):
    """
    theta: ユーザの能力
    phi: 問題のむずかしさ
    a: 問題の識別度
    D: シグモイドの傾き. default = 1.71
    """
    z = D * a * (theta - phi)
    return sigmoid(z)

def objective(t, sigma):
    sigma = np.clip(sigma, a_min=1e-8, a_max=1 - 1e-8)
    return np.mean(t * np.log(sigma) + (1 - t) * np.log(1 - sigma))

#難易度表テーブル読み込み
with open('table.json', 'r', encoding="utf-8") as ft:
    diff_table = json.load(ft)

#コーステーブル読み込み
with open('course.json', 'r', encoding="utf-8") as fc:
    course_table = json.load(fc)
    
diff_table = diff_table + course_table

diff_table_dict = {}
for i in range(len(diff_table)):
    md5hash = diff_table[i]['md5']
    diff_table_dict[md5hash] = diff_table[i]



#クリアテーブル読み込み
clears = pd.read_csv('./data/clears.csv', header=0, index_col=0)
clears = clears.dropna(axis=0, how="any")
clears = clears.reset_index()
clears = clears.astype('int')

#スコアテーブル読み込み
scores = pd.read_csv('./data/scores.csv', header=0, index_col=0)
scores = scores.dropna(axis=0, how="any")
scores = scores.reset_index()
scores = scores.astype('int')


#ユーザー・譜面テーブル読み込み
user_table = pd.read_csv('./data/user_idx.csv', header=0, index_col=0)
song_table = pd.read_csv('./data/song_idx.csv', header=0, index_col=0)

user_num = user_table.shape[0]
song_num = song_table.shape[0]


#譜面の難しさ
song_clear_levels = np.zeros(shape=song_num)
song_score_levels = np.zeros(shape=int(song_num / 2))

#譜面の識別度
song_clear_disc = np.ones(shape=song_num)
song_score_disc = np.ones(shape=int(song_num / 2))

#ユーザーの地力
user_clear_levels = np.zeros(shape=user_num)
user_score_levels = np.zeros(shape=user_num)

D = 1.71

for step in range(50):
    print('Step:' + str(step+1))
    
    _user_clear_levels = clears['user'].map(user_clear_levels.__getitem__)
    _song_clear_levels = clears['song'].map(song_clear_levels.__getitem__)
    _song_clear_disc = clears['song'].map(song_clear_disc.__getitem__)

    _user_score_levels = scores['user'].map(user_score_levels.__getitem__)
    _song_score_levels = scores['song'].map(song_score_levels.__getitem__)
    _song_score_disc = scores['song'].map(song_score_disc.__getitem__)

    

    sigma_clear = calculate_probability(_user_clear_levels, _song_clear_levels, _song_clear_disc)
    sigma_clear = np.clip(sigma_clear.values, a_min=1e-8, a_max=1 - 1e-8)

    sigma_score = calculate_probability(_user_score_levels, _song_score_levels, _song_score_disc)
    sigma_score = np.clip(sigma_score.values, a_min=1e-8, a_max=1 - 1e-8)

    diff_clear = - clears['clear'] + sigma_clear
    diff_score = - scores['clear'] + sigma_score

    print(objective(clears['clear'], sigma=sigma_clear))
    print(objective(scores['clear'], sigma=sigma_score))
    
    #問題の難易度の勾配
    partial_song_clear_levels = diff_clear * -1 * D * _song_clear_disc
    partial_song_score_levels = diff_score * -1 * D * _song_score_disc

    #ユーザの能力の勾配
    partial_user_clear_levels = diff_clear * D * _song_clear_disc
    partial_user_score_levels = diff_score * D * _song_score_disc

    #問題の識別度の勾配
    partial_song_clear_disc = diff_clear * D * (_user_clear_levels - _song_clear_levels)
    partial_song_score_disc = diff_score * D * (_user_score_levels - _song_score_levels)

    #パラメータの更新
    user_clear_levels -= partial_user_clear_levels.groupby(clears['user']).mean().values  - 1e-8 * user_clear_levels
    song_clear_levels -= partial_song_clear_levels.groupby(clears['song']).mean().values - 1e-8 * song_clear_levels
    song_clear_disc -= partial_song_clear_disc.groupby(clears['song']).mean().values

    user_score_levels -= partial_user_score_levels.groupby(scores['user']).mean().values  - 1e-8 * user_score_levels
    song_score_levels -= partial_song_score_levels.groupby(scores['song']).mean().values - 1e-8 * song_score_levels
    song_score_disc -= partial_song_score_disc.groupby(scores['song']).mean().values

# song_clear_levelsの最小を0、最大を100に補正する
offset = song_clear_levels.min() * (-1)
song_clear_levels = song_clear_levels + offset 
user_clear_levels = user_clear_levels + offset
scale = 100 / song_clear_levels.max()#11

song_clear_levels = song_clear_levels * scale
user_clear_levels = user_clear_levels * scale
song_clear_disc = song_clear_disc / scale

# song_score_levelsの最小を0、最大を100に補正する
offset = song_score_levels.min() * (-1)
song_score_levels = song_score_levels + offset 
user_score_levels = user_score_levels + offset
scale = 100 / song_score_levels.max()

song_score_levels = song_score_levels * scale
user_score_levels = user_score_levels * scale
song_score_disc = song_score_disc / scale

# ユーザーの出力結果
user_levels_df = pd.DataFrame(user_clear_levels, index=user_table.values.reshape(1, -1)[0], columns=['clear ability'])
user_levels_df['score ability'] = user_score_levels

# 接頭辞e_削除
table_idx = np.char.replace(song_table.values.transpose()[0].tolist()[:int(len(song_clear_levels)/2)], 'e_', '')

#song_clear_disc_df = pd.DataFrame(song_clear_disc, index=song_table.values)

# 出力用テーブル
table_content = np.hstack(
    [
        song_clear_levels[:int(len(song_clear_levels)/2)].reshape(-1, 1),
        song_clear_levels[int(len(song_clear_levels)/2):].reshape(-1, 1),
        song_score_levels.reshape(-1, 1),
        song_clear_disc[:int(len(song_clear_disc)/2)].reshape(-1, 1),
        song_clear_disc[int(len(song_clear_disc)/2):].reshape(-1, 1),
        song_score_disc.reshape(-1, 1),
        np.zeros(shape=int(song_num / 2)).reshape(-1, 1),
        np.zeros(shape=int(song_num / 2)).reshape(-1, 1),
        np.zeros(shape=int(song_num / 2)).reshape(-1, 1),
        np.zeros(shape=int(song_num / 2)).reshape(-1, 1),
    ]
)
song_levels_df = pd.DataFrame(
    table_content,
    index=table_idx,
    columns=['easy', 'hard', 'AAA', 'easy discrimination', 'hard discrimination', 'AAA discrimination', 'easy recommend', 'hard recommend', 'AAA recommend', 'lamp']
)

song_info = pd.DataFrame(columns=['level', 'title', 'sha256'])
for i in range(song_levels_df.shape[0]):
    md5hash = song_levels_df.index[i]
    song_info.at[i, 'title'] = diff_table_dict[md5hash]['title']
    song_info.at[i, 'level'] = diff_table_dict[md5hash]['level']
    if('sha256' in diff_table_dict[md5hash]):
        song_info.at[i, 'sha256'] = diff_table_dict[md5hash]['sha256']
    else:
        song_info.at[i, 'sha256'] = 'no hash'

song_info = song_info.reset_index()
song_levels_df = song_levels_df.reset_index()
song_levels_df = song_levels_df.rename(columns={'index': 'md5'})

song_levels_df = pd.concat([song_info, song_levels_df], axis=1)

user_levels_df.to_csv('./output/user_levels.csv', encoding="utf_8_sig")
song_levels_df.to_csv('./output/song_levels.csv', index = False, encoding="utf_8_sig")
