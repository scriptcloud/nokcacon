// ==UserScript==
// @name         GMnot
// @namespace    http://tampermonkey.net/
// @version      0.21
// @description  try to take over th
// @author       Yu
// @match        https://cafe.naver.com/nokduro*
// @grant        GM_addStyle
// @run-at       document-start
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// ==/UserScript==


/*
    transparency 80% = c0/cc (hex)
    naver: #02c75a
    lime: #d9f6e9 // 연한 파스텔톤 연두색 
    #d9f6e9cc = rgba(217, 246, 233, 0.8) // 투명도  0.8
    gray: lightgray
    yellowish #e1fcd7
*/

const color = `#e1fcd7`;

GM_addStyle(`

    #menuLink10:has(.active) {
        background-color: ${color};
        border-radius: 10px;
        box-shadow: 0 0 10px 5px ${color}cc;
    }

    .status-icon {
        background: linear-gradient(to right, #fff, #eff);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border-radius: 0.8em;

        display: inline-block;
        vertical-align: text-top;
        line-height: 1.2;
        padding: 0 0.3em;
        margin-left: 3px;

        > span {
            padding-left: 2px;
        }
        &:hover {
            opacity: 80%;
        }
        &.live-icon {
            color: green;
            .colon {
                animation: blinker 2s linear infinite;
            }
            font-weight: 600;
        }
        &.new-icon {
            font-weight: regular;
            color: white;
            background: linear-gradient(to right, #ff6e54, #ff4947);
            font-size: .5rem;
            line-height: 12px;
            animation: pulse 1.5s infinite ease-in-out alternate;
        }
    }

    @keyframes blinker {  
        50% { opacity: 0; }
    }

    @keyframes pulse {
        from { transform: scale(1); backface-visibility: hidden;}
        to { transform: scale(1.05); backface-visibility: hidden;}
    }

    .emoji {
        display: inline-block;
        height: 1em;
        width: 1em;
        vertical-align: text-top;
        object-fit: contain; 
    }

`);

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function StatusUpdater(chzzkLink, youtubeLink) {
    this.chzzkLink = chzzkLink;
    this.youtubeLink = youtubeLink;
    this.chzzkBadge = $(this.chzzkLink).find("span")[0];
    this.youtubeBadge = $(this.youtubeLink).find("span")[0];
    this.chzzkPrevStatus = undefined;
    this.youtubePrevStatus = undefined;
    this.openTime = undefined;

    this.update = async () => {
        console.log("update!(1min)");
        const data = await this.loadData();
        //console.log("data: ", this.data);
        this.updateChzzkStatus(data).then((chzzkData) => {
            this.updateChzzkTime();
            this.chzzkLink.title = chzzkData.liveCategory;
            console.log(chzzkData.liveTitle);
            console.log(chzzkData.liveImageUrl.replace("{type}", "720"));
        });
        this.updateYoutubeStatus(data.youtubeData).then((youtubeData) => {
            this.youtubeLink.title = data.liveTitle;
        });

        setTimeout(this.update, 60000); // loop every 1min
    }

    this.updateChzzkTime = () => {
        console.log("openTime: ", this.openTime);
        if(!this.openTime) return;
        const timeHTML = this.getTimeHTML(this.openTime);
        $(this.chzzkBadge).children()[1].innerHTML = timeHTML;
        console.log($(this.chzzkBadge).find("span"));
    }

    this.getTimeHTML = (openTime) => {
        const uptime = Math.abs(new Date() - openTime);
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        if (hours === 0 && minutes < 30) {
          return `${minutes}분`;
        }
        const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
        return `${formattedHours}<span class="colon">:</span>${formattedMinutes}`;
    }

    this.loadData = async () => {
        const result = await fetch("https://asia-northeast3-nokcacon.cloudfunctions.net/getLatestData");
        console.log("result: ", result);
        const data = await result.json();
        return data;
    }

    this.updateChzzkStatus = async (chzzkData) => {
        const status = chzzkData.status;
        const streamTitle = chzzkData.liveTitle;
        if(this.chzzkPrevStatus === status) { // do nothing when status same. runs on initial visit (undefined -> open/close)
        } else { //if (status === "OPEN" || status === "CLOSE") : exception when status is something else
            if(status === "OPEN") {
                $(this.chzzkBadge).addClass("active"); // css 토글
                this.openTime = new Date(chzzkData.openDate);
                console.log("initial visit - openTime: ", this.openTime);
            } else if (status === "CLOSE") {
                $(this.chzzkBadge).removeClass("active");
            }
            if(this.chzzkPrevStatus !== undefined // don't notify on initial visit
               && Notification.permission === "granted") { // only when permission granted
                let title = {
                    "OPEN": "오방있 ㅇㅅㅇ",
                    "CLOSE": "오늘은 여기까지. q2",
                };
                notify(title[status], streamTitle);
            }
        }
        this.chzzkPrevStatus = status;
        return chzzkData;
    }

    this.updateYoutubeStatus = async (youtubeData) => {
        if(!youtubeData) return;

        const status = youtubeData.status;
        const streamTitle = youtubeData.title;
        if(this.youtubePrevStatus === status) {
        } else {
            if(status === "OPEN") {
                $(this.youtubeBadge).addClass("active"); // css 토글
            } else if (status === "CLOSE") {
                $(this.youtubeBadge).removeClass("active");
            }
        }
        this.youtubePrevStatus = status;
    }
}

function notify(title, msg) {
    const notification = new Notification(
        title,
        {
            body: msg,
            tag:  "live_alarm",
            icon: "https://ssl.pstatic.net/static/nng/glive/icon/favicon.png"
    });
    setTimeout(notification.close.bind(notification), 10000); // 10s
}

/////// MAIN ////////

/* 미친 녹두로 바로가기 루프
if (window.location.href === "https://cafe.naver.com/MyCafeIntro.nhn?clubid=31103664") {
    const link = document.createElement("a");
    link.href = "https://cafe.naver.com/nokduro";
    link.innerText = "녹두로 바로가기";
    link.style = "font-size: 2rem; color: red; font-weight: bold; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);";
    document.body.appendChild(link);
    return;
}
*/

if(!(Notification.permission === "granted") && !(Notification.permission === "denied")) {
    alert("방송 알림을 받으려면 허용을 눌러주세요. 녹두로 카페가 열려있을 때 방송이 시작하면 1분 내로 알림을 받습니다. 설정에서 언제든지 끄고 켤 수 있습니다. 차단시 알림을 보내지 않습니다.")
    Notification.requestPermission();
    //비동기적으로 permisson 받고 필요할때 직접 접근해서 체크
}
const url = "https://chzzk.naver.com/live/6e06f5e1907f17eff543abd06cb62891/";
document.addEventListener("notificationclick", (event) => {
    console.log("On notification click: ", event.notification.tag);
    event.notification.close();
    window.open(url, '_blank').focus();
});




// 이렇게 말고 비동기 업데이트 로직과 렌더링 로직을 분리해야
// 사이트 첫 로딩시 거의 딜레이 없이 즉각적으로 화면에 표시됨.
const badge1 = waitForElm("#menuLink10").then(chzzkLink => {
    chzzkLink.innerHTML = `<img class="emoji" src="https://ssl.pstatic.net/static/nng/glive/icon/favicon.png"/>` + chzzkLink.innerText.slice(2);
    $("<span>")
        .append(`<i class="fa-regular fa-clock" style="width:.8em;"></i> <span>00:00</span>`)
        .addClass("status-icon live-icon")
        .appendTo(chzzkLink);
    return chzzkLink;
});
const badge2 = waitForElm("#menuLink20").then(youtubeLink => {
    youtubeLink.innerHTML = `<i class="fa-brands fa-youtube emoji" style="color:red;"></i>${youtubeLink.innerText.slice(2)}`;
    youtubeLink.title = "n시간 전: 영상 제목";
    $("<span>").text("new")
        .addClass("status-icon new-icon")
        .appendTo(youtubeLink);
    return youtubeLink;
});

Promise.all([badge1, badge2]).then(([chzzkLink, youtubeLink]) => {
    const statusUpdater = new StatusUpdater(chzzkLink, youtubeLink);
    statusUpdater.update();
});
