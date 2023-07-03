let dataLines = [];
let songsTable = [];
let userClear = [];
let userAbility = [];
let prevUserAbility = [];
let tableFormat;
let grid;
let gridOption = {
    data: songsTable,
    sort: true,
    fixedHeader: true,
    pagination: {
        limit: 100,
        buttonsCount: 5,
    },
    //height: '600px',
    language: {
        'search': {
            'placeholder': 'フィルター例: sl_04'
        },
        'pagination': {
            'showing': '表示中: ',
            'results': () => ''
        }
    },

    columns: [
        {
            name: 'Id',
            hidden: true,
        },
        {
            name: 'Level',
            width: 140,
            attributes: (cell, row) => {
                if (row) { 
                    let md5 = row.cells[4].data;
                    let sha256 = row.cells[3].data;
                    let easy, hard, aaa, score_rate, miss_count, option;
                    if(row.cells[14].data){
                        let clear_array;
                        if(typeof(row.cells[14].data) == 'string'){
                            clear_array = row.cells[14].data.split(',');
                        }else{
                            clear_array = row.cells[14].data;
                        }
                        easy = parseInt(clear_array[0]);
                        hard = parseInt(clear_array[1]);
                        aaa = parseInt(clear_array[2]);
                        score_rate = parseInt(clear_array[3]);
                        miss_count = parseInt(clear_array[4]);
                        option = parseInt(clear_array[5]);
                    }
                    return {
                        'data-md5': md5,
                        'data-sha256': sha256,
                        'data-style': 'c-table--center',
                        'data-clear': easy + hard,
                        'data-score': aaa,
                        'data-score-rate': score_rate,
                        'data-miss-count': miss_count,
                        'data-play-option': option, 
                    };
                }
            },
            formatter: (cell, row) => {
                let data;
                let level, stats, option;
                try{
                    data = row.cells[14].data.split(',');
                }catch{

                }
                level = `<strong>${level_reformat(cell)}</strong>`;
                if(data){
                    stats = `<span><b>${data[3]}<i>%</b></i> <b><i>BP</i>${data[4]}</b></span>`
                    option = `<small>${extract_play_option(tableFormat, data[5])}</small>`
                }else{
                    stats = '';
                    option = '';
                }

                let output = html(`
                    <div>
                    ${level}
                    <p>
                    ${stats}
                    ${option}
                    </div>
                `)
                return output;
            }
        },
        {
            name: 'Title',
            attributes: (cell, row) => {
                if(row){
                    return {
                        'class': 'c-table--title',
                    }
                }
            },
            formatter: (cell, row) => {
                return html(`
                    ${cell.replace(/(.*?)\[(.*?)\]/g, '<span>$1</span><small>[$2]</small>')}
                    <div class="c-table--links">
                        <a href="http://www.dream-pro.info/~lavalse/LR2IR/search.cgi?bmsmd5=${row.cells[4].data}" target="_blank">LR2IR</a>
                        <a href="https://www.gaftalk.com/minir/#/viewer/song/${row.cells[3].data}/0" target="_blank">MiniIR</a>
                        <a href="http://www.ribbit.xyz/bms/score/view?md5=${row.cells[4].data}" target="_blank">ribbit</a>
                    </div>
                `);
            }
            
            
        },
        {
            name: 'Md5',
            hidden: true,
        },
        {
            name: 'sha256',
            hidden: true,
        },
        {
            name: 'Easy',
            width: 60,
            attributes: (cell, row) => {
                if (row) { 
                    return {
                        'style': '--value: ' + (100 - Number(row.cells[5].data)) * 1.8,
                        'data-style': 'c-table--num'
                    };
                }
            },
            formatter: (cell, row) => html(`
                <span class="c-table--invisible">${row.cells[5].data}</span>
                <span>${Number(row.cells[5].data).toFixed(3)}</span>
            `)
        },
        {
            name: 'Hard',
            width: 60,
            attributes: (cell, row) => {
                if (row) { 
                    return {
                        'style': '--value: ' + (100 - Number(row.cells[6].data)) * 1.8,
                        'data-style': 'c-table--num'
                    };
                }
            },
            formatter: (cell, row) => html(`
                <span class="c-table--invisible">${row.cells[6].data}</span>
                <span>${Number(row.cells[6].data).toFixed(3)}</span>
            `)
        },
        {
            name: 'AAA',
            width: 60,
            attributes: (cell, row) => {
                if (row) { 
                    return {
                        'style': '--value: ' + (100 - Number(row.cells[7].data)) * 1.8,
                        'data-style': 'c-table--num'
                    };
                }
            },
            formatter: (cell, row) => html(`
                <span class="c-table--invisible">${row.cells[7].data}</span>
                <span>${Number(row.cells[7].data).toFixed(3)}</span>
            `)
        },
        {
            name: 'Easy discrimination',
            hidden: true,
        },
        {
            name: 'Hard discrimination',
            hidden: true,
        },
        {
            name: 'AAA discrimination',
            hidden: true,
        },
        {
            name: 'Easy p.d.',
            sort: true,
            width: 100,
            attributes: (cell, row) => {
                if (row) { 
                    let easy_level = row.cells[5].data;
                    let easy_disc = row.cells[8].data;
                    return {
                        'data-easy-level': Number(easy_level) + '%',
                        'data-easy-disc': easy_disc + '%',
                        'data-easy-recommend': Number(cell) + '%',
                    };
                }
            },
            formatter: (cell, row) => {
                const graph_option = {
                    height: '30px',
                    low: 0,
                    high: 1,
                    showArea: true,
                    showPoint: false,
                    fullWidth:true,
                    chartPadding: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    },
                    axisX: {
                        showGrid: true, 
                        showLabel: false, 
                        offset: 0,
                        labelInterpolationFnc: (val, idx) => (idx % 10 > 0 ? null : val),
                    },
                    axisY: {
                        showGrid: false, 
                        showLabel: false, 
                        offset: 0,
                    },
                };
                const ref = gCreateRef();
                const chart = h('div', {
                    ref: ref, 
                    class: 'p-chart--easy' , 
                    'data-recommend': `${Number(cell).toFixed(1)}%`,
                    style: `--value: ${(Number(cell).toFixed(1)) * 180 / 100}`
                });
                const easy_level = row.cells[5].data;
                const easy_disc = row.cells[8].data;
                setTimeout(() => {
                    // render the chart based on cell data
                    let graph = new Chartist.Line(ref.current, {
                        labels: [[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]],
                        series: [calc_dist(easy_level, easy_disc)],
                    }, graph_option);
                }, 0);
                return chart;
            }
        },
        {
            name: 'Hard p.d.',
            sort: true,
            width: 100,
            attributes: (cell, row) => {
                if (row) { 
                    let hard_level = row.cells[6].data;
                    let hard_disc = row.cells[9].data;
                    return {
                        'data-hard-level': Number(hard_level) + '%',
                        'data-hard-disc': Number(hard_disc) + '%',
                        'data-hard-recommend': Number(cell) + '%',
                    };
                }
            },
            formatter: (cell, row) => {
                const graph_option = {
                    height: '30px',
                    low: 0,
                    high: 1,
                    showArea: true,
                    showPoint: false,
                    fullWidth:true,
                    chartPadding: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    },
                    axisX: {
                        showGrid: true, 
                        showLabel: false, 
                        offset: 0,
                        labelInterpolationFnc: (val, idx) => (idx % 10 > 0 ? null : val),
                    },
                    axisY: {
                        showGrid: false, 
                        showLabel: false, 
                        offset: 0
                    }
                };
                const ref = gCreateRef();
                const chart = h('div', {
                    ref: ref, 
                    class: 'p-chart--hard' , 
                    'data-recommend': `${Number(cell).toFixed(1)}%`,
                    style: `--value: ${(Number(cell).toFixed(1)) * 180 / 100}`
                });
                const hard_level = row.cells[6].data;
                const hard_disc = row.cells[9].data;
                setTimeout(() => {
                    // render the chart based on cell data
                    ref.current && new Chartist.Line(ref.current, {
                        labels: [[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]],
                        series: [calc_dist(hard_level, hard_disc)]
                    }, graph_option);
                }, 0);
                return chart;
            }
        },
        {
            name: 'AAA p.d.',
            width: 100,
            attributes: (cell, row) => {
                if (row) { 
                    let aaa_level = Number(row.cells[6].data) + '%';
                    let aaa_disc = row.cells[9].data + '%';
                    /*
                    return {
                        'data-hard-level': Number(aaa_level) + '%',
                        'data-hard-disc': aaa_disc + '%',
                    };*/
                    return {
                        'style': '--aaa-level: '+aaa_level+'; --aaa-disc: '+aaa_disc+';',
                        'data-aaa-recommend': cell
                    };
                }
            },formatter: (cell, row) => {
                const graph_option = {
                    height: '30px',
                    low: 0,
                    high: 1,
                    showArea: true,
                    showPoint: false,
                    fullWidth:true,
                    chartPadding: {
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0
                    },
                    axisX: {
                        showGrid: true, 
                        showLabel: false, 
                        offset: 0,
                        labelInterpolationFnc: (val, idx) => (idx % 10 > 0 ? null : val),
                    },
                    axisY: {
                        showGrid: false, 
                        showLabel: false, 
                        offset: 0
                    }
                };
                const ref = gCreateRef();
                const chart = h('div', {
                    ref: ref, 
                    class: 'p-chart--score' , 
                    'data-recommend': `${Number(cell).toFixed(1)}%`,
                    style: `--value: ${(Number(cell).toFixed(1)) * 180 / 100}`
                });
                const aaa_level = row.cells[7].data;
                const aaa_disc = row.cells[10].data;
                setTimeout(() => {
                    // render the chart based on cell data
                    ref.current && new Chartist.Line(ref.current, {
                        labels: [[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100]],
                        series: [calc_dist(aaa_level, aaa_disc), []]
                    }, graph_option);
                }, 0);
                return chart;
            }
        },
        {
            name: 'easy recommend',
            hidden: true,
        },
        {
            name: 'lamp',
            hidden: true,
        }
    ],
}