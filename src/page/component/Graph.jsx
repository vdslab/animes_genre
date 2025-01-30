import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import MiniGraph from "./MiniGraph";
import Select from "react-select";

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
  const [transform, setTransform] = useState(d3.zoomIdentity); // 現在の変換（ズームとパン）
  const [clickNodeInternal, setClickNodeInternal] = useState(null); // 内部クリックノード状態
  const zoomRef = useRef(null); // D3ズームインスタンスの参照
  const [status,setStatus]=useState(false)
  // Canvasクリック時の処理
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect(); // キャンバスの位置とサイズを取得
    const x = (e.clientX - rect.left - transform.x) / transform.k; // 現在の変換を考慮したX座標
    const y = (e.clientY - rect.top - transform.y) / transform.k; // 現在の変換を考慮したY座標

    // クリックされたノードを見つける
    const clickedNode = nodedata.find((node, index) => {
      const nodeX = node.x;
      const nodeY = node.y;
      const radius = allview
        ? nodeScale(alldata[index][select])
        : nodeScale(node[select][yearsnext][monthsnext]);

      const distance = Math.sqrt(
        Math.pow(x - nodeX, 2) + Math.pow(y - nodeY, 2)
      );
      return distance <= radius;
    });

    if (clickedNode && zoomRef.current) {
      setClickNodeInternal(clickedNode);
      setClickNode(clickedNode);
      // ノードを中心にズームするための新しい変換を作成
      const newTransform = d3.zoomIdentity
        .translate(
          canvas.width / 2 - clickedNode.x * 5,
          canvas.height / 2 - clickedNode.y * 5
        )
        .scale(5);
      d3.select(canvas)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, newTransform);
    }
  };

  // 描画用のuseEffect
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

        // 現在の変換を適用
        ctx.save();
        ctx.translate(transform.x, transform.y);
        ctx.scale(transform.k, transform.k);

        // ノードを描画
        nodedata.forEach((node, index) => {
          const x = node.x; // シミュレーションで決定されたx座標
          const y = node.y; // シミュレーションで決定されたy座標

          const radius = allview
            ? nodeScale(alldata[index][select])
            : nodeScale(node[select][yearsnext][monthsnext]);

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = clickNodeInternal === node ? "orange" : "blue"; // クリックされたノードをハイライト
          ctx.fill(); // 塗りつぶし
          ctx.closePath();
        });
        ctx.restore(); // 変換をリセット
      }
      console.log(transform)
      // シミュレーション開始
      simulation.alpha(!status?1.5:0).restart();
      setStatus(true)

      // アンマウント時にシミュレーションを停止
      return () => {
        simulation.stop();
      };
    }
  }, [
    scaleStatus,
    nodedata,
    transform,
    allview,
    alldata,
    select,
    yearsnext,
    monthsnext,
    nodeScale,
    clickNodeInternal,
  ]);

  // D3 Zoomの設定
  useEffect(() => {
    const canvas = canvasRef.current;

    // ズームの動作を定義
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 20]) // ズームの範囲を定義
      .on("zoom", (event) => {
        setTransform(event.transform); // 変換状態を更新
      });

    zoomRef.current = zoom; // zoomをrefに保存

    // ズームの動作をキャンバスに適用
    d3.select(canvas).call(zoom);
  }, []);

  return (
    <div>
      <Select
        options={nodedata}
        value={clickNode}
        getOptionLabel={(option) => option.animename || "Unknown Anime"}
        onChange={(option) => {
          setClickNode(option);
          // 選択されたノードを中心にズーム
          if (zoomRef.current) {
            const canvas = canvasRef.current;
            const newTransform = d3.zoomIdentity
              .translate(
                canvas.width / 2 - option.x * 5,
                canvas.height / 2 - option.y * 5
              )
              .scale(5);
            d3.select(canvas)
              .transition()
              .duration(750)
              .call(zoomRef.current.transform, newTransform);
          }
        }}
        placeholder="アニメを検索..."
        filterOption={(option, inputValue) => {
          // animenameとshortnameでフィルタリング
          const animename = (option.animename || "")
            .toLowerCase()
            .includes(inputValue.toLowerCase());
          const anime_shortname = (option.shortname || [])
            .filter((item) => item)
            .some((item) =>
              item.toLowerCase().includes(inputValue.toLowerCase())
            );

          return animename || anime_shortname;
        }}
      />
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
        startXY={{ x: transform.x, y: transform.y }}
        setStartXY={(xy) =>
          setTransform(d3.zoomIdentity.translate(xy.x, xy.y).scale(transform.k))
        }
        zoomLevel={transform.k}
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
            cursor: "grab",
          }}
          onClick={handleCanvasClick} // クリックイベントを追加
        ></canvas>
      </div>
    </div>
  );
};

export default Graph;
