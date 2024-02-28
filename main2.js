"use strict";
{
  // HTMLファイルから要素を取得
  const board = document.getElementById("board"); //id = board要素を取得
  let tiles; //id = tiles要素を取得
  //ボード、タイル
  let formRow = 5; //フォームから取得した列数
  let ROWS = 5; //列数
  let COLS = 5; //行数
  let NUM_MINES; //地雷数
  let numFlags; //フラグ数
  let numUnrevealedTiles; //返していないタイル数
  let mineLocations; // 地雷の場所を配列で所持
  // ゲーム
  let gameOver; //ゲーム中か否か
  // タイマー
  let startTime; // タイマー開始時刻
  let timerIntervalId; // タイマー削除

  window.addEventListener("load", (event) => {
    // マインスイーパーの全処理を呼び出す
    setGame();
  });

//ボードをリセットする＋フォームから行数を取得
  const btn = document.getElementById("btn");
  btn.addEventListener("click", getNumber);
  function getNumber() {
    // 入力された数値を取得する
    // const formElements = document.forms.contactForm; //フォームを取得
    // formRow = parseInt(formElements.row.value); //フォームから値を取得
    //既にあるタイル要素を消す
    while (board.firstChild) {
      board.removeChild(board.firstChild);
    }
    //ゲームを新たに開始
    setGame();
  }

  //ゲームを開始する
  function setGame() {
    // 値を初期化
    // ROWS = formRow; //列数
    // COLS = formRow; //行数
    numUnrevealedTiles = ROWS * COLS; //返していないタイル数
    NUM_MINES = Math.floor(numUnrevealedTiles / 10); //地雷数
    numFlags = 0; //フラグ数
    // 地雷の場所
    mineLocations = []; // 地雷の場所を配列で所持
    gameOver = false; //ゲーム中か否か
    //指定した行数に対応してタイルを並べる
    board.style.gridTemplateColumns = `repeat(${COLS},40px)`;
    board.style.gridTemplateRows = `repeat(${ROWS},40px)`;

    // 地雷の場所を生成
    createMine();
    // マインスイーパーのタイルを生成、初期化
    createTile();
    tiles = document.querySelectorAll(".tile");
    // クリック時の処理を設定
    setEvent();
    // タイマーをスタート
    startTimer();
  }

  // 地雷の場所を生成
  function createMine() {
    // 地雷の数が指定された数に達するまでランダムにインデックス(爆弾の場所)を生成;
    while (mineLocations.length < NUM_MINES) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);
      const idx = row * COLS + col;
      if (!mineLocations.includes(idx)) {
        mineLocations.push(idx);
      }
    }
    updateMineCounter();
  }
  // マインスイーパーのタイルを生成し、タイル初期化
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
        // 各タイルに地雷の有無
        tile.dataset.mine = mineLocations.includes(idx) ? "true" : "false";
        // 周囲の地雷の数
        tile.dataset.numSurroundingMines = getNumSurroundingMines(
          row,
          col
        );
        // タイルがクリックの有無
        tile.dataset.revealed = "false";
        // フラグの有無
        tile.dataset.flagged = "false";
        board.appendChild(tile);
      }
    }
  }
  // 周囲の地雷を数える
  function getNumSurroundingMines(row, col) {
    // function getNumSurroundingMines(row, col, mineLocations) {
    let count = 0;
    for (let i = row - 1; i <= row + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        // 周囲タイルがボードの範囲外にある場合は処理をスキップ
        if (i < 0 || i >= ROWS || j < 0 || j >= COLS) {
          continue;
        }
        // 周囲のタイルは地雷の場所に含まれるか
        const idx = i * COLS + j;
        if (mineLocations.includes(idx)) {
          count++;
        }
      }
    }
    return count;
  }

  // タイルクリック時の処理を設定
  function setEvent() {
    tiles.forEach((tile) => {
      // クリック時の処理を指定
      tile.addEventListener("click", (e) => {
        handleTileClick(e);
      });
      tile.addEventListener("contextmenu", (e) => {
        flagTile(e);
      });
    });

    //右ボタンクリック時、タイルに旗を立てる
    function flagTile(e) {
      //メニューを開く処理を中止
      e.preventDefault();
      const tile = e.target;
      // ゲームオーバー、タイルが返し済みなら以降の処理をしない
      if (gameOver || tile.dataset.revealed === "true") {
        return;
      }

      //タイルを返してないなら
      if (tile.dataset.revealed == "false") {
        if (tile.dataset.flagged !== "true") {
          tile.textContent = "🚩";
          tile.dataset.flagged = "true";
          numFlags++;
          updateMineCounter();
        } else {
          // フラグがなければ旗を非表示
          tile.textContent = "";
          tile.dataset.flagged = "false";
          numFlags--;
          updateMineCounter();
        }
      }
    }

    // ダブルクリック時の処理。タイルが地雷→ゲームオーバー。地雷でない→周囲の地雷数を表示
    function handleTileClick(e) {
      const tile = e.target;

      // ゲームオーバー、タイルが返し済み、フラグがついているなら以降の処理をしない
      if (
        gameOver ||
        tile.dataset.revealed === "true" ||
        tile.dataset.flagged === "true"
      ) {
        return;
      }

      // 負けた時の処理（タイルが地雷なら）、gameOver変数をtrue＋すべての地雷を表示
      if (tile.dataset.mine === "true") {

        gameOver = true;
        // すべての地雷を表示;
        revealMines();
        //タイマーを止める
        stopTimer();
        alert("ゲームオーバーです");
      } else {
        //タイルをクリックされた状態に更新+周囲の地雷数を表示
        revealTile(tile);
        //ゲームが勝利したか
        checkWin();
      }
      updateMineCounter();
    }

    ////タイルをクリックされた状態に更新+周囲の地雷数を表示
    function revealTile(tile) {
      // tile.style.backgroundColor = "lightgray";
      tile.dataset.revealed = "true";
      // 残りタイルを減らす
      numUnrevealedTiles--;
      // タイルが周囲に地雷がある場合は、その情報を表示します。
      if (tile.dataset.numSurroundingMines !== "0") {
        tile.textContent = tile.dataset.numSurroundingMines;
        return; //以降の処理を飛ばす。クリックしたタイルが空白（周囲の地雷が０なら）以降の処理を実行
      }
      //周囲のタイルを確認
      revealAdjacentTiles(tile);
    }

    //周囲のタイルを確認
    function revealAdjacentTiles(tile) {
      const row = Number(tile.dataset.row);
      const col = Number(tile.dataset.col);
      for (let i = row - 1; i <= row + 1; i++) {
        for (let j = col - 1; j <= col + 1; j++) {
          // 周囲タイルがボードの範囲外にある場合は処理をスキップ
          if (i < 0 || i >= ROWS || j < 0 || j >= COLS) {
            continue;
          }
          const idx = i * COLS + j;
          const adjacentTile = tiles[idx];
          //周囲の各タイルが返されていないされていないなら
          if (
            adjacentTile.dataset.revealed !== "true" &&
            adjacentTile.dataset.flagged === "false"
          ) {
            // if (adjacentTile.dataset.revealed !== "true") {
            // フラグがあれば外す
            // if (tile.dataset.flagged == "true") {
            //   tile.textContent = "";
            //   tile.dataset.flagged = "false";
            //   numFlags--;
            //   updateMineCounter();
            // }
            // 再帰的にrevealTile関数を呼び出して、周囲のタイルを表示。
            revealTile(adjacentTile);
          }
        }
      }
    }
    // すべての地雷を表示(データ属性の値を変更、CSSが連動);
    function revealMines() {
      mineLocations.forEach((num) => {
        tiles[num].dataset.revealed = "true";
      });
    }

    //ゲームが勝利したか
    function checkWin() {
      // 残りタイル数＝地雷数かつ旗数
      if (numUnrevealedTiles === NUM_MINES && numFlags === NUM_MINES) {
        gameOver = true;
        stopTimer();
        alert("おめでとうございます！ゲームに勝ちました！");
      }
    }
  }

  //地雷-フラグの数を表示する
  function updateMineCounter() {
    const mineCounter = document.getElementById("mine-counter");
    const numMines = NUM_MINES - numFlags;
    mineCounter.textContent = `Mines: ${numMines}`;
  }

  // タイマーを開始する;
  function startTimer() {
    startTime = Date.now();
    timerIntervalId = setInterval(updateTimer, 1000);
  }
  // HTMLのタイマーを更新;
  function updateTimer() {
    const timerElement = document.getElementById("timer");
    const elapsedSeconds = Date.now() - startTime;
    const second = Math.floor(elapsedSeconds / 1000) % 60; //秒に変換
    //文字列に変換し、0で埋めて2桁にする
    const s = second.toString().padStart(2, "0");
    const minute = Math.floor(elapsedSeconds / 1000 / 60); //分に変換
    const m = minute.toString().padStart(2, "0");
    timerElement.textContent = `${m}:${s}`;
  }
  // タイマーを停止する
  function stopTimer() {
    clearInterval(timerIntervalId);
  }

}
