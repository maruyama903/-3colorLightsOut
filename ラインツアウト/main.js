"use strict";
{
  const board = document.getElementById("board"); //id = board要素を取得
  let tiles; //(id = tiles)要素を取得
  //ボード、タイル
  let ROWS = 4; //列数
  let COLS = 4; //行数
  const numLight = 3; //セルの色数
  let answerLocation; //答え(押す)場所を配列で所持
  // ゲーム
  let win; //ゲーム中か否か

  // 画面が読み込まれたら、新しい答えをセットしゲームをしてスタート
  window.addEventListener("load", (event) => {
    newGame();
  });

  //「新しいゲーム」クリックで、新しい答えをセットしゲームをしてスタート
  const newGameBtn = document.getElementById("newGameBtn");
  newGameBtn.addEventListener("click", newGame);
  //「リスタート」クリックでゲーム最初の状態にセット（既存の答えで）
  const restartBtn = document.getElementById("restartBtn");
  restartBtn.addEventListener("click", initGame);
  //「ヒント」クリックでゲーム最初の状態にセット（既存の答えで）し、答えのセルに色をつける
  const hintBtn = document.getElementById("hintBtn");
  hintBtn.addEventListener("click", giveHint);
  function giveHint() {
    initGame();
    board.classList.add("hint");
  }
  // 新しい答えをセットしゲームをしてスタート
  function newGame() {
    // answerLocation = []; //答え(押す)場所を配列で所持
     answerLocation = new Array(ROWS*COLS);
    // 答え(押すセル)の場所を生成
    createAnswer();
    //ゲームを新たに開始
    initGame();
  }

  //ゲームを新たに開始
  function initGame() {
    // 既にあるセルを削除
    while (board.firstChild) {
      board.removeChild(board.firstChild);
    }
    board.classList.remove("hint");
    win = false; //ゲーム中か否か
    //指定した行数に対応してタイルを並べる
    board.style.gridTemplateColumns = `repeat(${COLS},60px)`;
    board.style.gridTemplateRows = `repeat(${ROWS},60px)`;
    // タイルを生成、初期化
    createTile();
    // タイルを取得
    tiles = document.querySelectorAll(".tile");
    // タイルクリック時の処理を設定
    setEvent();
  }


  // 各セルについてゲーム開始時に押しておく回数（答え）を格納
  function createAnswer() {
    for (let i = 0; i < answerLocation.length; i++) {
      answerLocation[i] = Math.floor(Math.random() * numLight)
    }
  }

  //タイルを生成し、タイル初期化
  function createTile() {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = document.createElement("div");
        tile.classList.add("tile");
        // データ属性を設定
        //タイルの場所
        tile.dataset.row = row;
        tile.dataset.col = col;
        const idx = row * COLS + col;
        // 各タイルの答え(押す回数)
        tile.dataset.answer = answerLocation[idx];
        // 光っているか、各セルとその周囲セルを押した回数
        //numLightが３の場合、セルを3回押されると０回押された状態（元に戻る）になるので、numLightで割ったものを代入
        tile.dataset.light = getIsLight(row, col) % numLight;
        // ヒントに関連、各セルを押した回数
        tile.dataset.pushed = "0";
        board.appendChild(tile);
      }
    }
  }

  // ゲームスタート時光っているか
  function getIsLight(row, col) {
    let numPushed = 0;
    // 周囲のセルを1つずつ毎に中心セルを光をオンオフにする
    for (let i = row - 1; i <= row + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        // 周囲タイルがボードの範囲外にある場合は処理をスキップ
        if (i < 0 || i >= ROWS || j < 0 || j >= COLS) {
          continue;
        }
        // 周囲のタイルの内、上下左右のセルを調べる
        if (i == row || j == col) {
          const idx = i * COLS + j;
          // 周囲のタイルがゲーム開始前に押されているか
          numPushed += answerLocation[idx];
        }
      }
    }
    return numPushed;
  }

  // タイルクリック時の処理を設定
  function setEvent() {
    tiles.forEach((tile) => {
      // クリック時の処理を指定
      tile.addEventListener("click", (e) => {
        // タイルのオン・オフを切り替えて、勝利判定
        tileClick(e);
      });
    });
  }
  // タイルのオン・オフを切り替えて、勝利判定
  function tileClick(e) {
    const tile = e.target;
    // ゲームオーバーなら以降の処理をしない
    if (win) {
      return;
    }
    // クリックしたセルの押された回数を更新
    const numPushed = Number(tile.dataset.pushed) + 1;

    //numLightが３の場合、セルを3回クリックすると0階クリックした状態（元に戻る）になるので、numPushedをnumLightで割ったものを代入
    tile.dataset.pushed = numPushed % numLight;
    //クリックした周囲のタイルをpushした状態に更新
    push(tile);
    //ゲームが勝利したか
    checkWin();
  }

  ///クリックした周囲のセルの光をオンオフ
  function push(tile) {
    //文字列を数字に変換、文字列の場合1+2=12になってしまう。
    const row = Number(tile.dataset.row);
    const col = Number(tile.dataset.col);
    // 周囲のセルを押す
    for (let i = row - 1; i <= row + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        // 周囲タイルがボードの範囲外にある場合は処理をスキップ
        if (i < 0 || i >= ROWS || j < 0 || j >= COLS) {
          continue;
        }
        // 上下左右以外のセルはスキップ
        if (i != row && j != col) {
          continue;
        }
        // 各周囲のセルのオンオフを切り替え
        const idx = i * COLS + j;
        const pushedTile = tiles[idx];
        const numPushed = Number(pushedTile.dataset.light) + 1;
        pushedTile.dataset.light = numPushed % numLight;
      }
    }
  }
  //ゲームが勝利したか
  function checkWin() {
    let allShadow = true;
    //１つでも光セルがあれば allShadowをfalseにする;
    tiles.forEach((tile) => {
      if (tile.dataset.light % numLight != 0) {
        allShadow = false;
      }
    });
    // 全てのセルが光っていないならゲーム勝利
    if (allShadow == true) {
      win = true;
      alert("WIN！");
    }
  }
}
