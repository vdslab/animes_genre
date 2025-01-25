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
  handleSvgClick,
}) => {
  useEffect(() => {
    if(scaleStatus){
    const canvas = document.getElementById("myCanvas");
    const ctx = canvas.getContext("2d"); // 2D描画コンテキスト

    // キャンバスをクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // ノードデータの描画
    nodedata.map((node,index) => {
      console.log(scales.xScale(node.x) / 4,
      scales.yScale(node.y) / 4,
      nodeScale(node[select][yearsnext][monthsnext]) / 4,)
      ctx.beginPath(); // 新しいパスを開始

      if (!allview) {
        // allviewがfalseの場合、データが0でない場合のみ描画
        if (node[select][yearsnext][monthsnext] !== 0) {
          
          ctx.arc(
            scales.xScale(node.x) / 4,
            scales.yScale(node.y) / 4,
            nodeScale(node[select][yearsnext][monthsnext]) / 4,
            0,
            Math.PI * 2
          );
        }
      } else {
        // allviewがtrueの場合、すべて描画
        ctx.arc(
          scales.xScale(node.x) / 4,
          scales.yScale(node.y) / 4,
          nodeScale(alldata[index][select]) / 4,
          0,
          Math.PI * 2
        );
      }

      ctx.fillStyle = "blue"; // 塗りつぶしの色
      ctx.fill(); // 塗りつぶし
      ctx.closePath(); // パスを閉じる
      ctx.beginPath();

      ctx.rect(-zoomscale.x / 4 / zoomscale.k, -zoomscale.y / 4 / zoomscale.k, 300 / zoomscale.k, 300 / zoomscale.k); // (x, y, 幅, 高さ)
      ctx.strokeStyle = "red"; // 枠線の色
      ctx.lineWidth = 5; // 枠線の太さ
      ctx.stroke(); // 枠線描画
      ctx.closePath();
    });
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
  ]); // 依存関係を追加して再描画を行う

  return (
    <div className="mini_graph">
    {scaleStatus?(
      <canvas id="myCanvas" width="300" height="300" onClick={handleSvgClick}></canvas>
    ):<div>少々お待ちください</div>}
    </div>
  );
};

export default MiniGraph;
