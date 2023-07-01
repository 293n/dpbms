
$(()=>{
    $(window).on('scroll', function(){
        let window_pos = $(window).scrollTop();
        let window_height = $(window).height();
        let table_pos = $('#grid-table').offset().top;
        let table_height = Math.max($('#grid-table').height(), 1000);
        if(window_pos + window_height / 2 >= table_pos && window_pos + window_height / 2 <= table_pos + table_height){
            $('.p-table-option').addClass('p-table-option--active');
        }else{
            $('.p-table-option').removeClass('p-table-option--active');
        }
    });

    //StorageのtableFormat読み込み
    tableFormat = localStorage.getItem('tableFormat');

    //Storageのユーザーの能力値読み込み
    try{
        userAbility = localStorage.getItem('userAbility').split(',');
        prevUserAbility = localStorage.getItem('prevUserAbility').split(',');
        $('body').css('--clear-level', Number(userAbility[0]).toFixed(3) + '%');
        $('body').css('--score-level', Number(userAbility[1]).toFixed(3) + '%');
        
        $('#clear-level').html(display_ability(userAbility[0], prevUserAbility[0]));
        $('#score-level').html(display_ability(userAbility[1], prevUserAbility[1]));
    }catch(err){
        userAbility = [0.0, 0.0];
        prevUserAbility = [0.0, 0.0];
        $('body').css('--clear-level', Number(userAbility[0]).toFixed(3) + '%');
        $('body').css('--score-level', Number(userAbility[1]).toFixed(3) + '%');

        $('#clear-level').html(display_ability(userAbility[0], prevUserAbility[0]));
        $('#score-level').html(display_ability(userAbility[1], prevUserAbility[1]));
    }

    // 新規クリア
    new_clears_update();

    //ファイルからDB読み込みイベントリスナー
    $('#score_db').on('change', async function(){
        //StorageのnewClearsリセット
        localStorage.setItem('newClears', '{}');

        const f = this.files[0];
        const r = new FileReader();
        r.onload = await function(){
            const Uints = new Uint8Array(r.result);
            SQL_load(Uints);
        }
        r.readAsArrayBuffer(f);
    });

    //CSV取得
    const response = fetch("./output/song_levels.csv", {
        method: "GET",
    })
    .then(
        response => {
            let headers = response.headers;
            let lastModified = "";
            //　更新日時を取得（GMT）
            for (var pair of headers.entries()) {
                if (pair[0] === "last-modified") {
                    lastModified = pair[1];
                }
            }
            $('#last-update').text('last update: ' + lastModified);
            return response.text()
        }
    )
    .then(text => {
        dataLines = text.split(/\r\n|\n/);
        
        let columns = csvSplit(dataLines[0] + ',');
        let line;
        // songTable[:][0]: index
        // songTable[:][1]: level
        // songTable[:][2]: title
        // songTable[:][3]: md5
        // songTable[:][4]: sha256
        // songTable[:][5]: easy level
        // songTable[:][6]: hard level
        // songTable[:][7]: AAA level
        // songTable[:][8]: easy discrimination
        // songTable[:][9]: hard discrimination
        // songTable[:][10]: AAA discrimination
        // songTable[:][11]: easy recommend
        // songTable[:][12]: hard recommend
        // songTable[:][13]: AAA recommend
        // songTable[:][14]: clear array [(easy), (hard), (AAA)]

        for(let i = 1; i < dataLines.length - 1; i++){
            line = csvSplit(dataLines[i] + ' ,');
            songsTable[i-1] = line;
            songsTable[i-1][1] = level_format(songsTable[i-1][1]);
            songsTable[i-1][5] = ('0000000' + Number(songsTable[i-1][5]).toFixed(3)).slice(-7);
            songsTable[i-1][6] = ('0000000' + Number(songsTable[i-1][6]).toFixed(3)).slice(-7);
            songsTable[i-1][7] = ('0000000' + Number(songsTable[i-1][7]).toFixed(3)).slice(-7);
            
            songsTable[i-1][11] = ('0000000' + Number((calculate_probability(userAbility[0], songsTable[i-1][5], songsTable[i-1][8])) * 100).toFixed(3)).slice(-7);
            songsTable[i-1][12] = ('0000000' + Number((calculate_probability(userAbility[0], songsTable[i-1][6], songsTable[i-1][9])) * 100).toFixed(3)).slice(-7);
            songsTable[i-1][13] = ('0000000' + Number((calculate_probability(userAbility[1], songsTable[i-1][7], songsTable[i-1][10])) * 100).toFixed(3)).slice(-7);
            
            
            songsTable[i-1][14] = localStorage.getItem(songsTable[i-1][3]);
        }
        
        grid = new window.Grid(gridOption).render(document.getElementById('grid-table'));
        //ビンゴ追加
        grid.on('cellClick', (e, cell, cell_option, row)=>{
            console.log(this);
            if(e.shiftKey){
                let song_info = {};
                let id = cell.id;
                song_info[id] = {};
                song_info[id]['clear'] = cell_option['name'];
                song_info[id]['sha256'] = row.cells[3].data;
                song_info[id]['level'] = level_reformat(row.cells[1].data);
                song_info[id]['title'] = row.cells[2].data;
                if(song_info[id]['clear'] == 'Easy'){
                    song_info[id]['value'] = Number(row.cells[5].data).toFixed(3);
                    song_info[id]['recommend'] = Number(row.cells[11].data).toFixed(11);
                }else if(song_info[id]['clear'] == 'Hard'){
                    song_info[id]['value'] = Number(row.cells[6].data).toFixed(3);
                    song_info[id]['recommend'] = Number(row.cells[12].data).toFixed(12);
                }else if(song_info[id]['clear'] == 'AAA'){
                    song_info[id]['value'] = Number(row._cells[7].data).toFixed(3);
                    song_info[id]['recommend'] = Number(row.cells[13].data).toFixed(13);
                }
                console.log(song_info[id]['value']);
                if(song_info[id]['value'] != null){
                    storeJsonToStorage('bingoList', song_info, 25);
                    let bingo_list = JSON.parse(localStorage.getItem('bingoList'));
                    bingo_update(bingo_list);
                }
            }
        });
        //ビンゴ読み込み
        try{
            let bingo_list = JSON.parse(localStorage.getItem('bingoList'));
            bingo_update(bingo_list);
        }catch(err){
            console.log(err);
        }

        //ドラッグイベントハンドラ登録

    }).then(()=>{
        // 検索オプションUI作成
        let levels = songsTable.map(item => item[1]).filter((elm, idx, self)=>{
            return self.indexOf(elm) === idx;
        }).sort();
        for(const str of levels){
            let prefix, level;
            [prefix, level] = str.split(/_|-/);
            
            if(!level){
                level = prefix;
                prefix = 'other';
            }
            let wrapper = $('.p-table-option--level--container').find(`[id^='${prefix}_wrapper']`);
            if(wrapper.length == 0){
                $('.p-table-option--level--container').append(`
                    <div class="p-table-option--level--wrapper" id="${prefix}_wrapper">
                        <label for="${prefix}_all">
                            <input type="checkbox" name="${prefix}_all" id="${prefix}_all" checked data-save>
                            <span>${level_reformat(prefix).replace(/[.0-9]/, '')}</span>
                        </label>
                        <label for="${str}">
                            <input type="checkbox" name="${str}" id="${str}" checked data-level-ref data-save>
                            <span>${Number(level) ? Number(level) : level_reformat(level)}</span>
                        </label>
                    </div>
                `);
            }else{
                $(`[id="${prefix}_wrapper"]`).append(`
                    <label for="${str}">
                        <input type="checkbox" name="${str}" id="${str}" checked data-level-ref data-save>
                        <span>${Number(level)}</span>
                    </label>
                `);
            }
        }

        //絞り込みボタンクリック時
        $('#table-rerender').on('click', function(){
            let filter_option = {};
            let levels = [];
            $('[data-level-ref]:checked').each((idx, elm)=>{
                levels.push($(elm).attr('id'));
            });
            filter_option['level'] = levels;
            filter_option['clear'] = {
                easy: $('#lamp-easy').prop('checked'),
                hard: $('#lamp-hard').prop('checked'),
                aaa: $('#lamp-aaa').prop('checked'),
                failed: $('#lamp-failed').prop('checked'),
                noplay: $('#lamp-noplay').prop('checked'),
            };

            filter_option['recommend'] = {
                easy: $('#easy-recommend-range').val().split(';').map(item => parseInt(item)),
                hard: $('#hard-recommend-range').val().split(';').map(item => parseInt(item)),
                aaa: $('#aaa-recommend-range').val().split(';').map(item => parseInt(item)),
            }

            console.log(filter_option);
            let songs_table_filtered = songs_table_filter(songsTable, filter_option);
            rerender_table(grid, songs_table_filtered);
            //移動
            $(window).scrollTop($('#grid-table').offset().top);
        });

        //全てチェック on/off
        $(document).on('change', 'input[id $= "_all"]', (e)=>{
            let elm = $(e.target);
            let prefix = elm.attr('id').split(/_|-/)[0];
            let checked = elm.prop('checked');
            elm.parent().siblings().each((idx, elm)=>{
                let checkbox =  $(elm).find('input[type="checkbox"]');
                checkbox.prop('checked', checked);
                localStorage.setItem(checkbox.attr('id'), checked);
            });
        });

        //入力状態保存
        $(document).on('change', 'input[data-save]', function(){
            let key = $(this).attr('name');
            let value = $(this).prop('checked');
            localStorage.setItem(key, value);
        });

        //入力状態読み込み
        $('input[data-save]').each(function(){
            let id = $(this).attr('id');
            try{
                let state = localStorage.getItem(id) == 'true' || localStorage.getItem(id) == null;
                $(this).prop('checked', state);
            }catch(err){
                console.log(err);
                $(this).prop('checked', true);
            }
        });

        //スライダー
        $('[id$="-range"').each((idx, elm)=>{
            let id = $(elm).attr('id');
            let range = [0, 100];
            try{
                if(localStorage.getItem(id)){
                    range = localStorage.getItem(id).split(',').map(item => parseInt(item));
                }else{
                    localStorage.setItem(id, range);
                }
            }catch{
                localStorage.setItem(id, range);
            }
            init_range_slider('#' + id, range);
        });
    });

    //bingo関連

    $(document).on('mouseover', '[data-style="c-table--num"]', function(e){
        if(e.shiftKey){
            $(this).css({
                'background-color': '#eeeebb',
                'cursor': 'pointer',
            });
        }
    });
    $(document).on('mouseout', '[data-style="c-table--num"]', function(e){
        $(this).css({
            'background-color': '',
            'cursor': '',
        });
    });

    let listWithHandle = document.getElementById('listWithHandle');
    let sortable = Sortable.create(listWithHandle, {
        animation: 300,
        invertSwap: true,
        //順番変更
        onSort: function(e){
            let array = [];
            $('.l-bingo').find('[data-id]').each((idx, elm)=>{
                let id = $(elm).attr('data-id');
                array[idx] = {};
                array[idx][id] = {};
                array[idx][id] = JSON.parse(decodeURIComponent($(elm).attr('data-json')));
            });
            localStorage.setItem('bingoList', JSON.stringify(array));
        }
    });
    //削除
    $('.l-bingo__wrapper').on('click', function(e){
        if(e.shiftKey){
            $(this).empty();
            let array = [];
            $('.l-bingo').find('[data-id]').each((idx, elm)=>{
                let id = $(elm).attr('data-id');
                console.log(idx);
                array[idx] = {};
                array[idx][id] = {};
                array[idx][id] = JSON.parse(decodeURIComponent($(elm).attr('data-json')));
            });
            localStorage.setItem('bingoList', JSON.stringify(array));
        }
    });

    //bingo のシャッフル
    $('.l-bingo__btn--shuffle').on('click', function(){
        try{
            let array = JSON.parse(localStorage.getItem('bingoList'));
    
            let idx = [...Array(Object.keys(array).length).keys()];
            let new_idx = idx.slice().sort(()=>Math.random()-Math.random());

            let new_array = [];
            for(let i = 0; i < new_idx.length; i++){
                new_array[i] = array[new_idx[i]];
            }
            localStorage.setItem('bingoList', JSON.stringify(new_array));
            bingo_update(new_array);
            console.log(new_array);
        }catch{

        }
    });

    //bingo の保存

    $('.l-bingo__btn--backup').on('click', function(){
        try{
            let array = JSON.parse(localStorage.getItem('bingoList'));

            console.log(array.length);
            const blob = new Blob([JSON.stringify(array, null, '    ')], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const name = 'bingo.json';
            link.setAttribute('href', url);
            link.setAttribute('download', name);
            
            console.log(blob);
            link.click();
        }catch(err){
            console.log(err);
        }
    })

    //bingoの復元
    $('#bingo-upload').on('change', function(e){
        const f = this.files[0];
        const r = new FileReader();
        r.onload = function(e){
            let array = JSON.parse(e.target.result.replace('[object Object]', ''));
            localStorage.setItem('bingoList', JSON.stringify(array));
            bingo_update(array);
        }
        r.readAsText(f);
    });
    
    //bingoのクリア
    $('.l-bingo__btn--clear').on('click', function(){
        let array = [];
        localStorage.setItem('bingoList', array);
        bingo_update(array);
    });

    //bingoのテーブル出力
    $('.l-bingo__btn--table').on('click', function(){
        if($('.l-bingo__wrapper').length == 25){
            let date = new Date;
            const date_offset = date.getTimezoneOffset()
            date = new Date(date.getTime() - (date_offset*60*1000));
            let date_str = date.toISOString().split('T')[0];
            let folder_name = window.prompt('テーブルの名前を入力してください。', 'BINGO' + date_str);

            if(!folder_name){
                return;
            }
            let array = [];
            array = JSON.parse(localStorage.getItem('bingoList'));
            console.log(array);

            let table = {
                "name": folder_name,
                "folder": [

                ]
            };
            
            let allIdx = [...Array(Object.keys(array).length).keys()];

            let easyIdx = [];
            let hardIdx = [];
            let aaaIdx = [];

            for(let i=0; i<allIdx.length; i++){
                let song = array[i][Object.keys(array[i])[0]];
                console.log(song["clear"]);
                switch(song["clear"]){
                    case 'Easy':
                        easyIdx = easyIdx.concat(i);
                        break;
                    case 'Hard':
                        hardIdx = hardIdx.concat(i);
                        break;
                    case 'AAA':
                        aaaIdx = aaaIdx.concat(i);
                        break;
                    default:
                        console.log('error');
                        break;
                }
            }

            table = tableAddFolder('ALL SONGS', allIdx, array, table);
            table = tableAddFolder('EASY', easyIdx, array, table);
            table = tableAddFolder('HARD', hardIdx, array, table);
            table = tableAddFolder('AAA', aaaIdx, array, table);
            table = tableAddFolder('1st ROW',[0, 1, 2, 3, 4], array, table);
            table = tableAddFolder('2nd ROW',[5, 6, 7, 8, 9], array, table);
            table = tableAddFolder('3rd ROW',[10, 11, 12, 13, 14], array, table);
            table = tableAddFolder('4th ROW',[15, 16, 17, 18, 19], array, table);
            table = tableAddFolder('5th ROW',[20, 21, 22, 23, 24], array, table);
            table = tableAddFolder('1st COLUMN',[0, 5, 10, 15, 20], array, table);
            table = tableAddFolder('2nd COLUMN',[1, 6, 11, 16, 21], array, table);
            table = tableAddFolder('3rd COLUMN',[2, 7, 12, 17, 22], array, table);
            table = tableAddFolder('4th COLUMN',[3, 8, 13, 18, 23], array, table);
            table = tableAddFolder('5th COLUMN',[4, 9, 14, 19, 24], array, table);
            table = tableAddFolder('DIAGONAL',[0, 6, 12, 18, 24], array, table);
            table = tableAddFolder('ANTI DIAGONAL',[4, 8, 12, 16, 20], array, table);
            console.log(table);

            console.log(JSON.stringify(table));
            const blob = new Blob([JSON.stringify(table)], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            console.log(url);
            const name = `${folder_name}.json`;
            link.setAttribute('href', url);
            link.setAttribute('download', name);
            
            console.log(blob);
            link.click();
        }
    });

 
    //クリックによるコピー
    $('.js-copy').on('click', function(){
        let content = $(this).html();
        clipboard_copy(content);
    });
});
