export default {
    bootstrap() {
        // 自动登录后只能跳到首页，这里自动跳去领取页
        if(location.host == "my.qidian.com" && location.pathname == "/"){
            location.pathname = "/level"
            return
        }

        // 当打开的页面是经验值领取页则自动领取经验值
        if(location.host == "my.qidian.com" && location.pathname == "/level"){
            const expGet = function(){
                let expList = document.getElementsByClassName("elGetExp");
                if (expList.length > 0) {
                    expList[0].click();
                }
            }
            window.addEventListener('load', expGet, false);
            return
        }
        window.addEventListener('load', this.progress, false);
    },
    progress() { 
        // 计算逻辑，每次打开任意网页时执行，上次领取时间间隔满足领取条件则自动打开经验值领取页
        let timeIntervals = [0, 300, 600, 1200, 1800, 3600, 3600, 3600]
        let todayKey = "today"
        let todayCntKey = "today_cnt"
        let lastCheckTimeKey = "last_check_time"
        let nowDate = new Date()
        let nowTime = nowDate.getTime();
        let today = nowDate.getDay();

        // 如果今天已经领完了则不再继续领
        if(GM_getValue(todayKey, 0) == today){
            return
        }

        let todayCnt = GM_getValue(todayCntKey, 0)
        let lastCheckTime = GM_getValue(lastCheckTimeKey, nowTime)
        let nowInterval = (nowTime-lastCheckTime)/1000

        console.log("QidianTimer: ", nowInterval, timeIntervals[todayCnt])
        if(nowInterval >= timeIntervals[todayCnt]){
            let tab = GM_openInTab("https://my.qidian.com/level", true)
            setTimeout(tab.close, 5000)
            todayCnt++
            if(todayCnt >= timeIntervals.length){
                todayCnt = 0
                GM_setValue(todayKey, today)
            }

            GM_setValue(todayCntKey, todayCnt)
            GM_setValue(lastCheckTimeKey, nowTime)
        }
    }
};