import React, { useEffect } from "react";

const Graph = ({
  svgRef,
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

  // クリックイベントの処理
  const handleCanvasClick = (e) => {
    const canvas = document.getElementById("Canvas");
    const rect = canvas.getBoundingClientRect(); // キャンバスの位置とサイズを取得
    const x = e.clientX - rect.left; // マウスのX座標（キャンバス内での位置）
    const y = e.clientY - rect.top;  // マウスのY座標（キャンバス内での位置）

    // ノードを1つ1つチェックして、クリックが円内かどうか判定
    nodedata.forEach((node, index) => {
      const nodeX = scales.xScale(node.x);
      const nodeY = scales.yScale(node.y);
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
    if (scaleStatus) {
      const canvas = document.getElementById("Canvas");
      const ctx = canvas.getContext("2d");

      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // ノードの描画
      nodedata.map((node, index) => {
        const nodeX = scales.xScale(node.x);
        const nodeY = scales.yScale(node.y);
        const radius = allview
          ? nodeScale(alldata[index][select])
          : nodeScale(node[select][yearsnext][monthsnext]);

        ctx.beginPath();
        ctx.arc(nodeX, nodeY, radius, 0, Math.PI * 2);
        ctx.fillStyle = "blue";
        ctx.fill();
        ctx.closePath();
      });

      // クリックイベントリスナーを追加
      canvas.addEventListener("click", handleCanvasClick);
    }

    // クリーンアップ: コンポーネントがアンマウントされる際にイベントリスナーを削除
    return () => {
      const canvas = document.getElementById("Canvas");
      canvas.removeEventListener("click", handleCanvasClick);
    };
  }, [nodedata, zoomscale, scales, nodeScale, allview, select, yearsnext, monthsnext, scaleStatus]);

  return (
    <div className="graph">
      {scaleStatus ? (
        <canvas id="Canvas" width="1200" height="1200"></canvas>
      ) : (
        <div>少々お待ちください</div>
      )}
    </div>
  );
};

export default Graph;
