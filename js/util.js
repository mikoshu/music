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
            var dir = fs.readdirSync(musicURL);
            dir.forEach(function(val){ // 遍历musics文件夹里的文件，默认只有一级目录，子目录没做处理
                var obj = {};
                obj.fileURL = path.join(musicURL, val);
                var name = val.split(".");
                name.pop();
                obj.fileName = name.join('.');
                allFile.push(obj); // 将遍历结果放入file数组
            });
            localStorage.file = JSON.stringify(allFile);
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

        this.getAd(1); // 获取广告
        this.getAd(2); // 获取广告
        this.getAd(3); // 获取广告
        this.getAd(4);

        file = allFile;
        /**localstorage 用于排序**/
        document.oncontextmenu =new Function("return false;")
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

	},
	refreshList: function(){ // 渲染全部列表
		var mainHtml = '';
        var sideListHtml = '';
		allFile.map(function(val,index){ // 遍历file数组生成html模板
            mainHtml += '<li><a href="javascript:;" data-url='+val.fileURL+' >'+val.fileName+'<span></span></a></li>'; // 主列表
        })
        $("#musicList").html(mainHtml); // 渲染音效列表
        this.renderSideList('defaultList',allFile);
	},
    renderSideList: function(id,fileArr){ // 渲染左侧列表统一函数
        var html = '';
        var self = this;
        fileArr.map(function(val,index){
            var favoriteClass = self.isFavorited(val.fileURL)? 'favorited' : 'favorite'; // 判断该音效是否存在favorite列表，修改样式
            html  +=   '<li data-url='+val.fileURL+'>'+
                            '<p>'+val.fileName+'</p>'+
                            '<a href="javascript:;" class="more"></a>'+
                            '<a href="javascript:;" class="'+favoriteClass+'"></a>'+
                            '<a href="javascript:;" class="delete"></a>'+
                            

                            '<span class="type">'+val.fileURL.split('.').pop().toUpperCase()+'</span>'
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

            fs.unlink(fileURL,function(err){
                if(err){
                    alert(err)
                }else{
                    alert('删除成功');
                }
                self.refreshList();
                self.renderSideList('recentList',recentFile);
                self.renderSideList('favoriteList',favoriteFile);
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
    addToFavorite: function(dom,fileURL,fileName){ // 添加音效到喜欢列表
    	var flag = this.isFavorited(fileURL);
    	if(!flag){
    		var obj = {};
    		obj.fileURL = fileURL;
    		obj.fileName = fileName;
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
            var top = $ul.find('li').eq(nowIndex).offset().top - $ul.offset().top + $ul.scrollTop();
            $('#'+id).find('li').eq(nowIndex).addClass('on').siblings('li').removeClass('on'); 
            $('#'+id).scrollTop(top);
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
                // if(data.responseCode == 200){
                //     //alert('登录成功！');
                //     $('.login-box').hide();
                //     $('#avatar').attr('src',data.userInfo.headImage);
                //     $('#nickname').text(data.userInfo.nickName);
                //     $("#show-login").addClass('logined');
                //     // 登录成功自动记录密码
                //     localStorage.username = username;
                //     localStorage.password = password;

                // }else if(data.responseCode == 201){
                //     alert('用户信息不全，请先完善个人信息');
                //     opener('http://101.37.27.68/login.jsp');
                // }else{
                //     $("#msg").text(data.error);
                // }

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
                opener(url);
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
                opener(url);
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
        


                // data.map(function(val,i){
                //     if(i < data.length - 1){
                //         $("#ad"+val.position).attr('src',val.aliPath)
                //         .click(function(){
                //             opener(val.link);
                //         }); 
                //     }else{
                //         $("#Adtxt").html(val.description)
                //         .on('click',function(){
                //             opener(val.link);
                //         })
                //     }
                    
                // })


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
    }
}