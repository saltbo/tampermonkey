import IMGDetect from './detect'
import Liepin from './liepin'
import KrERP from './krerp'

(function() {
    'use strict';

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

    function run() {
        console.log(window.appcode)
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