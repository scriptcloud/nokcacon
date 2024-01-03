// ==UserScript==
// @name         GMnot
// @namespace    http://tampermonkey.net/
// @version      0.21
// @description  try to take over th
// @author       Yu
// @match        https://cafe.naver.com/nokduro*
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// ==/UserScript==

const colorcode = `
    // 80%는 16진수로 약 c0/cc
    target: background-color,
    naver: #02c75a, /* 투명도 */
    lime: #d9f6e9, /* 연한 파스텔톤 연두색 */
    gray: lightgray,
    background-color: #d9f6e9;
    box-shadow : rgba(217, 246, 233, 0.8) = #d9f6e9cc;  /* 투명도 0.8 */
    yellowish #e1fcd7
`;

const color = `#e1fcd7`; //

GM_addStyle(`


    #menuLink10:has(.live) {
       background-color: ${color};
       border-radius: 10px;
       box-shadow: 0 0 10px 5px ${color}cc;
    }


    .live {
      margin-bottom: 2px;
      margin-left: 2px;

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
    }

    @keyframes pulse {
      from { transform: scale(1); }
      to { transform: scale(1.1); }
    }

    .live:hover {
        opacity: 80%;
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
        const status = livedata.status, streamTitle = livedata.title;
        console.log("status: ", status);

        if(this.prevStatus === status) { // do nothing when status same. runs on initial visit (undefined -> open/close)
        } else { //if (status === "OPEN" || status === "CLOSE") : exception when status is something else
            if(status === "OPEN") {
                $(liveElement).show(); }
            else if (status === "CLOSE") {
                $(liveElement).hide(); }
            if(this.prevStatus === undefined
               && Notification.permission === "granted") {
                let title = {
                    "OPEN": "오방있 ㅇㅅㅇ",
                    "CLOSE": "오늘은 여기까지. q2",
                };
                notify(title[status], streamTitle); // don't notify on initial visit, only when permission granted
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
    setTimeout(notification.close.bind(notification), 10000);
}

/////// MAIN ////////

if(!(Notification.permission === "granted")) {
    alert("방송이 시작할 때 알림을 받으려면 알림 허용을 눌러주세요. 녹두로 카페가 열려있을 때 방송이 시작하면 1분 내로 알림을 받습니다.")
    Notification.requestPermission();
    //비동기적으로 permisson 받고 필요할때 직접 접근해서 체크
}
waitForElm("#menuLink10").then( element => {
    const streamContainer = element;

    const liveElement = document.createElement("div");
    liveElement.textContent = "live";
    liveElement.className = "live";
    streamContainer.appendChild(liveElement)

    const liveCheck = new LiveCheck();
    console.log("liveCheck: ", liveCheck);
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