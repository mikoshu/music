var  mm = require('musicmetadata');
util = {
	init: function(){
        var self = this;
        /**localstorage 用于排序，记录当前顺序每次文件增删改查后更新，如有该属性，不遍历musics文件夹**/
        if(localStorage.favoriteFile){
            favoriteFile = JSON.parse(localStorage.favoriteFile);
            this.renderSideList('favoriteList',favoriteFile);
        }
        if(localStorage.file){
            allFile = JSON.parse(localStorage.file);
        }else{
            this.readDefaultFolder(); // 读取本地默认文件
        }
        if(localStorage.recentFile){
            recentFile = JSON.parse(localStorage.recentFile);
            this.renderSideList('recentList',recentFile);
        }
        if(localStorage.shortCutsArray){ // 更新快捷键列表
            shortCutsArray = JSON.parse(localStorage.shortCutsArray);
            shortCutsArray.map(function(val,i){
                self.addShortCuts(val.key,val.url)
            });
            self.renderShortCutsList();
        }
        if(localStorage.password){ // 记住密码时自动填入
            $("#password").val(localStorage.password)
        }
        if(localStorage.username){ // 记住用户名时自动填入
            $("#username").val(localStorage.username)
        }
        if(localStorage.isAutoLogin){ // 判断是否自动登录
            this.login(localStorage.username,localStorage.password);
            $("#autoLogin").prop('checked','checked');
        }
        if(localStorage.isClose){
            var check = localStorage.isClose == 'true' ? true : false ; 
            $("#realClose").prop('checked',check);
        }else{
            $("#realClose").prop('checked','checked');
        }

        this.readDownloadFolder();
        
        //console.log(downloadFile)

        this.getAd(1); // 获取广告
        this.getAd(2); // 获取广告
        this.getAd(3); // 获取广告
        this.getAd(4);

        file = allFile;
        /**localstorage 用于排序**/
        document.oncontextmenu =new Function("return false;"); // 禁止鼠标右键
        //this.addShortCuts();
        navigator.mediaDevices.enumerateDevices().then(function(resp){ // 获取用户media设备
            var html = ''
            resp.map(function(val,i){
                if(val.kind === 'audiooutput'){
                    html += '<option value="'+val.deviceId+'">'+val.label+'</option>'
                } 
            })
            $(".chooseAudio").html(html);
            if(localStorage.channel){
                $(".chooseAudio").val(localStorage.channel);
                $(".chooseAudio").trigger('change');
            }
        });
        // Create a tray icon
        tray = new nw.Tray({ title: 'Tray', icon: './icon.png' });

        // Give it a menu
        var menu = new nw.Menu();
        menu.append(new nw.MenuItem({
            label: '登录' ,
            click: function(){
                var win = nw.Window.get();
                win.show();
                $(".login-box").show();
            }
        }));
        menu.append(new nw.MenuItem({
            label: '选项设置' ,
            click: function(){
                var win = nw.Window.get();
                win.show();
                $(".setPop").show();
            }
        }));
        menu.append(new nw.MenuItem({
            label: '退出' ,
            click: function(){
                var win = nw.Window.get();
                win.close();
            }
        }));
        tray.menu = menu;
        tray.on('click',function(){
            var win = nw.Window.get();
            win.show();
        });

        //test
        util.renderLibHtmlSide();
        
	},
    readDefaultFolder: function(){// 遍历默认文件夹
        allFile = [];
        var self = this;
        var callback = function(){
            self.renderSideList('defaultList',allFile);
            localStorage.file = JSON.stringify(allFile);
            self.refreshList();
        };
        this.readFile(musicURL,allFile,callback);

        // var dir = fs.readdirSync(musicURL);
        // dir.forEach(function(val){ // 遍历musics文件夹里的文件，默认只有一级目录，子目录没做处理
        //     var obj = {};
        //     obj.fileURL = path.join(musicURL, val);
        //     var name = val.split(".");
        //     name.pop();
        //     obj.fileName = name.join('.');
        //     allFile.push(obj); // 将遍历结果放入file数组
        // });
        // localStorage.file = JSON.stringify(allFile);
    },
    readDownloadFolder: function(){ // 遍历下载文件夹
        downloadFile = [];
        var self = this;
        var callback = function(){
            self.renderSideList('downloadList',downloadFile)
        };
        this.readFile(downloadURL,downloadFile,callback);

        // var dir = fs.readdirSync(downloadURL);
        // dir.forEach(function(val){ // 遍历musics文件夹里的文件，默认只有一级目录，子目录没做处理
        //     var obj = {};
        //     obj.fileURL = path.join(downloadURL, val);
        //     var name = val.split(".");
        //     name.pop();
        //     obj.fileName = name.join('.');
        //     downloadFile.push(obj); // 将遍历结果放入file数组
        // });

        //console.log(this.musicList)
        //localStorage.downloadFile = JSON.stringify(downloadFile);
    },
    readFile: function(dirname,arr,fn){ // 读取路径并且递归文件夹
        var self = this;
        var dir = fs.readdirSync(dirname);
        var len = dir.length;
        //console.log(len)
        dir.forEach(function(val,i){
            val = path.join(dirname,val);
            fs.stat(val,function(err,stat){
                if(err){
                    throw err
                }else{
                    if(stat.isDirectory()){
                        self.readFile(val)
                    }else{
                        // https://github.com/leetreveil/musicmetadata
                        var ext = path.extname(val); // 判断文件是否为音频
                        if(ext == ".mp3" || ext == ".wav" || ext == ".wma" || ext == ".ogg" || ext == ".ape" || ext == ".acc" || ext == ".m4a"){
                            var stream = fs.createReadStream(val)
                            var parser = mm(stream,{ duration: true }, function (err, data) {
                              if (err) throw err;
                                var name = path.basename(val,ext);
                                //var size = (parseInt(stat.size)/1024/1024).toFixed(1) + "MB";
                                //var ep = data.album == ''? '未知':data.album;
                                var duration = parseInt(data.duration); // 计算音频时长
                                var m = parseInt(duration/60) >9 ? parseInt(duration/60) : '0'+ parseInt(duration/60) ;
                                var s = duration%60 > 9 ? duration%60 : '0'+duration%60 ;
                                duration = m+':'+s; 
                                stream.close();

                                arr.push({fileName:name, fileURL: val, Time: duration});
                                if(fn){
                                    fn();  
                                }
                            });  
                        }
                    }
                }
            })
        })
    },
	refreshList: function(){ // 渲染全部列表
		var mainHtml = '';
        var sideListHtml = '';
		allFile.map(function(val,index){ // 遍历file数组生成html模板
            mainHtml += '<li><a href="javascript:;" data-url="'+val.fileURL+'" data-time="'+val.Time+'" title="'+val.fileName+'" >'+util.clipString(6,val.fileName)+'<span></span></a></li>'; // 主列表
        })
        $("#musicList").html(mainHtml); // 渲染音效列表
        this.renderSideList('defaultList',allFile);
	},
    renderSideList: function(id,fileArr){ // 渲染左侧列表统一函数
        var html = '';
        var self = this;
        fileArr.map(function(val,index){
            var favoriteClass = self.isFavorited(val.fileURL)? 'favorited' : 'favorite'; // 判断该音效是否存在favorite列表，修改样式
            html  +=   '<li data-url="'+val.fileURL+'">'+
                            '<p title="'+val.fileName+'">'+val.fileName+'</p>'+
                            '<a href="javascript:;" class="more"></a>'+
                            '<a href="javascript:;" class="'+favoriteClass+'"></a>'+
                            '<a href="javascript:;" class="delete"></a>'+
                            '<span class="time">'+val.Time+'</span>'+
                            '<span class="type">'+val.fileURL.split('.').pop().toUpperCase()+'</span>'+
                        '</li>'; // 喜欢列表
        })
        $("#"+id).html(html);
    }, 
	getTime: function (time){ // 修改时间格式
        var time = parseInt(time),m,s;
        m = parseInt(time/60);
        s = parseInt(time%60);
        m = m > 9 ? m : '0'+m;
        s = s > 9 ? s : '0'+s;
        return m+':'+s;
    },
    getMainList: function (){ // 获取当前列表(用于排序后更新localstorage)
        var arr = [];
            $("#musicList").find('li').each(function(index,val){
                var obj = {};
                obj.fileName = $(val).find('a').text();
                obj.fileURL = $(val).find('a').attr('data-url');
                obj.Time = $(val).find('a').attr('data-time');
                arr.push(obj);
            })
            allFile = arr;
            localStorage.file = JSON.stringify(arr);
    },
    deleteFile: function(fileURL,fileName){ // 删除文件
    	var sure = confirm("确定要删除"+fileName+"音效吗？");
        var self = this;
        if(sure){                     // 删除列表里的文件
            this.deleteFileFromList(allFile,fileURL);
            localStorage.file = JSON.stringify(allFile);

            this.deleteFileFromList(recentFile,fileURL);
            localStorage.recentFile = JSON.stringify(recentFile);

            this.deleteFileFromList(favoriteFile,fileURL);
            localStorage.favoriteFile = JSON.stringify(favoriteFile);

            this.deleteShortCutsList(fileURL);
            localStorage.shortCutsArray = JSON.stringify(shortCutsArray);
            this.renderShortCutsList();

            this.deleteFileFromList(downloadFile,fileURL);

            groupArr = JSON.parse(localStorage.groupArr); // 删除列表里的已删除文件
            if(groupArr.length > 0){
                groupArr.map(function(val,i){
                    var arr = JSON.parse(localStorage[val.val]);
                    self.deleteFileFromList(arr,fileURL);
                    localStorage[val.val] = JSON.stringify(arr);
                })
            }


            fs.unlink(fileURL,function(err){
                if(err){
                    alert(err)
                }else{
                    alert('删除成功！');
                }
                self.refreshList();
                self.renderSideList('recentList',recentFile);
                self.renderSideList('favoriteList',favoriteFile);
                self.renderSideList('downloadList',downloadFile);
                self.renderGroup();
            })
            
        }
        return sure
    },
    deleteFileFromList: function(arr,url){ // 根据文件url删除列表文件
        arr.map(function(val,index){
            if(val.fileURL == url){
                arr.splice(index,1); 
                return
            }
        })
    },
    deleteShortCutsList: function(url){
        shortCutsArray.map(function(val,i){
            if(val.url == url){
                shortCutsArray.splice(i,1);
                unreg[i]();
                unreg.splice(i,1);
                return 
            }
        });
    },
    chooseStyle: function(){
        if(nowType == 'default'){
            $("#defaultList").find('li').eq(index).addClass('on').siblings('li').removeClass('on');
        }else if(nowType == 'recent'){
            $("#recentList").find('li').eq(index).addClass('on').siblings('li').removeClass('on');
        }else if(nowType == 'favorite'){
            $("#favoriteList").find('li').eq(index).addClass('on').siblings('li').removeClass('on');
        }
    },
    isFavorited: function(fileURL){ // 检测该音效是否已在favorite列表
    	var flag = false;
    	if(favoriteFile.length){
    		favoriteFile.map(function(val,i){
    			if(val.fileURL == fileURL){
    				flag = true
                    return flag;
    			}
    		});
    	}
    	return flag;
    },
    addToFavorite: function(dom,fileURL,fileName,time){ // 添加音效到喜欢列表
    	var flag = this.isFavorited(fileURL);
    	if(!flag){
    		var obj = {};
    		obj.fileURL = fileURL;
    		obj.fileName = fileName;
            obj.Time = time;
    		favoriteFile.unshift(obj);
    		localStorage.favoriteFile = JSON.stringify(favoriteFile);
    		this.renderSideList('favoriteList',favoriteFile);
            dom.attr('class','favorited');
    	}else{
    		alert('该音效已存在喜欢列表');
    	}
    },
    removeFromFavorite: function(dom,fileURL,fileName){ // 从喜欢列表移除
        if(favoriteFile.length){
            favoriteFile.map(function(val,i){
                if(val.fileURL == fileURL){
                    favoriteFile.splice(i,1);
                    return ;
                }
            });
            localStorage.favoriteFile = JSON.stringify(favoriteFile);
            this.renderSideList('favoriteList',favoriteFile);
            dom.attr('class','favorite');
        }
    },
    addShortCuts: function(key,url,name){ // 使用nw gui 添加快捷键
        var option = {
            key: key,
            active: function(){
                $(audio).attr('src',url);
                $("#name").text(name);
                audio.play();
            },
            failed: function(err){
                alert(err);
            }
        };
        var shortcut = new gui.Shortcut(option);
        gui.App.registerGlobalHotKey(shortcut);

        var unregShortcut = function() {  // 使用闭包，存储shortcut
            gui.App.unregisterGlobalHotKey(shortcut)
        }
        unreg.push(unregShortcut);
        // ;[0]()
        //gui.App.unregisterGlobalHotKey(shortcut);
        //console.log(shortCutsArray)
    },
    renderShortCutsList: function(){
        var html = '';
        shortCutsArray.map(function(val,i){
            html += '<tr>'+
                        '<td>'+val.name+'</td>'+
                        '<td>'+val.key+'</td>'+
                        '<td>'+
                            '<a href="#" data-index="'+i+'" class="removeShortCut" >删除</a>'+
                        '</td>'+
                    '</tr>'
        })
        $("#shortCutsList").html(html);
    },
    getListIndex: function(list,url){ // 获取当前播放索引值
        var len = list.length;
        var listIndex = false;
        for(var i=0;i<len;i++){
            if(list[i].fileURL == url){
                listIndex = i;
                break;
            }
        }
        return listIndex;
    },
    sideListAddClass: function(id,list,url){ // 获取当前播放索引值
        var nowIndex = this.getListIndex(list,url);
        var $ul =  $('#'+id);
        if(typeof(nowIndex) == 'number'){
            //var top = $ul.find('li').eq(nowIndex).offset().top - $ul.offset().top + $ul.scrollTop();
            $('#'+id).find('li').eq(nowIndex).addClass('on').siblings('li').removeClass('on'); 
            //$('#'+id).scrollTop(top);
        } 
    },
    login: function(username,password){
        $.ajax({
            url: 'http://101.37.27.68/newuc/signin',
            type: 'post',
            data: {
                adt: username,
                pwd: password
            },
            success: function(data){   
                var data = JSON.parse(data);
                if(data.success){
                    $('.login-box').hide();
                    //$('#avatar').attr('src',data.name);
                    $('#nickname').text(data.name);
                    $("#show-login").addClass('logined');
                    // 登录成功自动记录密码
                    localStorage.username = username;
                    localStorage.password = password;
                }else{
                    alert('登录失败')
                }
            },
            complete: function(data){
                //console.log(data);
            }
        })
    },
    getAd: function(n){
        var dom = $("#ad"+n);
        var imgIndex = 0;
        $.ajax({
            url: 'http://101.37.27.68/banner/banners',
            type: 'get',
            data: {
                position: n
            },
            success: function(data){
                if(n < 4){
                    getImg(data);
                }else{
                    getTxt(data);
                }
            }
        });

        function getImg(data){
            var data = JSON.parse(data);
            var len = data.length;
            var html = '';
            data.map(function(val,i){
                html += '<img data-link="'+val.link+'" src="'+val.filepath+'"/>';
            });
            dom.html(html);
            dom.delegate('img', 'click', function(event) {
                var url = $(this).attr('data-link');
                nw.Shell.openExternal(url);
            });

            var timmer = setInterval(function(){
                dom.find('img').eq(imgIndex).fadeIn(500).siblings('img').fadeOut(500);
                if(imgIndex == len-1){
                    imgIndex = 0;
                }else{
                    imgIndex += 1;
                }
                
            },10000);
        }
        function getTxt(data){
            var data = JSON.parse(data);
            var len = data.length;
            var html = '';
            data.map(function(val,i){
                html += '<span data-link="'+val.link+'">'+val.description+'</span>';
            });
            dom.html(html);
            dom.delegate('span', 'click', function(event) {
                var url = $(this).attr('data-link');
                nw.Shell.openExternal(url);
            });
            var timmer = setInterval(function(){
                dom.find('span').eq(imgIndex).css('z-index',10)
                .siblings('span').css('z-index',0);
                if(imgIndex == len-1){
                    imgIndex = 0;
                }else{
                    imgIndex += 1;
                }
                
            },10000);
        }
    },
    logout: function(){
        var sure = confirm('是否确定退出登录？');
        if(sure){
            $.ajax({
                url: 'http://101.37.27.68/newuc/logout',
                type: 'post',
                success: function(data){
                  if(data == 'true'){
                    alert('退出登录成功！');
                    $("#avatar").attr('src','images/ic_head.png');
                    $("#nickname").text('登录');
                    $("#show-login").removeClass('logined');
                    $("#autoLogin").prop('checked','');
                    localStorage.isAutoLogin = '';
                  }  
                }
            })
        }
        
    },
    close: function(){
        var win = nw.Window.get();
        if(localStorage.isClose){
            var close = localStorage.isClose == 'true' ? true : false;
            if(close){
                win.hide();
            }else{
                var sure = confirm("您确定要关闭播放器吗？");
                if(sure){
                    win.close();
                }
            }
        }else{
            win.hide();
        }
    },
    reload: function(){
        unreg.map(function(val,i){ // 解绑快捷键
            val();
        })
        tray.remove(); // 移除托盘
        var win = nw.Window.get();
        location.href="#tab-my";
        win.reload();
    },
    renderLibHtmlSide: function(){
        $.ajax({
            url: 'http://101.37.27.68/api/listcatagory',
            success: function(data){
                var data = JSON.parse(data);
                var defaultId = data[0].children[0].id;
                var html = '';
                data.map(function(val,i){
                    if(val.hasOwnProperty('children') && val.children.length != 0 ){
                        html += '<div class="lib-mod" data-id="'+val.id+'" >'+
                                    '<h3 class="lib-show">'+val.text+'<span></span></h3>'+
                                    '<ul>';
                        val.children.map(function(child,n){
                            html += '<li class="lib-type" data-id="'+child.id+'" >'+child.text+'</li>'   
                        })
                        html += '</ul>'+
                                '</div>'
                    }
                    
                })
                $("#lib-side").html(html);
                util.renderLibHtmlCon(defaultId,1);
            },
            error: function(err){
                console.log(err);
                alert("音效分类列表请求错误，请检查网络!");
            }
        })
    },
    renderLibHtmlCon: function(id,page){
        $.ajax({
            url: 'http://101.37.27.68/api/catagory/'+id,
            data:{
                page:page,
                pageSize: 10
            },
            success: function(data){
                var data = JSON.parse(data);
                //console.log(data);
                var html = '';
                libFile = [];
                if(data.hasOwnProperty("content")&&data.content.length > 0){
                    html += '<h3>'+data.content[0].groupid+'</h3>'+
                            '<table>'+
                                '<tr>'+
                                    '<th class="lib-name">标题</th>'+
                                    '<th>类型</th>'+
                                    '<th>时长</th>'+
                                    '<th>操作</th>'+
                                '</tr>';
                    data.content.map(function(val,i){
                        var obj = {}
                        obj.fileName = val.name;
                        obj.fileURL = 'http://101.37.27.68/api/sound/'+val.id+'.'+val.ext;
                        var duration = parseInt(val.duration);
                        var m = parseInt(duration/60) >9 ? parseInt(duration/60) : '0'+ parseInt(duration/60) ;
                        var s = duration%60 > 9 ? duration%60 : '0'+duration%60 ;
                        duration = m+':'+s; 
                        obj.Time = duration;
                        libFile.push(obj);
                        html += '<tr>'+
                                    '<td class="lib-name"><span class="playthis" data-index="'+i+'" title="'+val.name+'" >'+val.name+'</span></td>'+
                                    '<td>'+val.groupid+'</td>'+
                                    '<td>'+val.duration+'s</td>'+
                                    '<td><a href="javascript:;" class="toDownload" data-name="'+val.name+'.'+val.ext+'" data-url="'+obj.fileURL+'">下载</a></td>'+
                                '</tr>';     
                    });
                    html += '</table>';
                    $("#lib-con").html(html);
                    $(".page").pagination({
                        totalData: data.totalCount,
                        showData: 10,
                        pageCount: 5,
                        current: page,
                        coping: true,
                        callback: function(api){
                            util.renderLibHtmlCon(id,api.getCurrent());
                        }

                    })
                }else{
                    alert("该类型音效没有内容")
                }
                
            },
            error: function(err){
                console.log(err)
                alert("音效分类列表请求错误，请检查网络!");
            }
        })
    },
    rename: function(obj){
        var filename = path.basename(obj.oldURL).split(".")[0];
        var ext = path.extname(obj.oldURL);
        var url = path.dirname(obj.oldURL);
        var newURL = path.join(url,obj.newName+ext);
        fs.rename(obj.oldURL,newURL,function(err){
            if(err){
                console.log(err);
            }else{
                alert("文件名修改成功！");
                var nameObj = {
                    oldName: filename,
                    newName: obj.newName,
                    oldURL: obj.oldURL,
                    newURL: newURL
                }
                util.replaceName(nameObj,'defaultList',allFile);
                util.replaceName(nameObj,'favoriteList',favoriteFile);
                util.replaceName(nameObj,'recentList',recentFile);
            }
        });
    },
    replaceName: function(obj,id,fileArr){
        var arr = fileArr;
        var len = arr.length;
        for(var i=0;i<len;i++){
            if(arr[i].fileURL == obj.oldURL){
                arr[i].fileURL = obj.newURL;
                arr[i].fileName = obj.newName;
                break;
            }
        }
        if(id == 'defaultList'){
            localStorage.file = JSON.stringify(fileArr);
        }else if(id == "favoriteList"){
            localStorage.favoriteFile = JSON.stringify(fileArr);
        }else if(id == 'recentList'){
            localStorage.recentFile = JSON.stringify(fileArr);
        }
        
        util.renderSideList(id,fileArr);
        util.refreshList();
        
    },
    renderGroup: function(){ // 渲染自定义分组
        if(localStorage.groupArr){
            var n = 0;
            groupArr = JSON.parse(localStorage.groupArr);
            var html = '';
            console.log(groupArr)
            groupArr.map(function(val,i){
                if(typeof(val) == 'object'){
                    html += '<div class="moren_list">'+
                        '    <p class="mrlink_lb">'+val.name+'</p>'+
                        '    <span></span>'+
                        '    <ins class="remove" data-id="'+val.val+'" >x</ins>'+
                        '</div>'+
                        '<ul id="'+val.val+'" class="gai_list_2">'+
                        '</ul>';
                    n++;
                }
                
            });
            $(".my-group").html(html);
            groupArr.map(function(val,i){
                util.renderGroupList(val.val);
            });

            util.other();
            groupArr.map(function(val,i){
                $("#"+val.val).delegate('li','click',function(){ //最近播放列表点击事件
                    nowType = val.val;
                    $(this).addClass('on').siblings('li').removeClass('on');
                    $()
                    index = $(this).index();
                    var arr = JSON.parse(localStorage[val.val]);
                    play(arr);
                });
            });

            

            var height = 236 - 30*n;

            $(".add-group").find(".gai_list_2").css('height',height+'px');
        }
    },
    renderGroupList: function(id){
        var self = this;
        var html = '';
        if(localStorage[id]){
            var arr = JSON.parse(localStorage[id]);
            arr.map(function(val,i){
                var favoriteClass = self.isFavorited(val.fileURL)? 'favorited' : 'favorite'; // 判断该音效是否存在favorite列表，修改样式
                html += '<li data-url="'+val.fileURL+'"">'+
                            '<p title="'+val.fileName+'">'+val.fileName+'</p>'+
                            '<a href="javascript:;" class="more"></a>'+
                            '<a href="javascript:;" class="'+favoriteClass+'"></a>'+
                            '<a href="javascript:;" class="delete"></a>'+
                            '<span class="time">'+val.Time+'</span>'+
                            '<span class="type">'+val.fileURL.split('.').pop().toUpperCase()+'</span>'+
                        '</li>';
            });
            $("#"+id).html(html);
        }
        
    },
    clipString: function(stalen,str){
        var len = str.length;
        if(len > stalen){
            str = str.substring(0,stalen) + '...';
        }
        return str;
    },
    other: function(){
        $('.gai_list_2').undelegate();

        $("#defaultList").delegate('li','click',function(){ //默认列表点击事件
            nowType = 'default';
            $(this).addClass('on').siblings('li').removeClass('on');
            index = $(this).index();
            play(allFile);
        });
        
        

        $("#recentList").delegate('li','click',function(){ //最近播放列表点击事件
            nowType = 'recent';
            $(this).addClass('on').siblings('li').removeClass('on');
            index = $(this).index();
            play(recentFile);
        });

        $("#favoriteList").delegate('li','click',function(){ //最近播放列表点击事件
            nowType = 'favorite';
            $(this).addClass('on').siblings('li').removeClass('on');
            index = $(this).index();
            play(favoriteFile);
        });
        $("#downloadList").delegate('li','click',function(){ //最近播放列表点击事件
            nowType = 'download';
            $(this).addClass('on').siblings('li').removeClass('on');
            index = $(this).index();
            play(downloadFile);
        });
        
        $('.gai_list_2').delegate('.favorite','click',function(e){ //添加音效到喜欢列表
            e.stopPropagation();
            var name = $(this).parent().find('p').text();
            var url = $(this).parent().attr('data-url');
            var time = $(this).parent().find('.time').html();
            util.addToFavorite($(this),url,name,time);
            util.renderSideList('defaultList',allFile);
            util.renderSideList('recentList',recentFile);
            if(localStorage.groupArr){
                groupArr = JSON.parse(localStorage.groupArr);
                groupArr.map(function(val,i){
                    var arr = JSON.parse(localStorage[val.val]);
                    util.renderSideList(val.val,arr);
                });
            }

        });

        $('.gai_list_2').delegate('.favorited','click',function(e){ //从喜欢列表移除音效
            e.stopPropagation();
            var name = $(this).parent().find('p').text();
            var url = $(this).parent().attr('data-url');
            util.removeFromFavorite($(this),url,name);
            util.renderSideList('defaultList',allFile);
            util.renderSideList('recentList',recentFile);
            if(localStorage.groupArr){
                groupArr = JSON.parse(localStorage.groupArr);
                groupArr.map(function(val,i){
                    var arr = JSON.parse(localStorage[val.val]);
                    util.renderSideList(val.val,arr);
                });
            }
        });
        $(".gai_list_2").delegate('.delete','click',function(e){ //列表删除文件
            e.stopPropagation();
            var name = $(this).parent().find('p').text();
            var url = $(this).parent().attr('data-url');
            util.deleteFile(url,name);
        });
    } 
}