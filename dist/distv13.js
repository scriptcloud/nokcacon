// ==UserScript==
// @name         녹카콘
// @namespace    https://github.com/scriptcloud/
// @version      1.3
// @description  녹두로 카페 전용 댓글 이모티콘 확장프로그램 녹ー카콘. 네이버 카페 댓글에 이모티콘 입력기능 추가
// @author       pperero
// @updateURL    https://gist.github.com/scriptcloud/6bd15f131566fdc15aaef6b0f7914b9d/raw/nokcacon.user.js
// @downloadURL  https://gist.github.com/scriptcloud/6bd15f131566fdc15aaef6b0f7914b9d/raw/nokcacon.user.js
// @match        https://cafe.naver.com/ArticleRead.nhn*
// @match        https://cafe.naver.com/ca-fe/ArticleRead.nhn*
// @match        https://cafe.naver.com/ca-fe/cafes*
// @icon         https://pub-945ee597288a43329a299345ecb0188d.r2.dev/eggSungo.png
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
    #nokcacon {
        display: inline-block;
        margin-left: 16px;
        transition: 0.2s;
    }
    #nokcacon:hover {
        opacity: 0.7;
    }
    .selectScreenAnchor {
        position: absolute;
        top: 100%;
        left: 0;
        z-index: 10;
        display: none;
    }
    .selectScreenMain {
        display: flex;
        flex-direction: column;

        overflow: hidden;
        width: 458px;
        height: 385px;
        border: 1px solid #9b9b9b;
        background: #fff;
    }

    .menuViewport {
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
    .menuButton {
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
    .menuButton::last {
        border-right: none;
    }
    .menuButton.selected {
        box-shadow: none;
    }
    .menuButton > img {
        width: 45px;
        draggable: false;
    }

    .conViewport {
        flex-grow: 1;
        width: 100%;
        margin-top: 5px;

        overflow: auto;
        overflow-x: hidden;

    }

    .conList {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 3px;

        text-align: center;
    }
    .conButton {
        width: 100%;
        position: relative;
        cursor: pointer;
        border: 1px solid white;
        text-align: left;
    }
    .conButton:hover {
        border: 1px solid #d1d3d8;
    }
    .conButton::after {
        display: block;
        content: "";
        padding-bottom: 100%;
    }
    .conButton > img{
        position: absolute;
        width: 100%;
        height: 100%;
        draggable: false;
    }

    .emptyCon {
        position: absolute;
        inset: 50px 0 0 0;
        margin: auto;

        width: 150px;
        height: 50px;
    }
`);

let source = "https://pub-945ee597288a43329a299345ecb0188d.r2.dev";
let query = "";
let fileInput;
let selectScreen;
main(); 

async function main() {
    const flagFileUpload = async function(fileinput) {
        let flagger = fileinput.onclick;
        fileinput.onclick = (e)=>{
            flagger(e);
            e.preventDefault();
        }
        fileinput.click();
        fileinput.onclick = flagger;
    };
    fileInput = await waitForElm("#attach3");
    await flagFileUpload(fileInput);

    const container = await waitForElm("div.attach_box")
    const nokcacon = getNokcacon();
    selectScreen = getSelectScreen();
    container.appendChild(nokcacon);
    container.appendChild(selectScreen);

    nokcacon.addEventListener("click", function() {
        selectScreen.style.display = (selectScreen.style.display === 'block' ? 'none' : 'block');
    });
    hideOnClickOutside(selectScreen); //hide when clicked outside
}

function getNokcacon() {
    const nccButton = document.createElement("button");
    nccButton.id = "nokcacon";
    nccButton.title = "녹카콘";

    const imageElement = createCorsElement("img");
    imageElement.src = `${source}/eggSungo.png${query}`;
    nccButton.appendChild(imageElement);

    return nccButton;
}

function getSelectScreen() {
    const anchor = document.createElement("div");
    anchor.className = "selectScreenAnchor";
    const screen = document.createElement("div");
    screen.className = "selectScreenMain";
    anchor.appendChild(screen);

    const menuViewLayer = document.createElement("div");
    menuViewLayer.className = "menuViewport";
    enableDragScroll(menuViewLayer);

    const menuListElem = document.createElement("ul");
    menuListElem.className = "menuList";
    
    menuViewLayer.appendChild(menuListElem);
    screen.appendChild(menuViewLayer);

    const conViewLayer = document.createElement("div");
    conViewLayer.className = "conViewport";

    const conListElem = document.createElement("ul");
    conListElem.className = "conList";

    conViewLayer.appendChild(conListElem);
    screen.appendChild(conViewLayer);

    
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
        const menuButton = document.createElement("li");
        menuButton.className = "menuButton";

        const conType = menuButton.dataset.conType = data.type;
        const name = menuButton.dataset.name = data.name;
        const png = menuButton.dataset.png = data.png;
        const gif = menuButton.dataset.gif = data.gif;
        
        menuButton.title = name;

        if (png + gif == 0) menuButton.textContent = name;
        const extension = png ? "png" : (gif ? "gif" : false);

        if (extension) {
            const conPreview = createCorsElement("img");
            conPreview.src = `${source}/${conType}/1.${extension}${query}`;
            conPreview.setAttribute("draggable", false);
            menuButton.appendChild(conPreview);
        }

        if(conType === 'nokConut') {
            updateConList(menuButton, conListElem);
            menuButton.classList.add('selected');
        };

        menuButton.addEventListener('click', ()=>{
            updateConList(menuButton, conListElem);
            for (const sibling of menuButton.parentElement.children) {
                sibling.classList.remove('selected');
            };
            menuButton.classList.add('selected');
        });
        menuListElem.appendChild(menuButton);
    }

    enableDragScroll(menuViewLayer);
    return anchor;
}

function updateConList(menuBtn, conlist) {
    const conType = menuBtn.dataset.conType;
    const pngNum = menuBtn.dataset.png;
    const gifNum = menuBtn.dataset.gif;

    while (conlist.firstChild) {
        conlist.removeChild(conlist.firstChild);
    }
    if (!pngNum && !gifNum) {
        const div = document.createElement("div");
        div.className = 'emptyCon';
        const img = createCorsElement("img");
        img.src = `${source}/eggSungo.png${query}`;
        img.style = "margin-top: auto, margin-bottom: 20px;"
        const txt = document.createElement("p");
        txt.textContent = "이곳은 너무 조용합니다..."
        txt.style = "margin-bottom: auto;"

        conlist.appendChild(div);
        div.appendChild(img);
        div.appendChild(txt);
    }

    const numInfo = [
            { extension: "png", number: pngNum },
            { extension: "gif", number: gifNum }
        ]
    for(const info of numInfo) {
        const conType = menuBtn.dataset.conType;
        const extension = info.extension;
        const number = info.number;

        for (let index = 1; index <= number; index++) {
            const conbutton = document.createElement("li");
            conbutton.className = "conButton";

            const conimage = createCorsElement("img");
            conimage.src = `${source}/${conType}/${index}.${extension}${query}`;
            conbutton.appendChild(conimage);
            
            conbutton.addEventListener('click', function() {
                fetch(conimage.src).then((rawfile)=>{
                    rawfile.blob().then((blob)=>{

                        const file = new File([blob], `con.${extension}`, { type: `image/${extension}` });
                        const data = new DataTransfer();
                        data.items.add(file);

                        fileInput.files = data.files;
                        fileInput.dispatchEvent(new Event("change"));
                    });
                });
                selectScreen.style.display = 'none';
            });
            conlist.appendChild(conbutton);
        }
    }
}

async function hideOnClickOutside(element) {
    const adIframe = await waitForElm("#cafe_sdk_tgtLREC");
    adIframe.onload = ()=> {
        adIframe.contentDocument.body.addEventListener('mousedown', ()=> {
            element.style.display = 'none'
        });
    }

    const outerDocument = window.parent.document;
    outerDocument.addEventListener('mousedown', ()=> {
        element.style.display = 'none'
    });
    const outsideClickListener = event => {
        const click1= event.target.closest(".selectScreenMain");
        const click2 = event.target.closest(".CommentWriter");
        if (!click1 && !click2) {
            element.style.display = 'none';
        }
    }
    document.addEventListener('click', outsideClickListener);
    const regBtn = document.querySelector(".register_box");
    regBtn.addEventListener('click', ()=> {
        element.style.display = 'none'
    });
}

function enableDragScroll(slider) {
    let isDown = false;
    let startX;
    let scrollLeft;

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
;

    slider.addEventListener('mousemove', e => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = x - startX;
        slider.scrollLeft = scrollLeft - walk;
    });
}

function createCorsElement(type) {
    const elem = document.createElement(type);
    elem.crossOrigin = "anonymous";
    return elem;
}

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

function toggleVisible() {
    if (this.style.display === 'none') {
        this.style.display = 'block';
    } else {
        this.style.display = 'none';
    }
}

