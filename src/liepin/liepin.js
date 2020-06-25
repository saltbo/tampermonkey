export default {
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