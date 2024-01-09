// ==UserScript==
// @name         nokcacon_test
// @namespace    https://github.com/scriptcloud/
// @version      0
// @description  test
// @author       pperero
// @match        https://cafe.naver.com/ArticleRead.nhn*
// @match        https://cafe.naver.com/ca-fe/ArticleRead.nhn*
// @match        https://cafe.naver.com/ca-fe/cafes*
// @match        https://cafe.naver.com/nokduro*
// @icon         https://pub-945ee597288a43329a299345ecb0188d.r2.dev/eggSungo.png
// @grant        GM_addStyle
// @grant        GM_notification
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// @require      https://pub-945ee597288a43329a299345ecb0188d.r2.dev/all.min.js
// ==/UserScript==

/* comment remover regex */
/*                 \/\*[\s\S]*?\*\/|(?<=[^:])\/\/.*|^\/\/.*              */



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

/////  UTILITY FUNCTIONS  //////////////////////////////////////////////

function createCorsElement(type) {
    const elem = document.createElement(type);
    elem.crossOrigin = "anonymous";
    return elem;
}

function waitForElm(selector, where = document.body) {
    //you need to get the selector in the form "where > selector"
    //if you want to search from inside element subtree
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


/////  MAIN FUNCTIONS  /////////////////////////////////////////////////

async function Recommend() {

    //변수초기화
    const oldLikeDiv = await waitForElm("div.like_article"); //기존 추천버튼이 있는 div
    const [oldLikeBtn, myLikeInfo] = await Promise.all([
        waitForElm(".u_ico"),
        waitForElm("a.u_likeit_list_btn") //my like status
    ]);
    this.oldLikeText = $(oldLikeBtn).next(); //좋아요(누르면 좋아요한 사람 목록)
    //추천버튼 생성
    const likeBtn = newLikeBtn();
    likeBtn.on("click", ()=>{
        $(oldLikeBtn).click();
    });
    //추천버튼 div 생성
    const likeDiv= $("<div>").addClass("article_end").append(likeBtn);
    waitForElm('.article_viewer').then(element=>{
        $(element).after(likeDiv);
    });
    //토글버튼
    const likeToggleBtn = newToggleBtn();
    //append to first child
    likeToggleBtn.prependTo(("div.ArticleTool"));
    // localstorage에서 추천버튼 활성화 여부 불러오기
    let enabled = null;

    //observer 선언
    const updater = setUpdater(this.oldLikeText);
    const option = new Option();
    if(optionLoad()) {
        enableLike();
        runUpdater(updater, this.oldLikeText);
        console.log("updater run")
    } else {
        disableLike();
        stopUpdater(updater, this.oldLikeText);
        console.log("updater stop")
    }
    ///////main logic end/////

    ///////  methods  ////////
    function optionLoad() {
        // null이면 true 반환
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
            console.log("enabled: ", enabled);
            enabled ? disableLike() : enableLike(); //toggle
        });
        return button;
    }

    function enableLike() {
        console.log("recommend enable!")
        $(likeToggleBtn).addClass("enabled");
        $(oldLikeDiv).addClass("enabled");
        $(likeDiv).addClass("enabled");
        runUpdater(updater, this.oldLikeText);
        enabled = true;
        optionSave();
    }
    
    function disableLike() {
        console.log("recommend disable!")
        $(likeToggleBtn).removeClass("enabled");
        $(oldLikeDiv).removeClass("enabled");
        $(likeDiv).removeClass("enabled");
        stopUpdater(updater, this.oldLikeText);
        enabled = false;
        optionSave();
    }

    //observer
    function setUpdater(likers) {
        //로딩순서 realLikeBtn -> Button -> Updater
        //observer가 지켜볼 elements
        const count = likers.next();
        const counter = likeBtn.find("span.count");
        //실시간 추천수 업데이트 및 글자 강제변경. visibility는 css에서 처리
        const observer = new MutationObserver(mutations => {
            //$(realLikeBtn).hide();
            if(likers.text() === "좋아요") {
                likers.text("추천수");} //글자 강제변경
            counter.text(count.text()); //추천수 실시간 갱신
            $(myLikeInfo).hasClass("on") ?
                likeBtn.addClass("on") : likeBtn.removeClass("on"); //내 추천여부 반영
        });
        return observer;
    }

    function runUpdater(observer, likers) {
        likers.text("추천수"); //
        observer.observe(oldLikeDiv, {
            childList: true,
            subtree: true
        });
    }

    function stopUpdater(observer, likers) {
        if(observer) {
            likers.text("좋아요"); //
            observer.disconnect();
        } else console.log("observer is not running");
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
        
        //각각의 conlist를 만들어서 저장
        //홈 메뉴는 nokConut으로 시작
        const conList = makeConList(menuBtn);
        conView.append(conList);
        if(conType === 'nokConut') {
            $(menuBtn).addClass('selected');
            $(conList).addClass('selected');
        };
        menuList.append(menuBtn);
    }

    //event delegation on menuView for menuBtn click event
    menuView.on("click", ".menuBtn", function() { //function()이므로 this는 menuBtn(target element)
        menuList.children().removeClass('selected');
        $(this).addClass('selected'); //this만 명시적으로 jquery로 변환
        conView.children().removeClass('selected');
        const conList = conView.find(`.${this.dataset.conType}`);
        conList.addClass('selected');

        conView.scrollTop = 0;
    });

    enableDragScroll(menuView);

    return mainscreen[0]; //미봉책
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

            //save src data to conbutton
            conbutton.dataset.src = conimage.src;
        }
    }

    return conlist;
}

//method for mainScreen
function enableDragScroll(slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

    //임시방편
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
        //loadIcon = loadIcon();

        //event delegation: nokcacon click
        $(this.area).on("click", ".nokcacon", (e)=> { //화살표함수이므로 this는 commentArea
            const currentNcc = mainScreen.currentWriter?.nokcacon; //?.: optional 
            if(!currentNcc) mainScreen.currentWriter = this; //첫 클릭시 currentWriter 초기화

            // nokcacon.active와 writeSpace 변화에 따른 4분기
            // nokcacon을 객체화해서 정적 메소드로 utility function 제공
            // active 설정과 src 변경을 한데 묶어 nokcacon.activate/inactivate()로 바꿀것
            if (currentNcc === this.nokcacon) { //동일 녹카콘 다시 클릭시(첫 클릭시도 포함)
                if ($(currentNcc).hasClass("active")) { //현재 active이면
                    mainScreen.hide();
                    $(currentNcc).removeClass("active");
                    $(currentNcc).children().attr("src", `${source}/sungo/egg.png${query}`); //bird.png
                } else { //현재 active가 아니면
                    mainScreen.show();
                    $(currentNcc).addClass("active");
                    $(currentNcc).children().attr("src", `${source}/sungo/bird.png${query}`); //bird.png
                }
            } else { //다른 녹카콘 클릭시
                //mainScreen.moveto(this.screenAnchor); //magnet <- original location
                mainScreen.currentWriter = this;
                if (!$(currentNcc).hasClass("active"))  mainScreen.show();

                $(currentNcc).removeClass("active");
                $(currentNcc).children().attr("src", `${source}/sungo/egg.png${query}`); //bird.png
                $(e.currentTarget).addClass("active");
                $(e.currentTarget).children().attr("src", `${source}/sungo/bird.png${query}`);
            }
            mainScreen.moveto(this.screenAnchor); //일단 모든 케이스에 대해 적용
        });
    }

    async init() { //iconArea와 fileInput을 설정함
        this.screenAnchor = await waitForElm("div.comment_attach", this.area)
        this.iconArea = await waitForElm("div.attach_box", this.screenAnchor)
        this.iconArea.appendChild(this.nokcacon);
        //iconArea.appendChild(loadIcon);

        this.fileInput = await waitForElm("input.blind", this.area)
        console.log("fileInput in CommentArea.init(): ", this.fileInput);
        //console.log("inputBtn: ", fileInput);
        this.flagFileUpload();
    }

    uploadFile(file) {
        const inputBtn = this.fileInput;

        const data = new DataTransfer();
        data.items.add(file);
        inputBtn.files = data.files;
        inputBtn.dispatchEvent(new Event("change"))
    }


    flagFileUpload () { //:HTMLElement
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
        //imageElement.src = `${source}/sungo/egg.png${query}`;
        //default image: egg.png, hover image: half_egg.png, change to bird.png when selected and if unselected it should get back to egg.png
        //hover behavior
        $(nccButton).on('mouseenter', function() { //여기서의 this는 hover된 element인 nccButton을 의미함
            if ($(this).hasClass("active")) { return; } //active이면 무시하고 bird.png
            $(imageElement).attr("src", `${source}/sungo/half_egg.png${query}`);
        }).on('mouseleave', function() { //idle
            if ($(this).hasClass("active")) { return; } //active이면 무시하고 bird.png
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
        //show loading when file uploading
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

        //event delegation for conBtn click
        $(this.screen).on("click", ".conBtn", async (e) => {
            const src = e.currentTarget.dataset.src; //event.target: conBtn을 이용해 접근
            const extension = src.split(".").pop();

            const rawfile = await fetch(src);
            const blob = await rawfile.blob();

            const file = new File([blob], `con.${extension}`, { type: `image/${extension}` });
            this.uploadOn(file); //this 바인딩 고려

            //escape sungo mode - 스크린을 hide하는 동시에 
            //현재 writer의 nokcacon을 unactive로 만들고
            //sungo icon을 egg.png로 바꾸는 함수 필요
            $(this.screen).hide();
            $(this.currentWriter.nokcacon).removeClass("active");
            $(this.currentWriter.nokcacon.firstChild).attr("src", `${source}/sungo/egg.png${query}`);
        });
    }
    
    uploadOn(file) { //commentArea
        this.currentWriter.uploadFile(file);
    }

    //screen position left bottom (main commentWriter iconbox)
    moveto(element) { //:jQuery element
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
        //click advertisement iframe
        const adIframe = await waitForElm("#cafe_sdk_tgtLREC");
        const idleThenHide = (event)=> {
            if (this.currentWriter && !$(event.target).hasClass("nokcacon")) { //녹카콘 클릭 로직과 겹치지 않게끔
                //console.log("idelThenHide activated");
                $(this.currentWriter.nokcacon).removeClass("active");
                $(this.currentWriter.nokcacon.firstChild).attr("src", `${source}/sungo/egg.png${query}`);
                //console.log("this: ", this);
                this.hide(); //this는 lexical context에 따라 mainScreen에 바인딩
            }
        };
        const self = this;
        adIframe.onload = ()=> {
            $(adIframe.contentDocument.body).on('mousedown', (event)=> {
                idleThenHide(event);
            });
        }
        //click outside of iframe
        const outerDocument = window.parent.document;
        $(outerDocument).on('mousedown', (event)=> {
            idleThenHide(event);
        });
        //click in iframe but outside of element
        $(document).on('click', (event) => {
            const click1= event.target.closest(".mainScreen");
            const click2 = event.target.closest("div.CommentWriter");
            if (!click1 && !click2) {
                idleThenHide(event);
            }
        });
        //if register button clicked
        const regBtn = document.querySelector(".register_box");
        $(regBtn).on('click', (event) => {
            idleThenHide(event);
        });
    } 
}


//////////////////////////////////////////////////
const asciiArt = `
MMMMMMMMMMMMMMWNXKOxdolododxO0NWMMMMMMMMMMMMMMMMMM
MMMMMMMMMMMMWXK0KXXK0OOOkxdolloood0NMMMMMMMMMMMMMM
MMMMMMMMMMMWNXNNXXXXKKKKK00KK00Odc;;o0WMMMMMMMMMMM
MMMMMMMMMWWNNNXXXXXXKKKKKK000000OOxc..oXMMMMMMMMMM
MMMMMMWWWNNXXXXXXXXXXXKK0000000OOOkkd,.;0WMMMMMMMM
MMMMWNNNNXXXXXXKKXKKKK0000000OOOkxxkkxl'.:ONMMMMMM
MMMWK0XXXXXXXXXXKKK000000Okddoodoodxxkkkd:,:xXMMMM
MMM0xKXKKKKKKKKKK0000Odcccclc..;coddxkkkkkxc.'dXWM
MMNddK0000000000000Oxl:;,,,,c:..:oddxkkkkkkkd,.'ck
MMXloOOO0000000OOOOd::'     ,,':lddxkkkkkkOO0kdo;.
MMK:cOxxOOOOOOOOkkk:'c:....',;cloddxkkkkkkOOO0O0ko
MWk,,ccldOK0OOkkkkk:..:;,;;;:looddxkkkkkkOOOO00000
M0,      .;cx0OkkkkdllooooooodddxxkkkkkOOOO0000000
Nl ....     .'',ldxkkxxxxxxxxxxxkkkkOOOO0000000000
O..:c;.          'lkkkkkkkkkkkkkkkkOO0000000000000
d.,dc.         .;dkkkkkkkkkkkkkkkOO0000000000000K0
k.';.        .:dkkkkkkkkkkkkkkkOOO000000000KKKKKKK
K;         .cxkkkkkkkkkkkkkkkkO0000000KKKKKKKXXXXX
Wx.       ;dkkkkkkkkkkkkkkkOOO00000KKKXXXXXXXXXXXX
MWo.  .' .oOkkkkkkkkkkkkkkOO00000KKKXXXXXXXXXXXXXX
MMNd':0d..dOkkkkkkkkkkkkOOO0000KKKXXXXXXXXXXXXXXXX
MMMWXNWd ,kOOOkOkOOOOkOOO00KKKKKXXXXXXXXXXXXXXXXXX
MMMMMMMO.'k0O00O00000000KKKKKXKXX Main Page! XKKKK
MMMMMMMN:.dK00K000000KKKKXXXXXXXXXXXXXXXXXXXXXKXXX
MMMMMMMWo.,OKKKKKKKKKKXXXXXXXXXXXXXXXXXXXXKXXXKXNN
`;
////////　BODY  //////////////////////////////////
"use strict"; //use strict mode
if (window.top === window.self) {
    console.log(asciiArt);
    console.log("인생과 코딩의 공통점: 변수가 많다.");
}
//window.addEventListener("beforeunload", () => {});
let domain = "cafe.naver.com/nokduro";

if (isUrlInDomain(parent.location.href, domain)) {
    //추천버튼 활성화
    Recommend();

    const mainScreen = new MainScreen; ///콘 메뉴 추가

    //create commentArea object for main commentWriter
    waitForElm("div.CommentWriter").then(async writerbox => {
        const writer = new commentArea(writerbox, mainScreen);
        await writer.init();
        //동기적 처리를 위해 로직을 constructor에서 async init()으로 이동
        //콜백을 async로 설정하면 내부에서 await으로 처리 가능
    }).then(async ()=>{
        const commentList = await waitForElm("ul.comment_list");
        //create commentArea object for new commentWriters
        const observer = new MutationObserver(function (mutations) {
            for (const mutation of mutations) { for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    console.log("new element: ", node);
                    if($(node).hasClass("CommentItem--reply")) {
                        console.log("new commentWriter added: ", node.firstChild);
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