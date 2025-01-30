import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import MiniGraph from "./MiniGraph";

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
  handleSvgClick,
}) => {
  const [state, setState] = useState(false);
  const canvasRef = useRef(null); // Canvas要素の参照
  const [zoomLevel, setZoomLevel] = useState(1); // ズームレベルの状態
  const [prevZoomLevel, setPrevZoomLevel] = useState(zoomLevel);
 const [startXY, setStartXY] = useState({ x: 0, y: 0 });

  const handleCanvasClick = (e) => {
    const canvas = document.getElementById("Canvas");
    const rect = canvas.getBoundingClientRect(); // キャンバスの位置とサイズを取得
    const x = e.clientX - rect.left; // マウスのX座標（キャンバス内での位置）
    const y = e.clientY - rect.top; // マウスのY座標（キャンバス内での位置）
    console.log(startXY, zoomLevel);

    // ズームレベルを考慮してクリック位置を調整
    const adjustedX = startXY.x + x / zoomLevel;
    const adjustedY = startXY.y + y / zoomLevel;
    console.log(adjustedX, adjustedY);

    // ノードを1つ1つチェックして、クリックが円内かどうか判定
    nodedata.forEach((node, index) => {
      const nodeX = node.x;
      const nodeY = node.y;
      const radius = allview
        ? nodeScale(alldata[index][select]) // allviewがtrueならalldataを使用
        : nodeScale(node[select][yearsnext][monthsnext]); // 否なら、選択されたデータを使用

      // クリック位置が円内かどうかを確認
      const distance = Math.sqrt(
        Math.pow(adjustedX - nodeX, 2) + Math.pow(adjustedY - nodeY, 2)
      );
      if (distance <= radius * zoomLevel) {
        setClickNode(node); // クリックされたノードを設定
        setZoomLevel(5);
        setStartXY({ x: nodeX - 120, y: nodeY - 120 }); // ズームを考慮してオフセットを更新
      }
    });
  };

  useEffect(() => {
    if (scaleStatus && nodedata.length > 0) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d"); // 2D描画コンテキスト
      const width = canvas.width;
      const height = canvas.height;

      // D3 Force Simulation
      const simulation = d3
        .forceSimulation(nodedata) // ノードデータを使用
        .force("charge", d3.forceManyBody().strength(-0.15)) // 斥力を小さく
        .force("center", d3.forceCenter(width / 2, height / 2).strength(0.1)) // 中央引き寄せを弱める

        .force(
          "collide",
          d3.forceCollide((node, index) =>
            allview
              ? nodeScale(alldata[index][select]) / 2
              : nodeScale(node[select][yearsnext][monthsnext]) / 2
          )
        ) // ノード間の衝突防止
        .on("tick", ticked); // シミュレーションの更新

      // ノードの描画関数
      function ticked() {
        // Canvasをクリア
        ctx.clearRect(0, 0, width, height);

        // ズームとオフセットを考慮して描画
        ctx.save();
        ctx.scale(zoomLevel, zoomLevel);
        if (clickNode != null) {
          ctx.translate(-startXY.x, -startXY.y);
        }

        // ノードを描画
        nodedata.forEach((node, index) => {
          const x = node.x; // シミュレーションで決定されたx座標
          const y = node.y; // シミュレーションで決定されたy座標

          const radius = allview
            ? nodeScale(alldata[index][select])
            : nodeScale(node[select][yearsnext][monthsnext]);

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = "blue"; // 塗りつぶしの色
          ctx.fill(); // 塗りつぶし
          ctx.closePath();
        });

        ctx.restore(); // ズームとオフセットの変更をリセット
      }

      // シミュレーション開始
      simulation.alpha(1.5).restart();

      // アンマウント時にシミュレーションを停止
      return () => {
        simulation.stop();
      };
    }
  }, []);

  useEffect(() => {
    if (scaleStatus) {
      const canvas = document.getElementById("Canvas");
      canvas.addEventListener("click", handleCanvasClick);
      const ctx = canvas.getContext("2d"); // 2D描画コンテキスト

      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (prevZoomLevel !== zoomLevel) {
        ctx.scale(zoomLevel, zoomLevel);
        setPrevZoomLevel(zoomLevel);
      }

      
      ctx.translate(-startXY.x, -startXY.y);
      

      // ノードデータの描画
      nodedata.map((node, index) => {
        ctx.beginPath(); // 新しいパスを開始

        if (!allview) {
          // allviewがfalseの場合、データが0でない場合のみ描画
          if (node[select][yearsnext][monthsnext] !== 0) {
            ctx.arc(
              node.x,
              node.y,
              nodeScale(node[select][yearsnext][monthsnext]),
              0,
              Math.PI * 2
            );
          }
        } else {
          // allviewがtrueの場合、すべて描画
          ctx.arc(
            node.x,
            node.y,
            nodeScale(alldata[index][select]),
            0,
            Math.PI * 2
          );
        }

        ctx.fillStyle = "blue"; // 塗りつぶしの色
        ctx.fill(); // 塗りつぶし
        ctx.closePath(); // パスを閉じる
      });

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
    clickNode,
    zoomLevel,
    startXY,
  ]);
  const handleMouseDown = (e) => {
    const startX = e.clientX;
    const startY = e.clientY;
  
    const handleMouseMove = (moveEvent) => {
      // マウスの移動量を計算
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
  
      // 移動量に基づいてstartXYを更新
      setStartXY((prev) => ({
        x: prev.x - deltaX/ zoomLevel,
        y: prev.y - deltaY/ zoomLevel,
      }));
  
      // 新しい開始位置に基づいてマウスの位置をリセット
      startX = moveEvent.clientX;
      startY = moveEvent.clientY;
    };
  
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };
  

  return (
    <div>
      <MiniGraph
        zoomscale={zoomscale}
        nodedata={nodedata}
        scales={scales}
        nodeScale={nodeScale}
        allview={allview}
        alldata={alldata}
        select={select}
        yearsnext={yearsnext}
        monthsnext={monthsnext}
        scaleStatus={scaleStatus}
        handleSvgClick={handleSvgClick}
        startXY={startXY}
        setStartXY={setStartXY}
        zoomLevel={zoomLevel}
      />
      <div className="graph">
        <canvas
          ref={canvasRef}
          id="Canvas"
          width="1200"
          height="1200"
          style={{
            border: "1px solid #ccc",
            display: "block",
            margin: "0 auto",
          }}
          onMouseDown={handleMouseDown} // ここでマウスダウンイベントを追加
        ></canvas>
      </div>
    </div>
  );
};

export default Graph;
