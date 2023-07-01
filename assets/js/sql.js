
async function SQL_load(db_file){
    console.log(db_file);
    const sqlPromise = initSqlJs({
        locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    let sqlFilePath = "/data/score.db";
    const dataPromise = fetch(sqlFilePath).then(res => res.arrayBuffer());
    const [SQL, buf] = await Promise.all([sqlPromise, dataPromise]).then();

    const db = new SQL.Database(db_file);
    userClear = [];

    let table_format;
    let query = "SELECT * FROM info";
    try{
        let res = db.exec(query);
        console.log(res);
        table_format = res ? 'oraja' : 'lr2';
        localStorage.setItem('tableFormat', table_format);
    }catch(err){
        table_format = 'lr2';
        localStorage.setItem('tableFormat', table_format);
    }

    console.log('Detected database format: ' + table_format);
    //beatoraja / LR2oraja のテーブル読み込み
    if(table_format == 'oraja'){
        for(let i = 0; i<songsTable.length; i++){
            let sha256 = songsTable[i][3];
            let query = "SELECT * FROM score WHERE sha256 in ('" + sha256 + "')";
            try{
                let res = db.exec(query);
                let contents = res[0].values[0];
                if(contents){
                    let mode = contents[1];
                    if(mode == 0){ //LNモード
                        let easy_clear = (contents[2] >= 4) ? 1 : 0;
                        let hard_clear = (contents[2] >= 6) ? 1 : 0;
                        let notes = contents[15];
                        let score = (contents[3] + contents[4]) * 2 + contents[5] + contents[6]
                        let score_rate = score / (notes * 2);
                        let aaa = (score_rate > 8/9) ? 1 : 0;
                        let miss_count  =contents[17];
                        let option = contents[22];
                        let clear_array = [easy_clear, hard_clear, aaa, Number(score_rate * 100).toFixed(2), miss_count, option];
                        songsTable[i][14] = clear_array.toString();
                        userClear.push([].concat(i, clear_array));
                        try{
                            let old_clear = localStorage.getItem(sha256);
                            old_clear = old_clear.split(',');
                            extract_new_clear(sha256, old_clear, clear_array);
                        }catch(err){
                            //console.log(err);
                        }
                        
                        localStorage.setItem(sha256, clear_array);
                        
                    }else{
                        localStorage.removeItem(sha256);
                    }
                }else{
                    localStorage.removeItem(sha256);
                }
            }catch(err){
                localStorage.removeItem(sha256);
            }
        }
    
    //LR2のデータ読み込み
    }else if(table_format == 'lr2'){
        for(let i = 0; i<songsTable.length; i++){
            let sha256 = songsTable[i][3];
            let md5 = songsTable[i][4];
            let query = "SELECT * FROM score WHERE hash in ('" + md5 + "')";
            try{
                let res = db.exec(query);
                let contents = res[0].values[0];
                if(contents){
                    let easy_clear = (contents[1] >= 2) ? 1 : 0;
                    let hard_clear = (contents[1] >= 4) ? 1 : 0;
                    let notes = contents[7];
                    let score = contents[2] * 2 + contents[3];
                    let score_rate = score / (notes * 2);
                    let aaa = (score_rate > 8/9) ? 1 : 0;
                    let miss_count  =contents[9];
                    let option = contents[21];
                    console.log(option);
                    let clear_array = [easy_clear, hard_clear, aaa, Number(score_rate * 100).toFixed(2), miss_count, option];
                    songsTable[i][14] = clear_array.toString();
                    userClear.push([].concat(i, clear_array));
                    try{
                        let old_clear = localStorage.getItem(sha256);
                        old_clear = old_clear.split(',');
                        extract_new_clear(sha256, old_clear, clear_array);
                    }catch(err){
                        //console.log(err);
                    }
                    localStorage.setItem(sha256, clear_array);
                }else{
                    localStorage.removeItem(sha256);
                }
            }catch(err){
                localStorage.removeItem(sha256);
            }
        }
    }

    //ユーザーの実力を計算
    const song_idx = userClear.map(item => item[0]);
    const user_clear_table = [].concat(userClear.map(item => item[1]), userClear.map(item => item[2]));
    const user_score_table = userClear.map(item => item[3]);

    let user_clear_level = 0;
    let user_score_level = 0;
    let D = 1.71;
    let user_clear_level_array = []
    let user_score_level_array = []
    for(let i=0; i < user_clear_table.length; i++){
        //console.log(songsTable[song_idx[Math.floor(i / 2)]]);
        let row_offset = i % 2 ? 1 : 0; //奇数: hard
        let table_idx = Math.floor(i / 2) + Math.floor(user_clear_table.length / 2) * row_offset;

        let _user_clear_level = user_clear_level;
        let _song_clear_level = Number(songsTable[song_idx[Math.floor(i / 2)]][5 + row_offset]);
        let _song_clear_disc = songsTable[song_idx[Math.floor(i / 2)]][8 + row_offset];
        
        let sigma_clear = calculate_probability(_user_clear_level, _song_clear_level, _song_clear_disc);
        sigma_clear = Math.max(1e-8, Math.min(sigma_clear, 1 - 1e-8));

        let diff_clear = - user_clear_table[table_idx] + sigma_clear;

        //勾配計算
        // let partial_song_clear_level = diff_clear * -1 * D * _song_clear_disc;
        let partial_user_clear_level = diff_clear * D * _song_clear_disc;
        
        //let partial_song_clear_disc = diff_clear * D * (_user_clear_level - _song_clear_level);
        
        //パラメータ更新
        user_clear_level -= (partial_user_clear_level - 1e-4 * _user_clear_level);
        /*
        console.log({
            'iter': i,
            'name' : songsTable[song_idx[Math.floor(i / 2)]][2],
            '_user_clear_level': _user_clear_level, 
            '_song_clear_level': _song_clear_level, 
            '_song_clear_disc': _song_clear_disc, 
            'sigma_clear': sigma_clear, 
            'diff_clear': diff_clear, 
            'user_clear': user_clear_table[i],
            'partial_user_clear_level': partial_user_clear_level,
            'user_clear_level': user_clear_level, 
        });
        */
        
        user_clear_level_array[i] = user_clear_level;
    }
    //console.log(calculate_probability(50, 50, 10));
    
    for(let i=0; i < user_score_table.length; i++){
        //console.log(songsTable[song_idx[Math.floor(i / 2)]]);

        let row_offset = i % 2 ? 1 : 0; //奇数: hard
        let _user_score_level = user_score_level;
        let _song_score_level = Number(songsTable[song_idx[Math.floor(i / 2)]][5 + row_offset]);
        let _song_score_disc = songsTable[song_idx[Math.floor(i / 2)]][8 + row_offset];
        
        let sigma_score = calculate_probability(_user_score_level, _song_score_level, _song_score_disc);
        sigma_score = Math.max(1e-8, Math.min(sigma_score, 1 - 1e-8));
        let diff_score = - user_score_table[i] + sigma_score;

        //勾配計算
        // let partial_song_score_level = diff_score * -1 * D * _song_score_disc;
        let partial_user_score_level = diff_score * D * _song_score_disc;
        //let partial_song_score_disc = diff_score * D * (_user_score_level - _song_score_level);
        
        //パラメータ更新
        user_score_level -= (partial_user_score_level - 1e-4 * _user_score_level);
        /*
        console.log({
            'iter': i,
            'name' : songsTable[song_idx[Math.floor(i / 2)]][2],
            '_user_score_level': _user_score_level, 
            '_song_score_level': _song_score_level, 
            '_song_score_disc': _song_score_disc, 
            'sigma_score': sigma_score, 
            'diff_score': diff_score, 
            'user_score': user_score_table[i],
            'partial_user_score_level': partial_user_score_level,
            'user_score_level': user_score_level, 
        });
        */
        user_score_level_array[i] = user_score_level;
    }
    //console.log(user_score_level_array);

    prevUserAbility = userAbility;
    userAbility = [user_clear_level, user_score_level];
    localStorage.setItem('prevUserAbility', prevUserAbility);
    localStorage.setItem('userAbility', userAbility);

    $('#clear-level').html(display_ability(userAbility[0], prevUserAbility[0]));
    $('#score-level').html(display_ability(userAbility[1], prevUserAbility[1]));

    $('body').css('--clear-level', Number(user_clear_level).toFixed(3) + '%');
    $('body').css('--score-level', Number(user_score_level).toFixed(3) + '%');

    new_clears_update();
    rerender_table(grid, songsTable);
    location.href = '#level'; 
}
