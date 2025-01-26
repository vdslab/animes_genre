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
  const canvasRef = useRef(null); // Canvasを参照するためのuseRef

  useEffect(() => {
    // ノードデータを加工して、Sigmaで使える形に変換
    const noders = nodedata.map((node, index) => ({
      id: index.toString(), // idは文字列にする必要がある
      label: node["animename"],
      x: node["x"],
      y: node["y"],
      size: allview
        ? nodeScale(alldata[index][select])
        : nodeScale(node[select][yearsnext][monthsnext]),
      image: node["coverImg"],
    }));

    // Sigmaのインスタンスを作成
    const s = new sigma({
      container: canvasRef.current, // `div`の代わりに`canvas`を指定
      graph: {
        nodes: noders,
        edges: [], // ここにエッジのデータも追加する必要があれば指定
      },
      settings: {
        defaultNodeImage: 'https://www.example.com/path/to/default-image.png', // デフォルト画像
      },
    });

    // カスタムノード描画処理
    s.renderers[0].renderer.settings.customNodeRenderer = (node) => {
      const context = s.renderers[0].renderer.context;
      const image = new Image();
      image.src = node.image || s.settings('defaultNodeImage');
      
      image.onload = () => {
        context.drawImage(
          image,
          node.x - node.size / 2,  // ノードX位置
          node.y - node.size / 2,  // ノードY位置
          node.size,               // ノードサイズ（画像のサイズ）
          node.size                // ノードサイズ（画像のサイズ）
        );
      };
    };

    // コンポーネントがアンマウントされるときにSigmaインスタンスを破棄
    return () => {
      s.kill();
    };
  }, [nodedata, allview, select, yearsnext, monthsnext, alldata, nodeScale]); // 依存関係を指定

  return <canvas ref={canvasRef} width="1200" height="1200" style={{ width: '100%', height: '100%' }} />;
};



//   // クリックイベントの処理
//   const handleCanvasClick = (e) => {
//     const canvas = document.getElementById("Canvas");
//     const rect = canvas.getBoundingClientRect(); // キャンバスの位置とサイズを取得
//     const x = e.clientX - rect.left; // マウスのX座標（キャンバス内での位置）
//     const y = e.clientY - rect.top;  // マウスのY座標（キャンバス内での位置）

//     // ノードを1つ1つチェックして、クリックが円内かどうか判定
//     nodedata.forEach((node, index) => {
//       const nodeX = scales.xScale(node.x);
//       const nodeY = scales.yScale(node.y);
//       const radius = allview
//         ? nodeScale(alldata[index][select]) // allviewがtrueならalldataを使用
//         : nodeScale(node[select][yearsnext][monthsnext]); // 否なら、選択されたデータを使用

//       // クリック位置が円内かどうかを確認
//       const distance = Math.sqrt(Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2));
//       if (distance <= radius) {
//         setClickNode(node)
//       }
//     });
//   };

//   useEffect(() => {
//     if (scaleStatus) {
//       const canvas = document.getElementById("Canvas");
//       const ctx = canvas.getContext("2d");

//       // キャンバスをクリア
//       ctx.clearRect(0, 0, canvas.width, canvas.height);

//       // ノードの描画
//       nodedata.map((node, index) => {
//         const nodeX = scales.xScale(node.x);
//         const nodeY = scales.yScale(node.y);
//         const radius = allview
//           ? nodeScale(alldata[index][select])
//           : nodeScale(node[select][yearsnext][monthsnext]);

//         ctx.beginPath();
//         ctx.arc(nodeX, nodeY, radius, 0, Math.PI * 2);
//         ctx.fillStyle = "blue";
//         ctx.fill();
//         ctx.closePath();
//       });

//       // クリックイベントリスナーを追加
//       canvas.addEventListener("click", handleCanvasClick);
//     }

//     // クリーンアップ: コンポーネントがアンマウントされる際にイベントリスナーを削除
//     return () => {
//       const canvas = document.getElementById("Canvas");
//       canvas.removeEventListener("click", handleCanvasClick);
//     };
//   }, [nodedata, zoomscale, scales, nodeScale, allview, select, yearsnext, monthsnext, scaleStatus]);

//   return (
//     <div className="graph">
//       {scaleStatus ? (
//         <canvas ref={svgRef} id="Canvas" width="1200" height="1200"></canvas>
//       ) : (
//         <div>少々お待ちください</div>
//       )}
//     </div>
//   );
// };

export default Graph;
