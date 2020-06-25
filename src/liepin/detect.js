export default  {
    image2Base64(img, ext) {
        var canvas = document.createElement("canvas");   //创建canvas DOM元素，并设置其宽高和图片一样
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height); //使用画布画图
        var dataURL = canvas.toDataURL("image/" + ext);  //返回的是一串Base64编码的URL并指定格式
        canvas = null; //释放
        return dataURL.substr(23);
    },
    detect(telcode, callback) {
        if (!window.appcode) return;

        GM_xmlhttpRequest({
            method: "POST",
            url: "http://gofc.saltbo.cn/detect/number",
            // url: "http://localhost:8080/detect/number",
            headers: {
                "Authorization": "APPCODE "+ window.appcode,
                "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
            },
            data: "src="+encodeURIComponent(telcode),
            responseType: "json",
            onload: (ret)=>{
                if(ret.response.status != 200){
                    console.log(ret.response.msg)
                    return
                }
    
                let telnum = ret.response.msg
                callback(telnum.replace(/[ ]/g,"").replace(/\n/g, ""))
            }
        })
    },
}