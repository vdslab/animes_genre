import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const Graph = ({
  scaleStatus,
  nodedata,
  zoomscale,
  allview,
  select,
  yearsnext,
  monthsnext,
  scales,
  nodeScale,
  alldata,
  setClickNode,
  clickNode,
}) => {
  const canvasRef = useRef(null); // Canvas要素の参照

  useEffect(() => {
    if (scaleStatus && nodedata.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d"); // 2D描画コンテキスト
      const width = canvas.width;
      const height = canvas.height;

      // // D3 Force Simulation
      const simulation = d3
        .forceSimulation(alldata) // ノードデータを使用
        .force("charge", d3.forceManyBody().strength(-30)) // 斥力
        .force("center", d3.forceCenter(width / 2, height / 2)) // 中央に引き寄せ
        .force(
          "collide",
          d3.forceCollide((node) => nodeScale(node[select]) )
        ) // ノード間の衝突防止
        .on("tick", ticked); // シミュレーションの更新

      // ノードの描画関数
      function ticked(){
        // Canvasをクリア
        ctx.clearRect(0, 0, width, height);

        nodedata.forEach((node,index) => {
          const x = scales.xScale(node.x);
          const y = scales.yScale(node.y);
          const radius = allview
            ? nodeScale(alldata[index][select])
            : nodeScale(node[select][yearsnext][monthsnext]) ;

          // ノードを描画
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = "blue"; // 塗りつぶしの色
          ctx.fill(); // 塗りつぶし
          ctx.closePath();
        });
    
      }
      console.log(simulation)
      // // シミュレーション開始
      simulation.alpha(1).restart();

      // アンマウント時にシミュレーションを停止
      return () => {
        simulation.stop();
      };
    }
  }, [
    scaleStatus,
    nodedata,
    zoomscale,
    scales,
    nodeScale,
    allview,
    select,
    yearsnext,
    monthsnext,
    alldata,
  ]);

  return (
    <div className="graph">
      <canvas
        ref={canvasRef}
        width="1200"
        height="1200"
        style={{ border: "1px solid #ccc", display: "block", margin: "0 auto" }}
      ></canvas>
    </div>
  );
};

export default Graph;
