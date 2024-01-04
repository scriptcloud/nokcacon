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

    #menuLink10:has(.live) {
        background-color: ${color};
        border-radius: 10px;
        box-shadow: 0 0 10px 5px ${color}cc;
    }

    .live-icon {
        margin-bottom: 2px;
        margin-left: 5px;

        display: inline-block;
        background: linear-gradient(to right, #ff6e54, #ff4947); /* Gradient background */
        border-radius: 8px; /* Slightly softer edges */
        height: 16px; /* Slightly larger size */
        width: 35px;

        font-size: 12px; /* Increased font size */
        letter-spacing: 0.5px;
        color: #fff;

        text-align: center;
        line-height: 16px;
        vertical-align: middle;

        font-weight: bold; /* Bolder text */
        text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25); /* Subtle text shadow */
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15); /* Subtle shadow */

        /* Alternative animation: Pulsing effect */
        animation: pulse 1.5s infinite ease-in-out alternate;
        animation-delay: 0.5s;

        &:hover {
            opacity: 80%;
        }

        &:not(.live) {
            display: none;
        }
    }

    @keyframes pulse {
        from { transform: scale(1); }
        to { transform: scale(1.1); }
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

function LiveCheck() {
    this.prevStatus = undefined;

    this.check = async (liveElement) => {
        const result = await fetch("https://asia-northeast3-nokcacon.cloudfunctions.net/getLatestData");
        const livedata = await result.json();
        const status = livedata.status;
        const streamTitle = livedata.title;
        //console.log("status: ", status);
        
        if(this.prevStatus === status) { // do nothing when status same. runs on initial visit (undefined -> open/close)
        } else { //if (status === "OPEN" || status === "CLOSE") : exception when status is something else
            if(status === "OPEN") {
                $(liveElement).addClass("live"); // css 토글
            } else if (status === "CLOSE") {
                $(liveElement).removeClass("live");
            }
            if(this.prevStatus !== undefined // don't notify on initial visit
               && Notification.permission === "granted") { // only when permission granted
                let title = {
                    "OPEN": "오방있 ㅇㅅㅇ",
                    "CLOSE": "오늘은 여기까지. q2",
                };
                notify(title[status], streamTitle); 
            }
        }
        this.prevStatus = status;
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

if(!(Notification.permission === "granted") && !(Notification.permission === "denied")) {
    alert("방송 알림을 받으려면 허용을 눌러주세요. 녹두로 카페가 열려있을 때 방송이 시작하면 1분 내로 알림을 받습니다. 설정에서 언제든지 끄고 켤 수 있습니다. 차단시 알림을 보내지 않습니다.")
    Notification.requestPermission();
    //비동기적으로 permisson 받고 필요할때 직접 접근해서 체크
}

const youtube = waitForElm("#menuLink20").then(youtube => youtube.innerHTML = `<i class="fa-brands fa-youtube" style="color:red; height: 1em;width: 1em;"></i>` + youtube.innerText.slice(2));

const streamContainer = waitForElm("#menuLink10").then(streamContainer => {
    streamContainer.innerHTML = `<img src="https://ssl.pstatic.net/static/nng/glive/icon/favicon.png" style="width: auto; display: inline-block; height: 1em; width: 1em;vertical-align: text-top;"/>` + streamContainer.innerText.slice(2);

    const liveElement = document.createElement("div");
    liveElement.textContent = "live";
    liveElement.className = "live-icon";
    streamContainer.appendChild(liveElement)

    const liveCheck = new LiveCheck();
    console.log("liveCheck: ", liveCheck);

    liveCheck.check(liveElement); //
    setInterval(()=>{
        liveCheck.check(liveElement);
    }, 60000);
});


const url = "https://chzzk.naver.com/live/6e06f5e1907f17eff543abd06cb62891/";
document.addEventListener("notificationclick", (event) => {
    console.log("On notification click: ", event.notification.tag);
    event.notification.close();
    window.open(url, '_blank').focus();
});