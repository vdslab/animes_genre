import React, { useEffect } from "react";

const MiniGraph = ({
  zoomscale,
  nodedata,
  scales,
  nodeScale,
  allview,
  alldata,
  select,
  yearsnext,
  monthsnext,
  scaleStatus,
  startXY,
  setStartXY,
  zoomLevel,
  clickNodeInternal
}) => {
  const nodes = nodedata;

  // クリックイベントの処理
  const handleCanvasClick = (e) => {
    const canvas = document.getElementById("myCanvas");
    const rect = canvas.getBoundingClientRect(); // キャンバスの位置とサイズを取得
    const x = e.clientX - rect.left; // マウスのX座標（キャンバス内での位置）
    const y = e.clientY - rect.top;  // マウスのY座標（キャンバス内での位置）

    // ズームレベルを考慮してクリック位置を調整
    setStartXY({ x: x*zoomLevel*4 , y: y*zoomLevel*4});
    console.log(x, y);
  };

  useEffect(() => {
    if (scaleStatus) {
      const canvas = document.getElementById("myCanvas");
      const ctx = canvas.getContext("2d"); // 2D描画コンテキスト

      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ノードデータの描画
      nodes.forEach((node, index) => {
        ctx.beginPath(); // 新しいパスを開始

        if (!allview) {
          // allviewがfalseの場合、データが0でない場合のみ描画
          if (node[select][yearsnext][monthsnext] !== 0) {
            ctx.arc(
              node.x / 4,
              node.y / 4,
              nodeScale(node[select][yearsnext][monthsnext]) / 4,
              0,
              Math.PI * 2
            );
          }
        } else {
          // allviewがtrueの場合、すべて描画
          ctx.arc(
            node.x / 4,
            node.y / 4,
            nodeScale(alldata[index][select]) / 4,
            0,
            Math.PI * 2
          );
        }

        ctx.fillStyle = clickNodeInternal === node ? "orange" : "blue"; // クリックされたノードをハイライト
        ctx.fill(); // 塗りつぶし
        ctx.closePath(); // パスを閉じる

        // 赤い枠の描画
        
      });
      ctx.beginPath();
        ctx.rect(startXY.x /zoomLevel/ 4, startXY.y/ zoomLevel / 4, 300 / zoomLevel, 300 / zoomLevel); // (x, y, 幅, 高さ)
        ctx.strokeStyle = "red"; // 枠線の色
        ctx.lineWidth = 5; // 枠線の太さ
        ctx.stroke(); // 枠線描画
        ctx.closePath();
      return () => {
        // クリーンアップ時にイベントリスナーを削除
        canvas.removeEventListener("click", handleCanvasClick);
      };
    }
  }, [
    nodedata,
    zoomscale,
    scales,
    nodeScale,
    allview,
    select,
    yearsnext,
    monthsnext,
    startXY,
    zoomLevel,
    scaleStatus,
  ]);

  return (
    <div className="mini_graph">
      {scaleStatus ? (
        <canvas
          id="myCanvas"
          width="300"
          height="300"
          onClick={handleCanvasClick} // クリックイベントをここで処理
        ></canvas>
      ) : (
        <div>少々お待ちください</div>
      )}
    </div>
  );
};

export default MiniGraph;
