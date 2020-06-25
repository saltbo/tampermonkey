// ERP
export default {
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