import React, { useEffect, useRef,useState } from "react";
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
  const canvasRef = useRef(null); // Canvas要素の参照
  const [zoomLevel, setZoomLevel] = useState(1); // ズームレベルの状態
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // オフセット（平行移動の位置）
  const handleCanvasClick = (e) => {
    const canvas = document.getElementById("Canvas");
    const rect = canvas.getBoundingClientRect(); // キャンバスの位置とサイズを取得
    const x = e.clientX - rect.left; // マウスのX座標（キャンバス内での位置）
    const y = e.clientY - rect.top;  // マウスのY座標（キャンバス内での位置）
    console.log(x,y)
    // ノードを1つ1つチェックして、クリックが円内かどうか判定
    nodedata.forEach((node, index) => {
      const nodeX = node.x;
      const nodeY = node.y;
      const radius = allview
        ? nodeScale(alldata[index][select]) // allviewがtrueならalldataを使用
        : nodeScale(node[select][yearsnext][monthsnext]); // 否なら、選択されたデータを使用

      // クリック位置が円内かどうかを確認
      const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
      if (distance <= radius) {
        setClickNode(node); // クリックされたノードを設定
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
          d3.forceCollide((node,index) =>
            allview
              ? nodeScale(alldata[index][select])/2
              : nodeScale(node[select][yearsnext][monthsnext])/2
          )
        ) // ノード間の衝突防止
        .on("tick", ticked); // シミュレーションの更新

      // ノードの描画関数
      // ノードの描画関数
function ticked() {
  // Canvasをクリア
  ctx.clearRect(0, 0, width, height);

  // ノードを描画
  nodedata.forEach((node, index) => {
    let x = node.x; // シミュレーションで決定されたx座標
    let y = node.y; // シミュレーションで決定されたy座標


    const radius = allview
      ? nodeScale(alldata[index][select])
      : nodeScale(node[select][yearsnext][monthsnext]);

    // ノードを描画
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "blue"; // 塗りつぶしの色
    ctx.fill(); // 塗りつぶし
    ctx.closePath();
    
  });
}


      // シミュレーション開始
      simulation.alpha(1).restart();

      // アンマウント時にシミュレーションを停止
      return () => {
        simulation.stop();
      };
    }
  }, []);
  useEffect(() => {
      if(scaleStatus){
      const canvas = document.getElementById("Canvas");
      canvas.addEventListener("click", handleCanvasClick);
      const ctx = canvas.getContext("2d"); // 2D描画コンテキスト
  
      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // ノードデータの描画
      nodedata.map((node,index) => {
        ctx.beginPath(); // 新しいパスを開始
  
        if (!allview) {
          // allviewがfalseの場合、データが0でない場合のみ描画
          if (node[select][yearsnext][monthsnext] !== 0) {
            
            ctx.arc(
              node.x ,
              node.y ,
              nodeScale(node[select][yearsnext][monthsnext]) ,
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
      zoomLevel,
      offset,
    ]); // 依存関係を追加して再描画を行う
    useEffect(() => {
      const canvasDiv = document.querySelector(".graph");
  
      const handleWheel = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
  
        // マウスカーソルの位置を取得
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
  
        // ズーム倍率の変更
        const newZoom = Math.max(0.5, Math.min(zoomLevel - e.deltaY * 0.005, 5)); // ズーム感度を調整
  
        // ズーム前後の位置差を計算
        const scaleFactor = newZoom / zoomLevel;
        const dx = mouseX - offset.x;
        const dy = mouseY - offset.y;
  
        // オフセットを調整
        setOffset((prev) => ({
          x: prev.x - dx * (scaleFactor - 1),
          y: prev.y - dy * (scaleFactor - 1),
        }));
  
        setZoomLevel(newZoom);
      };
  
      // passive: false にして preventDefault を許可
      canvasDiv.addEventListener("wheel", handleWheel, { passive: false });
  
      // クリーンアップ
      return () => {
        canvasDiv.removeEventListener("wheel", handleWheel);
      };
    }, [zoomLevel, offset]); // 依存関係として zoomLevel と offset を追加
  
    // マウスドラッグで平行移動
    const handleMouseDown = (e) => {
      const startX = e.clientX;
      const startY = e.clientY;
  
      const handleMouseMove = (moveEvent) => {
        setOffset((prev) => ({
          x: prev.x + moveEvent.movementX,
          y: prev.y + moveEvent.movementY,
        }));
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
      />
    <div className="graph">
      <canvas
        ref={canvasRef}
        id="Canvas"
        width="1200"
        height="1200"
        style={{ border: "1px solid #ccc", display: "block", margin: "0 auto" }}
      ></canvas>
    </div>
    </div>
  );
};

export default Graph;
