var util = {
	init: function(){
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

        file = allFile;
        /**localstorage 用于排序**/
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
        fileArr.map(function(val,index){
            var favoriteClass = util.isFavorited(val.fileURL)? 'favorited' : 'favorite'; // 判断该音效是否存在favorite列表，修改样式
            html  +=   '<li data-url='+val.fileURL+'>'+
                            '<p>'+val.fileName+'</p>'+
                            '<span class="delete"></span>'+
                            '<span class="'+favoriteClass+'"></span>'+
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
        if(sure){
            allFile.map(function(val,index){
                if(val.fileURL == fileURL){
                    file.splice(index,1); 
                    return
                }
            })
            localStorage.file = JSON.stringify(allFile);
            recentFile.map(function(val,index){
                if(val.fileURL == fileURL){
                    recentFile.splice(index,1); 
                    return
                }
            })
            localStorage.recentFile = JSON.stringify(recentFile);
            favoriteFile.map(function(val,index){
                if(val.fileURL == fileURL){
                    favoriteFile.splice(index,1); 
                    return
                }
            })
            localStorage.favoriteFile = JSON.stringify(favoriteFile);
            fs.unlink(fileURL,function(err){
                if(err){
                    alert(err)
                }else{
                    alert('删除成功');
                }
                util.refreshList();
                util.renderSideList('recentList',recentFile);
                util.renderSideList('favoriteList',favoriteFile);
            })
            
        }
        return sure
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
    }
}