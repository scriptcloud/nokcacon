// ==UserScript==
// @name         녹카콘
// @namespace    http://www.github.com/scriptcloud
// @version      2.0.5
// @description  녹두로 카페 전용 댓글 이모티콘 확장프로그램 녹-카콘. 댓글 이모티콘 입력, 추천버튼 모양 변경, 방송 알림 및 업타임 표시 기능을 지원합니다.
// @author       pperero
// @updateURL    https://github.com/scriptcloud/nokcacon/raw/main/dist/nokcacon.user.js
// @downloadURL  https://github.com/scriptcloud/nokcacon/raw/main/dist/nokcacon.user.js
// @match        https://cafe.naver.com/ArticleRead.nhn*
// @match        https://cafe.naver.com/ca-fe/ArticleRead.nhn*
// @match        https://cafe.naver.com/ca-fe/cafes*
// @match        https://cafe.naver.com/nokduro*
// @icon         https://pub-945ee597288a43329a299345ecb0188d.r2.dev/sungo/half_egg.png
// @grant        GM_addStyle
// @grant        GM_notification
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @require      https://pub-945ee597288a43329a299345ecb0188d.r2.dev/all.min.js
// ==/UserScript==


let source = "https://pub-945ee597288a43329a299345ecb0188d.r2.dev", query = "";

GM_addStyle(`

    .nokcacon {
        display: inline-block;
        vertical-align: top;
        margin-left: 16px;

        width: 18px;
        height: 18px;

        &:hover {
            opacity: 0.7;
        }
    }

    .nokcacon > img {
        width: 100%;
        height: 100%;
    }

    .mainScreen {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 10;

        transition: left top 0.2s ease-in-out;

        display: flex;
        flex-direction: column;

        overflow: hidden;
        width: 458px;
        height: 385px;
        border: 1px solid #9b9b9b;
        background: #fff;
    }

    .menuView {
        flex-shrink: 0;
        height: 50px;
        width: 100%;

        overflow: hidden;
     }

    .menuList {
        display: flex;
        width: 100%;
        height: 100%;
        white-space: nowrap;
    }
    .menuBtn {
        display: flex;
        align-items: center;
        justify-content: center;

        width: 60px;
        flex-shrink: 0;
        height: 100%;

        cursor: pointer;
        font-size: 10px;
        border-right: 1px solid #d1d3d8;
        box-shadow: 0 -3px 2px -2px #d1d3d8 inset;
    }
    .menuBtn::last {
        border-right: none;
    }
    .menuBtn.selected {
        box-shadow: 0 0 8px -1px #d1d3d8;
        z-index: 30;
        background-color: white;
    }
    .menuBtn > img {
        width: 45px;
    }

    .conView {
        flex-grow: 1;
        width: 100%;
        margin-top: 5px;

        overflow: overlay;
        overflow-x: hidden;
        background: repeating-linear-gradient(45deg, white, white 8px, #eee 10px);
    }
    .conList {
        display: none;
        width: 100%;
        grid-template-columns: repeat(5, 1fr);
        gap: 3px;

        text-align: center;
    }
    .conList.selected {
        display: grid;
    }

    .conBtn {
        width: 100%;
        position: relative;
        cursor: pointer;
        border: 1px solid white;
        text-align: left;
    }
    .conBtn:hover > img {
        width: 103%;
        transition: 0.1s;
    }
    .conBtn::after {
        display: block;
        content: "";
        padding-bottom: 100%;
    }
    .conBtn > img{
        position: absolute;
        width: 100%;
        height: auto;

        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }

    .emptyScreen {
        position: absolute;
        inset: 50px 0 0 0;
        margin: auto;

        width: 150px;
        height: 50px;
    }

    .article_end {
        width: 100%;
        display: none;
        justify-content: center;
        margin-top: 50px;

        &.enabled {
            display: flex;
        }
    }

    .recommend-button {
        display: inline-block;
        height: 34px;
        padding: 6px 8px;
        box-sizing: border-box;

        font-size: 14px;
        font-weight: 400;
        text-align: center;
        white-space: nowrap;
        vertical-align: middle;
        font-family: 'Nanum Gothic', sans-serif;

        cursor: pointer;
        border-radius: 4px;
        border: 1px solid #d9534f;
        color: #d9534f;
        background-color: transparent;

        &:hover, &.on {
            color: #ffffff;
            background-color: #d9534f;
            border-color: #d9534f;

            .text, .count {
                color: #ffffff;
            }
        }
    }

    .recommend-toggle {
        margin-right: 10px;
        display: inline-block;
    }

    .like_article.enabled {
        color: lightgray;

        & .u_ico {
            visibility: hidden;
            position: absolute;
        }
    }

`);

function createCorsElement(type) {
    const elem = document.createElement(type);
    elem.crossOrigin = "anonymous";
    return elem;
}

function waitForElm(selector, where = document.body) {

    return new Promise(resolve => {
        const localElem = $(where).find(selector)[0];
        if (localElem) {
            return resolve(localElem);
        }
        const observer = new MutationObserver(mutations => {
            const localElement = $(where).find(selector)[0];
            if (localElement) {
                observer.disconnect();
                resolve(localElement);
            }
        });
        observer.observe(where, {
            childList: true,
            subtree: true
        });
    });
}

function isUrlInDomain (url, domain) {
    return url.startsWith(`https://${domain}/`) ||
    url.startsWith(`https://${domain}?`) ||
    url.startsWith(`https://${domain}`) ||
    url.startsWith(`http://${domain}/`) ||
    url.startsWith(`http://${domain}?`) ||
    url.startsWith(`http://${domain}`);
}

async function Recommend() {

    const oldLikeDiv = await waitForElm("div.like_article"); 
    const [oldLikeBtn, myLikeInfo] = await Promise.all([
        waitForElm(".u_ico"),
        waitForElm("a.u_likeit_list_btn") 
    ]);
    this.oldLikeText = $(oldLikeBtn).next(); 
    
    const likeBtn = newLikeBtn();
    likeBtn.on("click", ()=>{
        $(oldLikeBtn).click();
    });
    
    const likeDiv= $("<div>").addClass("article_end").append(likeBtn);
    waitForElm('.article_viewer').then(element=>{
        $(element).after(likeDiv);
    });
    
    const likeToggleBtn = newToggleBtn();
    
    likeToggleBtn.prependTo(("div.ArticleTool"));
    
    let enabled = null;

    const updater = setUpdater(this.oldLikeText);
    const option = new Option();
    if(optionLoad()) {
        enableLike();
        runUpdater(updater, this.oldLikeText);
    } else {
        disableLike();
        stopUpdater(updater, this.oldLikeText);
    }

    function optionLoad() {
        
        return localStorage.getItem('recommend') === 'false' ? false : true;
    }
    function optionSave() {
        localStorage.setItem('recommend', enabled);
    }

    function newLikeBtn() {
        const button = $("<button>").addClass("recommend-button");
        button.title = "이 글 좋아요 클릭"
        button.append(`<i class='icon fas fa-heart'></i>
                        <span class='text'>추천</span>
                        <span class='count'>...</span>`);
        return button;
    }

    function newToggleBtn() {
        const button = $("<button>").addClass("recommend-toggle");
        button.append(`<i class='icon fas fa-arrows-rotate'></i>`);
        button.title = "추천버튼 활성화/비활성화"
        button.on("click", ()=> {
            enabled ? disableLike() : enableLike(); 
        });
        return button;
    }

    function enableLike() {
        $(likeToggleBtn).addClass("enabled");
        $(oldLikeDiv).addClass("enabled");
        $(likeDiv).addClass("enabled");
        runUpdater(updater, this.oldLikeText);
        enabled = true;
        optionSave();
    }
    
    function disableLike() {
        $(likeToggleBtn).removeClass("enabled");
        $(oldLikeDiv).removeClass("enabled");
        $(likeDiv).removeClass("enabled");
        stopUpdater(updater, this.oldLikeText);
        enabled = false;
        optionSave();
    }

    function setUpdater(likers) {

        const count = likers.next();
        const counter = likeBtn.find("span.count");
        
        const observer = new MutationObserver(mutations => {
            
            if(likers.text() === "좋아요") {
                likers.text("추천수");} 
            counter.text(count.text()); 
            $(myLikeInfo).hasClass("on") ?
                likeBtn.addClass("on") : likeBtn.removeClass("on"); 
        });
        return observer;
    }

    function runUpdater(observer, likers) {
        likers.text("추천수"); 
        observer.observe(oldLikeDiv, {
            childList: true,
            subtree: true
        });
    }

    function stopUpdater(observer, likers) {
        if(observer) {
            likers.text("좋아요"); 
            observer.disconnect();
        } else { }
    }
}

function getMainScreen() {
    const mainscreen = $("<div>").addClass("mainScreen");

    const menuView = $("<div>").addClass("menuView");
    const menuList = $("<ul>").addClass("menuList");
    enableDragScroll(menuView);
    menuView.append(menuList);
    const conView = $("<div>").addClass("conView");

    mainscreen.append(menuView);
    mainscreen.append(conView);

    const menuListData = [
        { type: "nokConut", name: "녹코넛", png: 37, gif: 0 },
        { type: "nokEgg", name: "달걀티콘", png: 18, gif: 0 },
        { type: "nokBoong", name: "녹붕콘", png: 29, gif: 0 },
        { type: "nokOfficial", name: "녹두로콘", png: 27, gif: 3 },
        { type: "nokGIF", name: "녹gif", png: 0, gif: 33 },
        { type: "nokDDai", name: "따이티콘", png: 36, gif: 0 },
        { type: "nokBlack", name: "검은앵무", png: 42, gif: 7 },
        { type: "nokJang", name: "녹장콘", png: 50, gif: 0 },
        { type: "nokTrick", name: "녹트릭콘", png: 13, gif: 0 }
      ];
     
    for (const data of menuListData) {
        const menuBtn = document.createElement("li");
        menuBtn.className = "menuBtn";
         
        const conType = menuBtn.dataset.conType = data.type;
        const name = menuBtn.dataset.name = data.name;
        const png = menuBtn.dataset.png = data.png;
        const gif = menuBtn.dataset.gif = data.gif;

        menuBtn.title = name;

        if (png + gif == 0) menuBtn.textContent = name;
        const extension = png ? "png" : (gif ? "gif" : false);
         
        if (extension) {
            const thumbnail = createCorsElement("img");
            thumbnail.src = `${source}/${conType}/1.${extension}${query}`;  
            thumbnail.setAttribute("draggable", false);
            menuBtn.appendChild(thumbnail);
        }

        const conList = makeConList(menuBtn);
        conView.append(conList);
        if(conType === 'nokConut') {
            $(menuBtn).addClass('selected');
            $(conList).addClass('selected');
        };
        menuList.append(menuBtn);
    }

    menuView.on("click", ".menuBtn", function() { 
        menuList.children().removeClass('selected');
        $(this).addClass('selected'); 
        conView.children().removeClass('selected');
        const conList = conView.find(`.${this.dataset.conType}`);
        conList.addClass('selected');

        conView.scrollTop = 0;
    });

    enableDragScroll(menuView);

    return mainscreen[0]; 
}

function makeConList(menu) {
    const conType = menu.dataset.conType;
    const pngNum = menu.dataset.png;
    const gifNum = menu.dataset.gif;
     
    const conlist = $("<ul>").addClass(`conList ${conType}`);

    if (!pngNum && !gifNum) {
        const empty = document.createElement("div");
        empty.className = "emptyScreen";

        const img = createCorsElement("img");
        img.src = `${source}/eggSungo.png${query}`;
        img.style = "margin-top: auto, margin-bottom: 20px;"

        const txt = document.createElement("p");
        txt.textContent = "이곳은 너무 조용합니다..."
        txt.style = "margin-bottom: auto;"

        conlist.append(empty);
        empty.appendChild(img);
        empty.appendChild(txt);
    }

    const numInfo = [
        { extension: "png", number: pngNum },
        { extension: "gif", number: gifNum }
    ]
    for(const info of numInfo) {
        const conType = menu.dataset.conType;
        const extension = info.extension;
        const number = info.number;

        for (let index = 1; index <= number; index++) {
            const conbutton = document.createElement("li");
            conbutton.className = "conBtn";
             
            const conimage = createCorsElement("img");
            conimage.src = `${source}/${conType}/${index}.${extension}${query}`;
            conbutton.appendChild(conimage);
            conlist.append(conbutton);

            conbutton.dataset.src = conimage.src;
        }
    }

    return conlist;
}

function enableDragScroll(slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    slider = slider[0];

    slider.addEventListener('mousedown', e => {

        isDown = true;
        slider.classList.add('active');
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
    });

    slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.classList.remove('active');
    });

    slider.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = x - startX;
        slider.scrollLeft = scrollLeft - walk;
    });
}

class commentArea {
    constructor (writer, mainScreen) {
        this.screenAnchor = null;
        this.iconArea = null;
        this.fileInput = null;

        this.area = writer;
        this.nokcacon = this.Nokcacon();

        $(this.area).on("click", ".nokcacon", (e)=> { 
            const currentNcc = mainScreen.currentWriter?.nokcacon; 
            if(!currentNcc) mainScreen.currentWriter = this; 

            if (currentNcc === this.nokcacon) { 
                if ($(currentNcc).hasClass("active")) { 
                    mainScreen.hide();
                    $(currentNcc).removeClass("active");
                    $(currentNcc).children().attr("src", `${source}/sungo/egg.png${query}`); 
                } else { 
                    mainScreen.show();
                    $(currentNcc).addClass("active");
                    $(currentNcc).children().attr("src", `${source}/sungo/bird.png${query}`); 
                }
            } else { 
                
                mainScreen.currentWriter = this;
                if (!$(currentNcc).hasClass("active"))  mainScreen.show();

                $(currentNcc).removeClass("active");
                $(currentNcc).children().attr("src", `${source}/sungo/egg.png${query}`); 
                $(e.currentTarget).addClass("active");
                $(e.currentTarget).children().attr("src", `${source}/sungo/bird.png${query}`);
            }
            mainScreen.moveto(this.screenAnchor); 
        });
    }

    async init() { 
        this.screenAnchor = await waitForElm("div.comment_attach", this.area)
        this.iconArea = await waitForElm("div.attach_box", this.screenAnchor)
        this.iconArea.appendChild(this.nokcacon);

        this.fileInput = await waitForElm("input.blind", this.area)
        this.flagFileUpload();
    }

    uploadFile(file) {
        const inputBtn = this.fileInput;

        const data = new DataTransfer();
        data.items.add(file);
        inputBtn.files = data.files;
        inputBtn.dispatchEvent(new Event("change"))
    }

    flagFileUpload () { 
        const inputBtn = this.fileInput;
        let flagger = inputBtn.onclick;
        inputBtn.onclick = (e)=>{
            flagger(e);
            e.preventDefault();
        }
        inputBtn.click();
        inputBtn.onclick = flagger;
    }

    Nokcacon() {
        const nccButton = document.createElement("button");
        nccButton.className = "nokcacon";
        nccButton.title = "녹카콘";

        const imageElement = createCorsElement("img");
        imageElement.src = `${source}/sungo/egg.png${query}`;

        $(nccButton).on('mouseenter', function() { 
            if ($(this).hasClass("active")) { return; } 
            $(imageElement).attr("src", `${source}/sungo/half_egg.png${query}`);
        }).on('mouseleave', function() { 
            if ($(this).hasClass("active")) { return; } 
            $(imageElement).attr("src", `${source}/sungo/egg.png${query}`);
        });

        nccButton.appendChild(imageElement);
        return nccButton;
    }
    
    loadIconControl() {
        const icon = document.createElement("div");
        icon.className = "uploading";
        icon.title = "업로드 중";
        icon.className = "loadIcon spin";
        icon = icon;
    }
    
    loadIcon() {
        
        const loadIcon = new loadIconControl();
        container.appendChild(loadIcon.icon);
        fileInput.addEventListener("click", async function() {
            $(loadIcon).show();
            if (await waitForElm(".comment_inbox_upload")){
                $(loadIcon).hide();
            }
        });
    }
}

class MainScreen {
    constructor() {
        this.screen = getMainScreen();
        this.currentWriter = null;

        $(this.screen).hide();
        $("body").append(this.screen);
        this.hideOnClickOutside();

        $(this.screen).on("click", ".conBtn", async (e) => {
            const src = e.currentTarget.dataset.src; 
            const extension = src.split(".").pop();

            const rawfile = await fetch(src);
            const blob = await rawfile.blob();

            const file = new File([blob], `con.${extension}`, { type: `image/${extension}` });
            this.uploadOn(file); 

            $(this.screen).hide();
            $(this.currentWriter.nokcacon).removeClass("active");
            $(this.currentWriter.nokcacon.firstChild).attr("src", `${source}/sungo/egg.png${query}`);
        });
    }
    
    uploadOn(file) { 
        this.currentWriter.uploadFile(file);
    }

    moveto(element) { 
        $(this.screen).css({
            left: `${$(element).offset().left}px`,
            top: `${$(element).offset().top + $(element).outerHeight()}px`
        });
    }

    show() {
        $(this.screen).show();
    }
    hide() {    
        $(this.screen).hide();
    }
    toggle() {
        $(this.screen).toggle();
    }

    async hideOnClickOutside() {
        
        const adIframe = await waitForElm("#cafe_sdk_tgtLREC");
        const idleThenHide = (event)=> {
            if (this.currentWriter && !$(event.target).hasClass("nokcacon")) { 
                $(this.currentWriter.nokcacon).removeClass("active");
                $(this.currentWriter.nokcacon.firstChild).attr("src", `${source}/sungo/egg.png${query}`);
                this.hide(); 
            }
        };
        const self = this;
        adIframe.onload = ()=> {
            $(adIframe.contentDocument.body).on('mousedown', (event)=> {
                idleThenHide(event);
            });
        }
        
        const outerDocument = window.parent.document;
        $(outerDocument).on('mousedown', (event)=> {
            idleThenHide(event);
        });
        
        $(document).on('click', (event) => {
            const click1= event.target.closest(".mainScreen");
            const click2 = event.target.closest("div.CommentWriter");
            if (!click1 && !click2) {
                idleThenHide(event);
            }
        });
        
        const regBtn = document.querySelector(".register_box");
        $(regBtn).on('click', (event) => {
            idleThenHide(event);
        });
    } 
}

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
        background: linear-gradient(to right, #ff6e54, #ff4947); 
        border-radius: 8px; 
        height: 16px; 
        width: 35px;

        font-size: 12px; 
        letter-spacing: 0.5px;
        color: #fff;

        text-align: center;
        line-height: 16px;
        vertical-align: middle;

        font-weight: bold; 
        text-shadow: 0 1px 0 rgba(0, 0, 0, 0.25); 
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15); 

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

function LiveCheck() {
    this.prevStatus = undefined;

    this.check = async (liveElement) => {
        const result = await fetch("https://asia-northeast3-nokcacon.cloudfunctions.net/getLatestData");
        const livedata = await result.json();
        const status = livedata.status;
        const streamTitle = livedata.title;
        
        if(this.prevStatus === status) { 
        } else { 
            if(status === "OPEN") {
                $(liveElement).addClass("live"); 
            } else if (status === "CLOSE") {
                $(liveElement).removeClass("live");
            }
            if(this.prevStatus !== undefined 
               && Notification.permission === "granted") { 
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
    setTimeout(notification.close.bind(notification), 60000); 
}

"use strict"; 
if (window.top === window.self) {
    
    if(!(Notification.permission === "granted") && !(Notification.permission === "denied")) {
        alert("방송 알림을 받으려면 허용을 눌러주세요. 녹두로 카페가 열려있을 때 방송이 시작하면 1분 내로 알림을 받습니다. 설정에서 언제든지 끄고 켤 수 있습니다. 차단시 알림을 보내지 않습니다.")
        Notification.requestPermission();
        
    }

    const youtube = waitForElm("#menuLink20").then(youtube => youtube.innerHTML = `<i class="fa-brands fa-youtube" style="color:red; height: 1em;width: 1em;"></i>` + youtube.innerText.slice(2));

    const streamContainer = waitForElm("#menuLink10").then(streamContainer => {
        streamContainer.innerHTML = `<img src="https://ssl.pstatic.net/static/nng/glive/icon/favicon.png" style="width: auto; display: inline-block; height: 1em; width: 1em;vertical-align: text-top;"/>` + streamContainer.innerText.slice(2);

        const liveElement = document.createElement("div");
        liveElement.textContent = "live";
        liveElement.className = "live-icon";
        streamContainer.appendChild(liveElement)

        const liveCheck = new LiveCheck();

        liveCheck.check(liveElement); 
        setInterval(()=>{
            liveCheck.check(liveElement);
        }, 60000);
    });

    const url = "https://chzzk.naver.com/live/6e06f5e1907f17eff543abd06cb62891/";
    document.addEventListener("notificationclick", (event) => {
        event.notification.close();
        window.open(url, '_blank').focus();
    });
}

let domain = "cafe.naver.com/nokduro";

if (isUrlInDomain(parent.location.href, domain)) {
    
    Recommend();

    const mainScreen = new MainScreen; 

    waitForElm("div.CommentWriter").then(async writerbox => {
        const writer = new commentArea(writerbox, mainScreen);
        await writer.init();

    }).then(async ()=>{
        const commentList = await waitForElm("ul.comment_list");
        
        const observer = new MutationObserver(function (mutations) {
            for (const mutation of mutations) { for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    if($(node).hasClass("CommentItem--reply")) {
                        const writer = new commentArea(node.firstChild, mainScreen);
                        writer.init();
                    }
                }
            }}
        });
        observer.observe(commentList, {
            childList: true
        });
    });

}