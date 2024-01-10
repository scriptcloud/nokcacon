// ==UserScript==
// @name         녹라이브
// @namespace    http://www.github.com/scriptcloud
// @version      1.0.5
// @description  방송이 시작하면 녹두로카페 메뉴에 방송 여부와 함께 방송 시간을 표시합니다. 녹두로월드 새 영상 업로드도 표시되며, 마우스를 올리면 썸네일과 영상 제목, 업로드 시간 등을 볼 수 있습니다.
// @author       pperero
// @updateURL    https://github.com/scriptcloud/nokcacon/raw/main/dist/liveWatcher.user.js
// @downloadURL  https://github.com/scriptcloud/nokcacon/raw/main/dist/liveWatcher.user.js
// @match        https://cafe.naver.com/nokduro*
// @grant        GM_addStyle
// @run-at       document-start
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// ==/UserScript==


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
        const data = await this.loadData();
        
        this.updateChzzkStatus(data).then((chzzkData) => {
            this.updateChzzkTime();
            this.chzzkLink.title = chzzkData.liveCategory;
        });
        this.updateYoutubeStatus(data.youtubeData).then((youtubeData) => {
            this.youtubeLink.title = data.liveTitle;
        });

        setTimeout(this.update, 60000); 
    }

    this.updateChzzkTime = () => {
        if(!this.openTime) return;
        const timeHTML = this.getTimeHTML(this.openTime);
        $(this.chzzkBadge).children()[1].innerHTML = timeHTML;
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
        const data = await result.json();
        return data;
    }

    this.updateChzzkStatus = async (chzzkData) => {
        const status = chzzkData.status;
        const streamTitle = chzzkData.liveTitle;
        if(this.chzzkPrevStatus === status) { 
        } else { 
            if(status === "OPEN") {
                $(this.chzzkBadge).addClass("active"); 
                this.openTime = new Date(chzzkData.openDate);
            } else if (status === "CLOSE") {
                $(this.chzzkBadge).removeClass("active");
            }
            if(this.chzzkPrevStatus !== undefined 
               && Notification.permission === "granted") { 
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
                $(this.youtubeBadge).addClass("active"); 
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
    setTimeout(notification.close.bind(notification), 10000); 
}

if(!(Notification.permission === "granted") && !(Notification.permission === "denied")) {
    alert("방송 알림을 받으려면 허용을 눌러주세요. 녹두로 카페가 열려있을 때 방송이 시작하면 1분 내로 알림을 받습니다. 설정에서 언제든지 끄고 켤 수 있습니다. 차단시 알림을 보내지 않습니다.")
    Notification.requestPermission();
    
}
const url = "https://chzzk.naver.com/live/6e06f5e1907f17eff543abd06cb62891/";
document.addEventListener("notificationclick", (event) => {
    event.notification.close();
    window.open(url, '_blank').focus();
});

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
