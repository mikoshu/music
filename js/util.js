var util = {
	init: function(){
        /**localstorage 用于排序，记录当前顺序每次文件增删改查后更新，如有该属性，不遍历musics文件夹**/
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
            this.renderRecentList();
        }
        if(localStorage.favoriteFile){
            favoriteFile = JSON.parse(localStorage.favoriteFile);
            this.renderFavoriteList();
        }
        file = allFile;
        /**localstorage 用于排序**/
	},
	refreshList: function(){ // 渲染全部列表
		var mainHtml = '';
        var sideListHtml = '';
		allFile.map(function(val,index){ // 遍历file数组生成html模板
            mainHtml += '<li><a href="javascript:;" data-url='+val.fileURL+' >'+val.fileName+'<span></span></a></li>'; // 主列表
            sideListHtml  +=   '<li data-url='+val.fileURL+'>'+
                                    '<p>'+val.fileName+'</p>'+
                                    '<span class="delete"></span>'+
                                    '<span class="favorite"></span>'+
                                '</li>'; // 左侧默认列表
        })
        $("#musicList").html(mainHtml); // 渲染音效列表
        $("#defaultList").html(sideListHtml); // 渲染左侧默认列表
	},
    renderDefaultList: function(){ // 单独渲染左侧默认列表
        var sideListHtml = '';
        allFile.map(function(val,index){ // 遍历file数组生成html模板
            sideListHtml  +=   '<li data-url='+val.fileURL+'>'+
                                    '<p>'+val.fileName+'</p>'+
                                    '<span class="delete"></span>'+
                                    '<span class="favorite"></span>'+
                                '</li>'; // 左侧默认列表
        })
        $("#defaultList").html(sideListHtml); 
    },
    renderRecentList: function(){
        var html = '';
        recentFile.map(function(val,index){
            html  +=   '<li data-url='+val.fileURL+'>'+
                                    '<p>'+val.fileName+'</p>'+
                                    '<span class="delete"></span>'+
                                    '<span class="favorite"></span>'+
                                '</li>'; // 最近播放列表
        })
        $("#recentList").html(html); 
    },
    renderFavoriteList: function(){
        var html = '';
        favoriteFile.map(function(val,index){
            html  +=   '<li data-url='+val.fileURL+'>'+
                                    '<p>'+val.fileName+'</p>'+
                                    '<span class="delete"></span>'+
                                    '<span class="favorite"></span>'+
                                '</li>'; // 喜欢列表
        })
        $("#favoriteList").html(html);
    },
	getTime: function (time){ // 修改时间格式
        var time = parseInt(time),m,s;
        m = parseInt(time/60);
        s = parseInt(time%60);
        m = m > 9 ? m : '0'+m;
        s = s > 9 ? s : '0'+s;
        return m+':'+s;
    },
    getMainList: function (){ // 获取当前列表
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
            file.map(function(val,index){
                if(val.fileURL == fileURL){
                    file.splice(index,1); 
                }
            })
            localStorage.file = JSON.stringify(file);
            fs.unlink(fileURL,function(err){
                if(err){
                    alert(err)
                }else{
                    alert('删除成功');
                }
                util.refreshList();
            })
            
        }
    },
    chooseStyle: function(){
        if(nowType == 'default'){
            $("#defaultList").find('li').eq(index).addClass('on').siblings('li').removeClass('on');
        }else if(nowType == 'recent'){
            $("#recentList").find('li').eq(index).addClass('on').siblings('li').removeClass('on');
        }
    }
}