var util = {
	init: function(){
        /**localstorage 用于排序，记录当前顺序每次文件增删改查后更新，如有该属性，不遍历musics文件夹**/
        if(localStorage.file){
            file = JSON.parse(localStorage.file);
        }else{
            var dir = fs.readdirSync(musicURL);
            dir.forEach(function(val){ // 遍历musics文件夹里的文件，默认只有一级目录，子目录没做处理
                var obj = {};
                obj.fileURL = path.join(musicURL, val);
                var name = val.split(".");
                name.pop();
                obj.fileName = name.join('.');
                file.push(obj); // 将遍历结果放入file数组
            });
            localStorage.file = JSON.stringify(file);
        }
        /**localstorage 用于排序**/
	},
	refreshList: function(){ // 渲染列表
		var html = '';
		file.map(function(val,index){ // 遍历file数组生成html模板
            html += '<li><a href="javascript:;" data-url='+val.fileURL+' >'+val.fileName+'<span></span></a></li>'; 
        })
        $("#musicList").html(html); // 渲染音效列表
	},
	getTime: function (time){ // 修改时间格式
        var time = parseInt(time),m,s;
        m = parseInt(time/60);
        s = parseInt(time%60);
        m = m > 9 ? m : '0'+m;
        s = s > 9 ? s : '0'+s;
        return m+':'+s;
    },
    getRightList: function (){ // 获取当前列表
        var arr = [];
            $("#musicList").find('li').each(function(index,val){
                var obj = {};
                obj.fileName = $(val).find('a').text();
                obj.fileURL = $(val).find('a').attr('data-url');
                arr.push(obj);
            })
            file = arr;
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
    }
}