// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs');

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      webSecurity: true,
      // allowRunningInsecureContent: true,
      // contextIsolation: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  // Open the DevTools.
  // mainWindow.webContents.openDevTools()

  // 记住位置
  // mainWindow.on('will-resize',(event,newBounds) => {
  //   console.log('will-resize',event,newBounds);
  // })
  // mainWindow.on('will-move',(event,newBounds) => {
  //   console.log('wil-move',event,newBounds);
  // })
  // mainWindow.on('move',(event,newBounds) => {
  //   console.log('move',event,newBounds);
  // })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// electron部分



// 制作资源部分
var sourcePath = '';
var disPath = '';
var newFileName = '';
var targetType = '';

// 监听渲染进程的消息
ipcMain.on('synchronizationToMain', (event, pops, value) => {
  // 拿到操作了内容 设置目录 或者是开始制作
  // console.log('main', event, pops, value);

  // 同步数据 然后相应的操作内容返给渲染进程
  if (pops === 'setSource') {
    sourcePath = value;
    event.reply('messageFromMain', 'setSourceDone', value);
  }
  if (pops === 'setDis') {
    disPath = value;
    event.reply('messageFromMain', 'setDisDone', value);
  }
  if (pops === 'setTargetName') {
    newFileName = value;
    event.reply('messageFromMain', 'setTargetNameDone', value);
  }

  // 相关的文件操作 
  // 创建2.0x 3.0x文件夹 
  if (pops === 'creatSubDir') {
    if( targetType == 'flutter'){
      var disPathsToCheck = [path.join(disPath, '2.0x'), path.join(disPath, '3.0x')];
      disPathsToCheck.forEach((i) => fs.mkdirSync(i))
      event.reply('messageFromMain', 'showMessage', '创建成功');  
    }
    if( targetType == 'android'){
      var disPathsToCheck = fs.readdirSync(sourcePath);
      var disPathsToMake = disPathsToCheck.map((i) => path.join(disPath,i));
      console.log('---------------')
      console.log(disPathsToCheck)
      console.log(disPathsToMake)
      try{
        disPathsToMake.forEach((i) => {
          if(!fs.existsSync(i)){
            fs.mkdirSync(i);
          }
        })
        event.reply('messageFromMain', 'showMessage', '创建成功');    
      }catch(e){
        event.reply('messageFromMain', 'showMessage', e);    
      }
    }

  }
  // 删除目标文件
  if (pops === 'deleteExitsFiles') {
    var sourceDir = fs.readdirSync(sourcePath);
    var orgName = sourceDir.filter((v) => v.indexOf('@2x') != -1).pop();
    if (!orgName) {
      event.reply('messageFromMain', 'showMessage', '未在源目录内找到指定符合规范的文件');
      return;
    }
    var orgNameTmp = orgName.replace('@2x', '');
    var extname = path.extname(orgNameTmp);
    orgNameTmp = orgNameTmp.replace(extname, '');
    var copyToPaths = [
      path.join(disPath, `${newFileName}${extname}`),
      path.join(disPath, '2.0x', `${newFileName}${extname}`),
      path.join(disPath, '3.0x', `${newFileName}${extname}`),
    ]
    copyToPaths.forEach((i) => fs.unlinkSync(i));
    event.reply('messageFromMain', 'showMessage', '删除成功');
  }

  // 设置目标平台
  if (pops === 'setTargetType') {
    targetType = value;
  }
  // 搬文件
  if (pops === 'makeAssets' && targetType === 'flutter') {
    // var message = '';
    // var isCheckRight = true;
    // // 检查源目录和目标目录
    // if (sourcePath === '' || disPath === '' || newFileName == '') {
    //   isCheckRight = false;
    //   message = '设置不完善！';
    // }
    // try {
    //   var sourceDir = fs.readdirSync(sourcePath);
    // } catch (error) {
    //   isCheckRight = false;
    //   message = '源目录设置错误';
    // }
    // try {
    //   var disDir = fs.readdirSync(disPath);
    // } catch (error) {
    //   isCheckRight = false;
    //   message = '目标目录设置错误';
    // }
    // if (!isCheckRight) {
    //   event.reply('messageFromMain', 'showMessage', message);
    //   return;
    // }

    // // 检查目标文件夹内是否有2.x 3.x
    // var disPathsToCheck = [path.join(disPath, '2.0x'), path.join(disPath, '3.0x')]
    // if (disDir.indexOf('2.0x') == -1 || disDir.indexOf('3.0x') == -1) {
    //   message = '目标目录内没有2.0x或3.0x目录';
    //   isCheckRight = false;
    //   event.reply('messageFromMain', 'creatSubDir', message);
    //   return;
    // }
  }
  if (pops === 'makeAssets'){
    if (!commonMakeCheck(event)) {
      return;
    }
    if (targetType == '') {
      event.reply('messageFromMain', 'creatSubDir', '未设置类型!');
      return;
    }
    if (targetType == 'flutter') {
      makeAssetsOfFlutter(event);
    }
    if (targetType == 'ios') {
      makeAssetsOfiOS(event);
    }
    if (targetType == 'android') {
      console.log('--------targetType == android')
      makeAssetsOfAndroid(event);
    }  
  }
})

function commonMakeCheck(event) {
  var message = '';
  var isCheckRight = true;
  // 检查源目录和目标目录
  if (sourcePath === '' || disPath === '' || newFileName == '') {
    isCheckRight = false;
    message = '设置不完善！'; 
  }
  try {
    var sourceDir = fs.readdirSync(sourcePath);
  } catch (error) {
    isCheckRight = false;
    message = '源目录设置错误';
  }
  try {
    var disDir = fs.readdirSync(disPath);
  } catch (error) {
    isCheckRight = false;
    message = '目标目录设置错误';
  }
  if (!isCheckRight) {
    event.reply('messageFromMain', 'showMessage', message);
    return false;
  }
  return true;

}
function makeAssetsOfFlutter(event) {
  var message = '';
  var sourceDir = fs.readdirSync(sourcePath);
  var disDir = fs.readdirSync(disPath);
  // 检查目标文件夹内是否有2.x 3.x
  var disPathsToCheck = [path.join(disPath, '2.0x'), path.join(disPath, '3.0x')]
  if (disDir.indexOf('2.0x') == -1 || disDir.indexOf('3.0x') == -1) {
    message = '目标目录内没有2.0x或3.0x目录';
    isCheckRight = false;
    event.reply('messageFromMain', 'creatSubDir', message);
    return false;
  }
  // 检查目标文件夹内是否有2.x 3.x
  var disPathsToCheck = [path.join(disPath, '2.0x'), path.join(disPath, '3.0x')]
  if (disDir.indexOf('2.0x') == -1 || disDir.indexOf('3.0x') == -1) {
    message = '目标目录内没有2.0x或3.0x目录';
    isCheckRight = false;
    event.reply('messageFromMain', 'creatSubDir', message);
    return false;
  }
  // 开始搬文件
  var orgName = sourceDir.filter((v) => v.indexOf('@2x') != -1).pop();
  if (!orgName) {
    event.reply('messageFromMain', 'showMessage', '未在源目录内找到指定符合规范的文件');
    return;
  }

  var orgNameTmp = orgName.replace('@2x', '');
  var extname = path.extname(orgNameTmp);
  orgNameTmp = orgNameTmp.replace(extname, '');

  // 检查目标文件夹内是否已存在新文件
  if (fs.existsSync(path.join(disPath, `${newFileName}${extname}`))) {
    message = '目标目录内已存在该文件';
    event.reply('messageFromMain', 'deleteExitsFiles', message);
    return;
  }

  var copyFromPaths = [
    path.join(sourcePath, `${orgNameTmp}${extname}`),
    path.join(sourcePath, `${orgNameTmp}@2x${extname}`),
    path.join(sourcePath, `${orgNameTmp}@3x${extname}`),
  ]
  var copyToPaths = [
    path.join(disPath, `${newFileName}${extname}`),
    path.join(disPath, '2.0x', `${newFileName}${extname}`),
    path.join(disPath, '3.0x', `${newFileName}${extname}`),
  ]

  event.reply('messageFromMain', 'workStart', 0);
  for (const index in copyFromPaths) {
    const src = copyFromPaths[index];
    const dest = copyToPaths[index];
    fs.copyFileSync(src, dest);
    event.reply('messageFromMain', 'progress', index / copyFromPaths.length);
  }
  event.reply('messageFromMain', 'workEnd', 0);
}

function makeAssetsOfAndroid(event) {
  var message = '';
  var sourceDir = fs.readdirSync(sourcePath);
  var disDir = fs.readdirSync(disPath);
  // 开始搬文件
  var orgName = sourceDir.filter((v) => v.indexOf('mipmap-') != -1).pop();
  if (!orgName) {
    event.reply('messageFromMain', 'showMessage', '未在源目录内找到指定符合规范的文件');
    return;
  }

  var orgNameTmp = orgName.replace('@2x', '');
  var extname = path.extname(orgNameTmp);
  orgNameTmp = orgNameTmp.replace(extname, '');

  var orgFilePaths = sourceDir.map((i) => [fs.readdirSync(path.join(sourcePath,i))]).reduce((l, r) => l.concat(r));
  
  // console.log(disDir);
  // console.log(sourceDir);
  // console.log(orgFilePaths);
  var totalCount = orgFilePaths.length;
  var currentMoveIndex = 1;
  var isDisDirHasSourceDirs = sourceDir.every((i) => disDir.indexOf(i) != -1);
  if(!isDisDirHasSourceDirs){
    message = '目标目录内没有对应的分辨率文件夹';
    event.reply('messageFromMain', 'creatSubDir', message);
    return false;
  }

  try{
    event.reply('messageFromMain', 'workStart', 0);
    console.log('start make')
    sourceDir.forEach((sourceSubDir) => {
      fs.stat(path.join(sourcePath,sourceSubDir),(err,state) => {
        if(err == null && state.isDirectory()){
          subFiles = fs.readdirSync(path.join(sourcePath,sourceSubDir));
          subFiles.forEach((i) => {
            var extname = path.extname(i);
            fs.copyFileSync(path.join(sourcePath,sourceSubDir,i),path.join(disPath,sourceSubDir,`${newFileName}${extname}`));
            event.reply('messageFromMain', 'progress', currentMoveIndex / totalCount);
            currentMoveIndex += 1;  
            if(currentMoveIndex >= totalCount){
              event.reply('messageFromMain', 'workEnd', 0);
            }
          });
        }
      });
    });  
  }catch(e){
    event.reply('messageFromMain', 'showMessage', e);
  }
}

function makeAssetsOfiOS(event) {
  var message = '';
  var sourceDir = fs.readdirSync(sourcePath);
  var disDir = fs.readdirSync(disPath);
  // 开始搬文件
  var orgName = sourceDir.filter((v) => v.indexOf('@2x') != -1).pop();
  if (!orgName) {
    event.reply('messageFromMain', 'showMessage', '未在源目录内找到指定符合规范的文件');
    return;
  }

  var orgNameTmp = orgName.replace('@2x', '');
  var extname = path.extname(orgNameTmp);
  orgNameTmp = orgNameTmp.replace(extname, '');

  // 检查目标文件夹内是否已存在新文件
  if (fs.existsSync(path.join(disPath, `${newFileName}${extname}`))) {
    message = '目标目录内已存在该文件';
    event.reply('messageFromMain', 'deleteExitsFiles', message);
    return;
  }

  var copyFromPaths = [
    path.join(sourcePath, `${orgNameTmp}${extname}`),
    path.join(sourcePath, `${orgNameTmp}@2x${extname}`),
    path.join(sourcePath, `${orgNameTmp}@3x${extname}`),
  ]
  var copyToPaths = [
    path.join(disPath, `${newFileName}${extname}`),
    path.join(disPath, '2.0x', `${newFileName}${extname}`),
    path.join(disPath, '3.0x', `${newFileName}${extname}`),
  ]

  event.reply('messageFromMain', 'workStart', 0);
  for (const index in copyFromPaths) {
    const src = copyFromPaths[index];
    const dest = copyToPaths[index];
    fs.copyFileSync(src, dest);
    event.reply('messageFromMain', 'progress', index / copyFromPaths.length);
  }
  event.reply('messageFromMain', 'workEnd', 0);
}
