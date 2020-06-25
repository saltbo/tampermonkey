// img detect

const IMGDetect = {
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

// liepin
const Liepin = {
    traceId() {
        return new Date().getTime().toString().substr(4)+Math.random().toString().substr(2, 2)
    },
    getResumeDetail(resIdEncode, callback) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://h.liepin.com/resumeview/getresumedetailcoreview.json?traceId="+this.traceId(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest"
            },
            data: "res_id_encode="+resIdEncode+"&resIdEncode="+resIdEncode,
            responseType: "json",
            onload: callback
        })
    },
    listComments(cnResIdEncode, enResIdEncode, telNotExistCallback, telExistCallback) {
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://h.liepin.com/resumeview/showcommentnextpage.json?traceId="+this.traceId(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest"
            },
            data: "resIdEncode="+cnResIdEncode+"&cnResIdEncode="+cnResIdEncode+"&enResIdEncode="+enResIdEncode+"&lastId=&lastShareId=",
            responseType: "json",
            onload: (ret) => {
                console.log(ret)
                let data = ret.response.data
                if (!data.curUserhId) {
                    telNotExistCallback()
                    return
                }

                let existTel = this.matchTelFromComments(data.commentList)
                if (existTel) {
                    telExistCallback(existTel)
                }  else if (!existTel && data.commentList.length < 10) {
                    telNotExistCallback()
                }
            }
        })
    },
    saveComment(resIdEncode, usercEncodeId, rcContext){
        if (!rcContext.match(/\b1\d{10}\b/g)){
            console.log(rcContext+" not contain a mobile number")
            return
        }
        
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://h.liepin.com/resume/savecomment.json?traceId="+this.traceId(),
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "X-Requested-With": "XMLHttpRequest"
            },
            data: "rcContext="+rcContext+"&shareFlag=&resIdEncode="+resIdEncode+"&usercEncodeId="+usercEncodeId,
            responseType: "json",
            onload: (ret)=>{
                location.reload()
            }
        })
    },
    matchTelFromComments(commentList) {
        for (let index = 0; index < commentList.length; index++) {
            const comment = commentList[index];
            let ret = comment.rcContext.match(/\b1\d{10}\b/g)
            if (ret) {
                return ret.pop()
            }
        }
    },
}

// ERP
const KrERP = {
    setAccessToken(){
        let u = JSON.parse(localStorage.currentUser)
        GM_setValue("userName", u.userName)
        GM_setValue("accessToken", u.accessToken)
    },
    
    search(tel, callback){
        let userName = GM_getValue("userName")
        let accessToken = GM_getValue("accessToken")
        if(!accessToken) {
            return
        }
    
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://cts530.careerintlinc.com/cts/v1.0/candidate/web/query/page/es?timestamp="+new Date().getTime(),
            headers: {
                "Content-Type": "application/json",
                "accessToken": accessToken,
                "userName":userName
            },
            data: '{"status":0,"stock":true,"resumeType":0,"searchKeys":{"Mobile":"'+tel+'"},"asc":true,"orderByField":"","arbitrary":false,"limit":10,"page":1}',
            responseType: "json",
            onload: (ret)=>{
                if(ret.response.code!=200){
                    GM_deleteValue("accessToken")
                    alert("ERP未登录或已过期，请登录ERP并刷新任意页面")
                    return
                }
    
                callback(ret.response.result.total)
            }
        })
    }
}

function detectPhoneAndMark(){
    let urlParams = new URLSearchParams(location.search);
    let resIdEncode = urlParams.get("res_id_encode")
    console.log(resIdEncode)

    Liepin.getResumeDetail(resIdEncode, (ret)=>{
        let resume = ret.response.data;
        Liepin.listComments(resume.cnResIdEncode, resume.enResIdEncode, () => {
            // 没有备注过的，自动识别手机号码并备注
            let telcode = IMGDetect.image2Base64($(".connect-img")[0], "jpeg")
            IMGDetect.detect(telcode, (tel)=>{
                let rcContext = resume.showName +"："+ tel
                Liepin.saveComment(resIdEncode, resume.usercIdEncode, rcContext)
            })
        }, (existTel) => {
            // 已经备注过的，显示出入库状态
            KrERP.search(existTel, function(ret) {
                let tagText = "未知"
                if(ret){
                    tagText = "已入库"
                } else {
                    tagText = "未入库"
                }

                $(".name-box").append('<span class="user-status-tag">'+tagText+'</span>')
            })
        })
    });
}


(function() {
    'use strict';

    function run() {
        if(location.host == "cts530.careerintlinc.com"){
            KrERP.setAccessToken();
            return
        }

        if(location.host == "h.liepin.com"){
            // 自动下载简历
            let btn = $(".rd-icon-btn")[0];
            if (btn.innerText == "免费下载联系方式") {
                btn.click();
                setTimeout(()=>{
                    // 关闭弹窗
                    $(".hunt-modal-content button.hunt-btn.default").click();

                    // 识别手机号并备注
                    detectPhoneAndMark();
                }, 500)
                return
            }

            // 单独处理下载过，但是未备注的情况
            detectPhoneAndMark();
        }
    }

    window.addEventListener('load', run, false);
})();