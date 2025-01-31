import { useEffect } from "react";
import * as d3 from "d3";
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
  clickNodeInternal,
  canvasmain,
  zoomRef

}) => {
  const nodes = nodedata;

  // クリックイベントの処理
  const handleCanvasClick = (e) => {
    const canvas = document.getElementById("myCanvas");
    const rect = canvas.getBoundingClientRect(); // キャンバスの位置とサイズを取得
    const x = e.clientX - rect.left; // マウスのX座標（キャンバス内での位置）
    const y = e.clientY - rect.top;  // マウスのY座標（キャンバス内での位置）

    // ズームレベルを考慮してクリック位置を調整
    // (x, y)座標はズームレベルやキャンバス内の相対位置に依存します
    const newStartXY = {
      k: startXY.k,
      x: -(x * 10 * 4) + 2400 / zoomLevel,
      y: -(y * 10 * 4) + 2400 / zoomLevel
    };
    const newTransform = d3.zoomIdentity
            .translate(
              -(x * 10 * 4) + 2400 / zoomLevel ,
              -(y * 10 * 4) + 2400 / zoomLevel
            )
            .scale(10);
          d3.select(canvasmain)
            .transition()
            .duration(750)
            .call(zoomRef.current.transform, newTransform);
    // 状態を更新
    setStartXY(newStartXY);
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
      });

      // 赤い枠の描画
      ctx.beginPath();
      console.log(startXY);
      ctx.rect(-(startXY.x) / 10 / 4, -(startXY.y) / 10 / 4, 300 / zoomLevel, 300 / zoomLevel); // (x, y, 幅, 高さ)
      ctx.strokeStyle = "red"; // 枠線の色
      ctx.lineWidth = 2.5; // 枠線の太さ
      ctx.stroke(); // 枠線描画
      ctx.closePath();
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
    startXY,  // ここでstartXYが更新されるたびに描画が更新されます
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