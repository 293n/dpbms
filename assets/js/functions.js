const clipboard_copy = text =>{
    if( !navigator.clipboard ) {
        alert("クリップボードにコピーできませんでした");return false;
    }
    navigator.clipboard.writeText(text).then(
        ()=>alert("クリップボードにコピーしました"),
        ()=>alert("クリップボードにコピーできませんでした")
    );
    return true;
};


function calculate_probability(theta, phi, a, D=1.71){
    let z = D * a * (theta - phi);
    return sig(z);
}

function sig(x){
    return 1 / (1 + Math.exp(- x));
}

function display_ability(cur_value, prev_value){

    cur_value = Number(cur_value);
    prev_value = Number(prev_value);

    let output = Number(cur_value).toFixed(3);
    output += '<small>(';
    if(cur_value >= prev_value){
        output += '+' + (cur_value - prev_value).toFixed(3);
    }else{
        output += (cur_value - prev_value).toFixed(3);
    }
    output += ')</small>'

    return output;
}


function tableAddFolder(folderName, songIdx, array, table){
    table["folder"] = table["folder"].concat({
        "class": "bms.player.beatoraja.TableData$TableFolder",
        "name": folderName,
        "songs": []
    });
    let folderIdx = table["folder"].length - 1;

    for(let i=0; i<songIdx.length; i++){
        let song = array[songIdx[i]][Object.keys(array[songIdx[i]])[0]];
        table["folder"][folderIdx]["songs"][i] = {
            "class": "bms.player.beatoraja.song.SongData",
            "title": song["title"],
            "sha256": song["sha256"]
        }
    }
    return table;
}


function csvSplit(line) {
    var c = "";
    var s = new String();
    var data = new Array();
    var singleQuoteFlg = false;

    for (var i = 0; i < line.length; i++) {
        c = line.charAt(i);
        if (c == "," && !singleQuoteFlg) {
            data.push(s.toString());
            s = "";
        } else if (c == "," && singleQuoteFlg) {
            s = s + c;
        } else if (c == '"') {
            singleQuoteFlg = !singleQuoteFlg;
        } else {
            s = s + c;
        }
    }
    return data;
}

function calc_dist(phi, a, D=1.71, sampling=25, max_y = 1){
    //定義域
    let min_x = 0;
    let max_x = 100;
    let probability = [];
    let theta = 0;
    for(let i = 0; i * max_x / sampling < max_x; i++){
        theta = i * max_x / sampling;
        probability[i] = sigmoid(D * a * (theta - phi)) * max_y;
    }
    return probability;
}


function sigmoid(x){
    return 1 / (1 + Math.exp(- x))
}

function extract_new_clear(sha256, old_array, new_array){
    let clear_type = ['Easy', 'Hard', 'AAA'];
    for(let i=0; i < clear_type.length; i++){
        if(parseInt(old_array[i]) == 0 && new_array[i] == 1){
            
            let idx = i + '_' + sha256;
            let new_line = {};
            new_line[idx] = {};
            new_line[idx]['clear'] = clear_type[i];
            let song_info = songsTable[songsTable.map(item => item[3]).indexOf(sha256)];
            
            new_line[idx]['title'] = song_info[2];
            new_line[idx]['level'] = level_reformat(song_info[1]);
            new_line[idx]['value'] = Number(song_info[5 + i]).toFixed(3);

            let new_clear;
            try{
                new_clear = JSON.parse(localStorage.getItem('newClears'));
                console.log(new_clear);
                new_clear = Object.assign(new_clear, new_line);
                localStorage.setItem('newClears', JSON.stringify(new_clear));
            }catch(err){
                console.log(err);
                new_clear = new_line;
                localStorage.setItem('newClears', JSON.stringify(new_clear));
            }
        }
    }
}

function new_clears_update(){
    try{
        let new_clears = JSON.parse(localStorage.getItem('newClears'));
        $('.l-new-clear').empty();
        for(const [song, array] of Object.entries(new_clears)){
            try{
                let info = song.split('_');
                let star;
                if(info[0] > 1){
                    if(array['value'] >= Number(prevUserAbility[1]) + 2){
                        star = 'l-new-clear--star';
                    }
                }else{
                    if(array['value'] >= Number(prevUserAbility[0]) + 2){
                        star = 'l-new-clear--star';
                    }
                }
                let wrap = `
                    <div class="l-new-clear__wrapper ${star}" data-clear-type="${info[0]}" data-sha256="${info[1]}" style="--value: ${(100 - Number(array['value'])) * 1.8}">
                        <div class="l-new-clear__clear">${array['clear']}</div>
                        <div class="l-new-clear__level">${array['level']}</div>
                        <h3 class="l-new-clear__title">${array['title']}</h3>
                        <div class="l-new-clear__value">${array['value']}</div>
                    </div>
                `;
                $('.l-new-clear').append(wrap);
            }catch(err){
                console.log(err);
            }
        }
    }catch(err){
        console.log(err);
    }
}

function bingo_update(bingo_list){
    let i = 0;
    $('.l-bingo__wrapper').empty();
    for(let idx in bingo_list){

        let key = Object.keys(bingo_list[idx]);
        let array = bingo_list[idx][key[0]];
        let target = $('.l-bingo').children().eq(i);
        
        let song_info = songsTable[songsTable.map(item => item[3]).indexOf(array['sha256'])];
        let clear_type = (array['clear'] == "Easy" ? 0 : (array['clear'] == "Hard" ?  1 : 2));
        let clear_array = song_info[14];

        //let array = bingo_list[key];
        /*
        let array = bingo_list[key];
        let target = $('.l-bingo').children().eq(i);
        let song_info = songsTable[songsTable.map(item => item[3]).indexOf(array['sha256'])];
        let clear_type = (array['clear'] == "Easy" ? 0 : (array['clear'] == "Hard" ?  1 : 2));
        let clear_array = song_info[14];
        */
        if(clear_array != null){
            clear_array = clear_array.split(',');
        }else{
            clear_array = ['0', '0', '0'];
        }
        $(target).html(`
            <div class="l-bingo__info" data-id="${key}" data-json="${encodeURIComponent(JSON.stringify(array))}" data-clear="${clear_array[clear_type] == '1' ? 1 : 0}"></div>
            <div class="l-bingo__level">${array['level']}</div>
            <div class="l-bingo__title">${array['title']}</div>
            <div class="l-bingo__clear" data-clear-type="${clear_type}">${array['clear']}</div>
            <div class="l-bingo__value" style="--value: ${(100 - array['value']) * 1.8}">${array['value']}</div>
            <div class="l-bingo__recommend">${Number(array['recommend']).toFixed(1)}%</div>
        `);
        i++;
    }
}

function storeJsonToStorage(key, data, upper_bound=Infinity){
    console.log(upper_bound);
    try{
        let array = JSON.parse(localStorage.getItem(key));
        if(Object.keys(array).length < upper_bound){
            array = array.concat(data);
            //array = Object.assign(array, data);
            localStorage.setItem(key, JSON.stringify(array));
        }else{
            console.log(Object.keys(array).length);
            console.log('bounded: ' + upper_bound);
        }
    }catch(err){
        localStorage.setItem(key, '[]');
        let array = JSON.parse(localStorage.getItem(key));
        array = array.concat(data);
        //array = Object.assign(array, data);
        localStorage.setItem(key, JSON.stringify(array));
    }
}

function level_format(str){
    if(str.includes('?')){
        str = 'is_99';

    }else if(str.includes('段')){
        str = 'class';
    }else if(str.includes('★★' || str.includes('st'))){
        str = str.replace(/[0-9]/g, '')
        .replace('★★', 'oj') + '-' + ('00' + str.replace(/[^0-9]/g, '')).slice(-2);
    }else{
        str = str.replace('?', '99')
        .replace(/[0-9]/g, '')
        .replace('★', 'is') + '_' + ('00' + str.replace(/[^0-9]/g, '')).slice(-2);
    }
    return str;
}

function level_reformat(str){
    if(str.includes('?')){
        str = '★?';
    }else if(str.includes('class')){
        str = '段';
    }else{
        str = str.replace('is', '★')
                .replace('oj', '★★')
                .replace('_', '')
                .replace('-', '')
                .replace(/[0-9]/g, '') + Number(str.replace('_', '').replace(/[^0-9]/g, ''));
    }
    return str;
}

function extract_play_option(table_format, option){
    let option_str = ['', '', ''];
    if(table_format == 'oraja'){
        let option_array = [Math.floor(option / 100), option % 10, Math.floor(option / 10) % 10]; //[FLIP, 1P, 2P]

        if(option_array[0] == 1){
            option_str[0] = 'FLIP ';
        }
        //1P
        switch(option_array[1]){
            case 0:
                option_str[1] = '-';
                break;
            case 1:
                option_str[1] = 'MIR';
                break;
            case 2:
                option_str[1] = 'RAN';
                break;
            case 3:
                option_str[1] = 'R-RAN';
                break;
            case 4:
                option_str[1] = 'S-RAN';
                break;
        }
        //2P
        switch(option_array[2]){
            case 0:
                option_str[2] = '-';
                break;
            case 1:
                option_str[2] = 'MIR';
                break;
            case 2:
                option_str[2] = 'RAN';
                break;
            case 3:
                option_str[2] = 'R-RAN';
                break;
            case 4:
                option_str[2] = 'S-RAN';
                break;
        }
        return option_str[0] + option_str[1] + ' / ' + option_str[2];
    }else if(table_format == 'lr2'){
        let option_array = [Math.floor(option / 100), Math.floor(option / 10) % 10, option % 10]; //[FLIP, 1P, 2P]


        if(option_array[0] == 1){
            option_str[0] = 'FLIP ';
        }
        //1P
        switch(option_array[1]){
            case 0:
                option_str[1] = '-';
                break;
            case 1:
                option_str[1] = 'MIR';
                break;
            case 3:
                option_str[1] = 'RAN';
                break;
            case 4:
                option_str[1] = 'S-RAN';
                break;
        }
        //2P
        switch(option_array[2]){
            case 0:
                option_str[2] = '-';
                break;
            case 1:
                option_str[2] = 'MIR';
                break;
            case 3:
                option_str[2] = 'RAN';
                break;
            case 4:
                option_str[2] = 'S-RAN';
                break;
        }
    }
    return '';
}

//テーブルを絞り込む
function songs_table_filter(table, option){
    let output_table;
    if(option['level'].length){
        output_table = songs_table_filter_level(table, option['level'])
    }
    if(option['clear'].easy == false){
        output_table = songs_table_filter_clear(output_table, 0);
    }
    if(option['clear'].hard == false){
        output_table = songs_table_filter_clear(output_table, 1);
    }
    if(option['clear'].aaa == false){
        output_table = songs_table_filter_clear(output_table, 2);
    }
    if(option['clear'].failed == false){
        output_table = songs_table_filter_failed(output_table);
    }
    if(option['clear'].noplay == false){
        output_table = songs_table_filter_noplay(output_table);
    }
    if(!(option['recommend'].easy[0] == 0 && option['recommend'].easy[1] == 100)){
        output_table = songs_table_filter_recommend(output_table, 0, option['recommend'].easy);
    }
    if(!(option['recommend'].hard[0] == 0 && option['recommend'].hard[1] == 100)){
        output_table = songs_table_filter_recommend(output_table, 1, option['recommend'].hard);
    }
    if(!(option['recommend'].aaa[0] == 0 && option['recommend'].aaa[1] == 100)){
        output_table = songs_table_filter_recommend(output_table, 2, option['recommend'].aaa);
    }
    console.log(songs_table_filter.length);
    return output_table;
}

//level
function songs_table_filter_level(table, option){
    output_table = table.filter((row)=>{
        return option.includes(row[1]);
    });
    return output_table;
}

function songs_table_filter_clear(table, clear){ //clear: 0 easy 1 hard 2 aaa
    return table.filter((row)=>{
        try{
            if(row[14] != null){
                let stats = row[14].split(',');
                return stats[clear] == '0';
            }else{
                return 1;
            }
        }catch{
            return 1;
        }
    });
}


//failed
function songs_table_filter_failed(table){
    return table.filter((row)=>{
        try{
            if(row[14] != null){
                return row[14][0] == 1;
            }else{
                return 1;
            }
        }catch{
            return 1;
        }
    });
}

//noplay
function songs_table_filter_noplay(table){
    return table.filter((row)=>{
        try{
            if(row[14] == null){
                return 0;
            }else{
                return 1;
            }
        }catch{
            return 1;
        }
    });
}

//recommend
function songs_table_filter_recommend(table, clear, range){
    return table.filter((row)=>{
        return row[11+clear] >= range[0] && row[11+clear] <= range[1];
    });
}

//テーブルの再描画
function rerender_table(table, new_table){
    table.updateConfig({
        data: new_table,
    }).forceRender();
}

//レンジスライダー
function init_range_slider(target, range){
    $(target).ionRangeSlider({
        type: "double",
        min: 0,
        max: 100,
        from: range[0],
        to: range[1],
        grid: true,
        onChange: (data)=>{
            let id = $(data.input).attr('id');
            let range = [data.from, data.to];
            localStorage.setItem(id, range);
        },
    });
}

