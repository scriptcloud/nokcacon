// ==UserScript==
// @name         녹하트
// @namespace    http://www.github.com/scriptcloud
// @version      1.0.5
// @description  녹두로 카페 게시글 목록에서 좋아요 수를 표시해 줍니다. 이용 및 배포에 유의하세요.
// @author       페레로
// @updateURL    https://github.com/scriptcloud/nokcacon/raw/main/dist/showLike.user.js
// @downloadURL  https://github.com/scriptcloud/nokcacon/raw/main/dist/showLike.user.js
// @match        https://cafe.naver.com/MyCafeIntro.nhn?clubid=31103664
// @match        https://cafe.naver.com/ArticleList.nhn?search.clubid=31103664&*
// @match        https://cafe.naver.com/ca-fe/cafes/31103664*
// @grant        GM_addStyle
// @run-at       document-end
// @require      https://code.jquery.com/jquery-2.1.4.min.js
// ==/UserScript==

GM_addStyle(`

    .skin-1080 .article-board span.list-i-new {
    }

    .likeNumberIcon {
        position: relative;
        background-image: url(https://ssl.pstatic.net/static/cafe/cafe_pc/sp/sp_icon_06952b76.svg);
        background-position: -4px -250px;
        background-repeat: no-repeat;
        height: 10px;
        min-width: 13px;
        width: auto;
        display: inline-block;
        margin-right: 6px;
        color: #fff;
        font-size: 0.9em;
        font-weight: 900;
        text-shadow: 0.5px 0.5px 1.5px red;
        text-align: center;
        vertical-align: text-top;
        white-space: nowrap;
        
        &:not(.shown) {
            display: none;
        }
        &.yellow {
          animation: rainbow 8s infinite linear;
        }
        span {
            position: relative;
            top: 20%;
            left: 30%;
        }
    }

    @keyframes rainbow {
        from {filter: hue-rotate(-180deg);}
        to {filter: hue-rotate(180deg);}
    }

  `);
function waitForElm(selector) { // vanilla js
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

function waitForElements(selector) { // jQuery
  return new Promise((resolve, reject) => {
    let elementCount = $(selector).length; // Check initial count
    if (elementCount > 0) {
      resolve($(selector)); // Resolve immediately if already found
      return; // Avoid unnecessary observer setup
    }
    const observer = new MutationObserver(() => {
      const elements = $(selector);
      if (elements.length > 0) {
        observer.disconnect(); // Stop observing changes
        resolve(elements); // Resolve the promise with the elements
      }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        });
    // Set a timeout in case elements take too long to appear
    const timeoutId = setTimeout(() => {
      observer.disconnect();
      reject(new Error("Elements not found"));
    }, 5000); // Set your desired timeout duration (in milliseconds)
  });
}


function LikeShower(where) {
  this.where = where;
  console.log("where: ", this.where);

  this.init = async function () {
    console.log("init start");
    await waitForElm("div.board-list .inner_list");
    $("div.board-list .inner_list").each((idx, article) => {
      const likeNumberIcon = $("<span/>")
        .addClass("likeNumberIcon")
        .append(`<span></span>`); // ${value}
      if ($(article).find(".list-i-new").length) {
        $(article).find(".list-i-new").before(likeNumberIcon);
      } else if ($(article).children("div.article_append").length) {
        $(article).children("div.article_append").append(likeNumberIcon);
      } else {
        $(article).append(likeNumberIcon);
      }
    });
  };

  this.update = async function () {
    const likeData = await fetch(
      `https://asia-northeast3-nokcacon.cloudfunctions.net/getCafeLike`
    );
    const likeDict = await likeData.json();
    await waitForElm("div.board-list .inner_list");
    $("div.board-list .inner_list").each((idx, article) => {
      const articleLink = $(article).children().first("a").attr("href");
      let articleId = undefined;

      if (this.where === "popular") {
        articleId = this.getIdFromPath(articleLink);
      } else {
        const url = new URL(`https://cafe.naver.com` + articleLink);
        articleId = url.searchParams.get("articleid");
      }
      if (likeDict[articleId] && likeDict[articleId] > 0) {
        $(article).find(".likeNumberIcon").addClass("shown");
        if (likeDict[articleId] > 99) {
          // 100개 이상은 99+로 표시
          $(article).find(`.likeNumberIcon span`).text("99+");
          $(article).find(`.likeNumberIcon`).addClass("yellow");
        } else {
          $(article).find(`.likeNumberIcon span`).text(likeDict[articleId]);
        }
      }
    });
  };

  this.getIdFromPath = function (path) {
    var regex = /\/(\d+)\?/;
    var match = path.match(regex);
    if (match) {
      var id = match[1];
    } else {
      console.log("ID not found in the path.");
    }
    return id;
  };
}

//// Main Body ////
// "https://cafe.naver.com/MyCafeIntro.nhn?clubid=31103664" 타이틀화면
// "https://cafe.naver.com/ArticleList.nhn?search.clubid=31103664&" 글목록
// "https://cafe.naver.com/ca-fe/cafes/31103664/popular" 인기글
// 내가쓴글, 이미지글 추천수기능 필요

(async function pageManager() {
  this.observer = undefined;
  this.monitorPageChange = function () {
    console.log("monitoring page change in current tab");
    this.observer?.disconnect();
    setTimeout(async () => {
      const target = waitForElm(".article-board table tbody"); //promise
      const config = { childList: true };
      const callback = function (mutationsList, observer) {
        console.log("mutated");
        likeShower.init();
        likeShower.update();
      };
      this.observer = new MutationObserver(callback);
      this.observer.observe(await target, config);
      console.log("button clicked, observer: ", this.observer);
    }, 1000); //버튼 클릭 후 글목록 업데이트를 1초간 기다렸다 실행
  };
  //execution
  let likeShower;
  if (location.href.includes("https://cafe.naver.com/ca-fe/cafes/31103664/popular")) {
    //인기글인 경우
    likeShower = new LikeShower("popular");
    this.monitorPageChange();
    // tab change
    $(document).on("click", "button.tab_btn", async (e) => { //e와 this가 별개임을 명시
      this.monitorPageChange();
    });
  } else {
    console.log("MyCafeIntro");
    likeShower = new LikeShower();
  }
  likeShower.init();
  likeShower.update();
})();
