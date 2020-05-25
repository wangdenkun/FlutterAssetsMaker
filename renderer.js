var timer = 0;
var timerHandle;
var progressbar;
// 引入jQuery
window.$ = window.jQuery = require('./resource/jquery-3.5.1.min.js');
const { ipcRenderer } = require('electron')

// 一些基础方法
// 存储内容
function setKV(key, value) {
    const k = key.toString();
    const v = value.toString();
    layui.data('flutterAssetsMaker', {
        key: k,
        value: v
    });
}
function getKV(key) {
    var localSavedData = layui.data('flutterAssetsMaker');
    var res = localSavedData[key];
    return res;
}
function clearTypeStyle(selectType){
    $('#flutter-type').removeClass('layui-btn-normal');
    $('#ios-type').removeClass('layui-btn-normal');
    $('#android-type').removeClass('layui-btn-normal');
    $(`#${selectType}`).addClass('layui-btn-normal')
}

// 页面加载完成后 读取一下上次的配置
window.addEventListener('DOMContentLoaded', () => {
    // 读取上次保存的内容
    const lastSavedSourceFileDir = getKV('sourceFileDir');
    const lastSavedDisFileDir = getKV('disFileDir');
    const targetName = getKV('targetName');
    const targetType = getKV('targetType');
    if (lastSavedSourceFileDir) {
        const pops = 'setSource';
        ipcRenderer.send('synchronizationToMain', pops, lastSavedSourceFileDir);
    }
    if (lastSavedDisFileDir) {
        const pops = 'setDis';
        ipcRenderer.send('synchronizationToMain', pops, lastSavedDisFileDir);
    }
    if (targetName) {
        var pops = 'setTargetName';
        ipcRenderer.send('synchronizationToMain', pops, targetName);
    }
    if(targetType){
        clearTypeStyle(`${targetType}-type`);
        ipcRenderer.send('synchronizationToMain', 'setTargetType', targetType);
    }else{
        setKV('targetType','flutter');
        ipcRenderer.send('synchronizationToMain', 'setTargetType', 'flutter');
    }

    // 拖动文件的操作
    document.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        var pops = '';
        if (e.target.id === 'sourceFileDir' || e.target.parentNode.id === 'sourceFileDir') {
            pops = 'setSource';
        }
        if (e.target.id === 'disFileDir' || e.target.parentNode.id === 'disFileDir') {
            pops = 'setDis';
        }
        if (pops === '') {
            return;
        }
        for (const f of e.dataTransfer.files) {
            ipcRenderer.send('synchronizationToMain', pops, f.path);
        }
    });
    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    // 目标类型
    $('#flutter-type').on('click',(e) => {        
        clearTypeStyle('flutter-type');
        ipcRenderer.send('synchronizationToMain', 'setTargetType', 'flutter');
        setKV('targetType','flutter');
    })
    $('#ios-type').on('click',(e) => {        
        clearTypeStyle('ios-type');
        ipcRenderer.send('synchronizationToMain', 'setTargetType', 'ios');
        setKV('targetType','ios');
    })
    $('#android-type').on('click',(e) => {        
        clearTypeStyle('android-type');
        ipcRenderer.send('synchronizationToMain', 'setTargetType', 'android');
        setKV('targetType','android');
    })

    // 目标 文件名
    $('#targetName').bind("input propertychange", function (event) {
        const targetName = $("#targetName").val();
        setKV('targetName', targetName);
        var pops = 'setTargetName';
        ipcRenderer.send('synchronizationToMain', pops, targetName);
    });

    progressbar = $('#progressbar');
    progressbar.css('display', 'none');
    $('#makeAssets').on('click', (e) => {
        ipcRenderer.send('synchronizationToMain', 'makeAssets', 'ios/android/flutter');
    })
})

function showMessage(value) {
    layer.msg(value);
}

// 监听主进程消息
ipcRenderer.on('messageFromMain', (event, type, value) => {
    if (type === 'setSourceDone') {
        $('#sourceFileDir').text(value)
        setKV('sourceFileDir', value);
    }
    if (type === 'setDisDone') {
        $('#disFileDir').text(value)
        setKV('disFileDir', value);
    }
    if (type === 'setTargetNameDone') {
        $('#targetName').val(value)
        setKV('targetName', value);
    }
    if (type === 'showMessage') {
        showMessage(value);
    }
    if (type === 'creatSubDir') {
        layer.confirm('是否创建?', { icon: 3, title: value }, function (index) {
            ipcRenderer.send('synchronizationToMain','creatSubDir')
            layer.close(index);
        });
    }
    if (type === 'deleteExitsFiles') {
        layer.confirm('是否删除?', { icon: 3, title: value }, function (index) {
            ipcRenderer.send('synchronizationToMain','deleteExitsFiles')
            layer.close(index);
        });
    }
    if (type === 'workStart') {
        progressbar.css('display', 'block');
        layui.use('element', function () {
            var element = layui.element;
            element.progress('progressbar', `${value}%`);
        });
    }
    if (type === 'progress') {
        progressbar.css('display', 'block');
        layui.use('element', function () {
            var element = layui.element;
            element.progress('progressbar', `${value}%`);
        });
    }
    if (type === 'workEnd') {
        progressbar.css('display', 'none');
        layui.use('element', function () {
            var element = layui.element;
            element.progress('progressbar', `${value}%`);
        });
        showMessage('处理完成');
    }
})