import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import MiniGraph from "./MiniGraph";
import Select from "react-select";
import { Loading } from "../../../common/components/Loding";
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
  canvasRef,
  yearsanime,
  setYearsanime,
  years,
}) => {
  const [mouseXY, setMouseXY] = useState({ x: 0, y: 0 });
  const [updateNodeData, setUpdateNodeData] = useState([]);
  const [images, setImages] = useState([]);
  const [transform, setTransform] = useState(d3.zoomIdentity); // 現在の変換（ズームとパン）
  const [clickNodeInternal, setClickNodeInternal] = useState(null); // 内部クリックノード状態
  const zoomRef = useRef(null); // D3ズームインスタンスの参照
  const [status, setStatus] = useState(false);
  const [hoversNode, setHovrsNode] = useState(null);

  const handleMouseMove = (e) => {
    const canvasElement = canvasRef.current;
    if (!canvasElement || updateNodeData.length === 0) return;

    const rect = canvasElement.getBoundingClientRect(); // キャンバスの位置とサイズを取得

    // スケール補正（実際のキャンバスのサイズに正規化）
    const scaleX = canvasElement.width / rect.width;
    const scaleY = canvasElement.height / rect.height;

    // CSSスケールを考慮したマウス位置を取得
    const x = ((e.clientX - rect.left) * scaleX - transform.x) / transform.k;
    const y = ((e.clientY - rect.top) * scaleY - transform.y) / transform.k;

    setMouseXY({ x: e.clientX, y: e.clientY });

    const hoverNode = nodedata.find((node, index) => {
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

    setHovrsNode(hoverNode);
  };

  const handleToolClick = (order) => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return; // canvasがnullの場合は何もしない

    const width = canvasElement.width;
    const height = canvasElement.height;

    // 現在のズーム状態を取得
    const currentTransform = transform;

    // 中心を基準にズームするための変換
    const centerX = width / 2;
    const centerY = height / 2;

    let newTransform;

    if (order === "all") {
      // "ALL"ボタンの場合、ズームをリセットして全体を表示
      newTransform = d3.zoomIdentity.translate(0, 0).scale(1);
    } else if (order === "minus" && currentTransform.k > 0.5) {
      // "minus"ボタンの場合、ズームアウト（中心を基準に）
      const scaleDelta = currentTransform.k * 0.5;
      newTransform = d3.zoomIdentity
        .translate(
          centerX -
            ((centerX - currentTransform.x) * scaleDelta) / currentTransform.k,
          centerY -
            ((centerY - currentTransform.y) * scaleDelta) / currentTransform.k
        )
        .scale(currentTransform.k * 0.5);
    } else if (order === "plus" && currentTransform.k < 50) {
      // "plus"ボタンの場合、ズームイン（中心を基準に）
      const scaleDelta = currentTransform.k * 1.5;
      newTransform = d3.zoomIdentity
        .translate(
          centerX -
            ((centerX - currentTransform.x) * scaleDelta) / currentTransform.k,
          centerY -
            ((centerY - currentTransform.y) * scaleDelta) / currentTransform.k
        )
        .scale(currentTransform.k * 1.5);
    }

    if (newTransform) {
      // 変換を適用
      d3.select(canvasElement)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, newTransform);
    }
  };

  // Canvasクリック時の処理
  const handleCanvasClick = (e) => {
    // canvasRef.currentがnullでないことを確認
    const canvasElement = canvasRef.current;
    if (!canvasElement || updateNodeData.length == 0) return; // canvasがnullの場合は何もしない
    const rect = canvasElement.getBoundingClientRect(); // キャンバスの位置とサイズを取得
    // スケール補正（実際のキャンバスのサイズに正規化）
    const scaleX = canvasElement.width / rect.width;
    const scaleY = canvasElement.height / rect.height;

    // CSSスケールを考慮したマウス位置を取得
    const x = ((e.clientX - rect.left) * scaleX - transform.x) / transform.k;
    const y = ((e.clientY - rect.top) * scaleY - transform.y) / transform.k;
    console.log(e.clientX - rect.left, e.clientY - rect.top);
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
          canvasElement.width / 2 - clickedNode.x * 30,
          canvasElement.height / 2 - clickedNode.y * 30
        )
        .scale(30);
      d3.select(canvasElement)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, newTransform);
    }
  };

  // 画像の読み込み
  useEffect(() => {
    const loadImages = async () => {
      for (let i = 0; i < nodedata.length; i++) {
        const node = nodedata[i];
        const image = new Image();
        image.src = node.coverImage;

        // 画像が読み込まれるのを待つ
        await new Promise((resolve) => {
          image.onload = () => resolve(image);
        });

        // 画像が読み込まれるたびに状態を更新
        setImages((prevImages) => [...prevImages, image]);
      }
    };

    loadImages(); // 画像を順番にロード
  }, [nodedata]);

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
        .on("tick", ticked) // シミュレーションの更新
        .on("end", () => {
          setUpdateNodeData(nodedata);
        });
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
          ctx.fillStyle = clickNode === node ? "orange" : "blue"; // クリックされたノードをハイライト
          ctx.fill(); // 塗りつぶし
          ctx.closePath();
        });

        ctx.restore(); // 変換をリセット
      }

      // シミュレーション開始
      simulation.alpha(!status ? 2.5 : 0).restart();
      setStatus(true);

      // アンマウント時にシミュレーションを停止
      return () => {
        simulation.stop();
      };
    }
  }, [nodedata, scaleStatus]);
  useEffect(() => {
    if (
      status &&
      updateNodeData.length != 0 &&
      scaleStatus &&
      nodedata.length > 0
    ) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d"); // 2D描画コンテキスト
      const width = canvas.width;
      const height = canvas.height;
      // Canvasをクリア
      ctx.clearRect(0, 0, width, height);

      // 現在の変換を適用
      ctx.save();
      ctx.translate(transform.x, transform.y);
      ctx.scale(transform.k, transform.k);
      // ノードを描画
      nodedata.forEach((node, index) => {
        if (yearsanime == null || node.startDate.year == yearsanime) {
          const x = node.x;
          const y = node.y;
          const radius = allview
            ? nodeScale(alldata[index][select])
            : nodeScale(node[select][yearsnext][monthsnext]);
          if (transform.k <= 3) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            let color = null;
            if (hoversNode === node) {
              color = "red";
            } else if (clickNode === node) {
              color = "orange";
            } else {
              color = "blue";
            }
            ctx.fillStyle = color; // クリックされたノードをハイライト
            ctx.fill(); // 塗りつぶし
            ctx.closePath();
          } else {
            const image = images[index]; // 読み込んだ画像を取得

            if (image) {
              // 画像が読み込まれていれば描画
              ctx.save();
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, Math.PI * 2); // 円のパスを作成
              ctx.clip(); // クリッピングを適用

              // 画像を描画 (画像の中央をx, yに合わせて表示)
              ctx.drawImage(
                image,
                x - radius,
                y - radius,
                radius * 2,
                radius * 2
              );
              if (clickNode == node) {
                ctx.arc(x, y, radius, 0, Math.PI * 2); // もう一度同じ円を描画
                ctx.lineWidth = 1; // 枠線の太さ
                ctx.strokeStyle = "orange"; // 枠線の色を赤に設定
                ctx.stroke(); // 枠線を描画
              }
              ctx.restore(); // 状態をリセット
            } else {
              ctx.beginPath();
              ctx.arc(x, y, radius, 0, Math.PI * 2);
              ctx.fillStyle = clickNode === node ? "orange" : "blue"; // クリックされたノードをハイライト
              ctx.fill(); // 塗りつぶし
              ctx.closePath();
              ctx.font = "1px Arial"; // フォントサイズとフォントタイプ
              ctx.fillStyle = "#FF5733"; // 文字の色
              ctx.textAlign = "center"; // 文字の配置（中央）
              ctx.textBaseline = "middle"; // 文字の基準線（中央）

              // 文字を描画
              ctx.fillText("Now Loading!", x, y);

              // 枠線付きで文字を描画（オプション）
              ctx.strokeStyle = "black"; // 枠線の色
              ctx.lineWidth = 2; // 枠線の太さ
            }
          }
        }
      });

      ctx.restore(); // 変換をリセット
    }
  }, [
    scaleStatus,
    transform,
    allview,
    select,
    yearsnext,
    monthsnext,
    clickNodeInternal,
    images, // imagesの状態に依存
    yearsanime,
  ]);
  // D3 Zoomの設定
  useEffect(() => {
    const canvas = canvasRef.current;

    // ズームの動作を定義
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 50]) // ズームの範囲を定義
      .on("zoom", (event) => {
        setTransform(event.transform); // 変換状態を更新
      });

    zoomRef.current = zoom; // zoomをrefに保存

    // ズームの動作をキャンバスに適用
    d3.select(canvas).call(zoom);
  }, []);

  return (
    <div className="graph">
      <div className="tool">
        <button
          onClick={() => handleToolClick("plus")}
          style={transform.k > 50 ? { opacity: 0.5 } : { opacity: 1 }}
        >
          ＋
        </button>
        <button
          onClick={() => handleToolClick("minus")}
          style={transform.k == 0.5 ? { opacity: 0.5 } : { opacity: 1 }}
        >
          ー
        </button>
        <button onClick={() => handleToolClick("all")}>初期</button>
        <Select
          options={nodedata}
          value={clickNode}
          getOptionLabel={(option) => option.animename || "Unknown Anime"}
          onChange={(option) => {
            if (nodedata.length != 0) {
              setClickNode(option);
              // 選択されたノードを中心にズーム
              if (zoomRef.current) {
                const canvas = canvasRef.current;
                const newTransform = d3.zoomIdentity
                  .translate(
                    canvas.width / 2 - option.x * 10,
                    canvas.height / 2 - option.y * 10
                  )
                  .scale(10);
                d3.select(canvas)
                  .transition()
                  .duration(750)
                  .call(zoomRef.current.transform, newTransform);
              }
            }
          }}
          placeholder="アニメを検索..."
          filterOption={(option, inputValue) => {
            if (nodedata.length != 0) {
              const animename = (option.data.animename || "")
                .toLowerCase()
                .includes(inputValue.toLowerCase());
              const anime_shortname = Array.isArray(option.data.shortname)
                ? option.data.shortname.some((item) =>
                    item.toLowerCase().includes(inputValue.toLowerCase())
                  )
                : (option.data.shortname || "")
                    .toLowerCase()
                    .includes(inputValue.toLowerCase());
              return animename || anime_shortname;
            }
          }}
        />
        <Select
          options={
            years.map((year) => ({ value: year, label: `${year}年` })) // 数字を文字列に変換してlabelにセット
          }
          value={
            yearsanime ? { value: yearsanime, label: `${yearsanime}年` } : null
          } // 数字を文字列に変換してvalueにセット
          getOptionLabel={(option) => option.label} // オプションラベルの取得
          onChange={(option) => setYearsanime(option ? option.value : null)} // 選択された値をセット
          placeholder="アニメの放送時期を選んでください" // プレースホルダ
          isClearable
        />
        <MiniGraph
          zoomscale={zoomscale}
          nodedata={updateNodeData}
          scales={scales}
          nodeScale={nodeScale}
          allview={allview}
          alldata={alldata}
          select={select}
          yearsnext={yearsnext}
          monthsnext={monthsnext}
          scaleStatus={scaleStatus}
          startXY={transform}
          setStartXY={setTransform}
          zoomLevel={transform.k}
          clickNode={clickNode}
          zoomRef={zoomRef}
          status={status}
          yearsanime={yearsanime}
          canvasmain={canvasRef}
        />
        <input
          type="range"
          min={0.5}
          max={50}
          value={transform.k}
          onChange={(e) => {
            const canvasElement = canvasRef.current;
            const newTransform = d3.zoomIdentity
              .translate(
                canvasElement.width / 2 -
                  ((canvasElement.width / 2 - transform.x) * e.target.value) /
                    transform.k,
                canvasElement.height / 2 -
                  ((canvasElement.height / 2 - transform.y) * e.target.value) /
                    transform.k
              )
              .scale(e.target.value);
            d3.select(canvasElement).call(
              zoomRef.current.transform,
              newTransform
            );
          }}
          style={{
            width: "300px",
            display: "block",
            margin: "0 auto",
          }}
        />
      </div>

      <canvas
        ref={canvasRef}
        id="Canvas"
        width={1200}
        height={1200}
        style={
          hoversNode != null
            ? {
                border: "1px solid #ccc",
                display: "block",
                margin: "0 auto",
                cursor: "pointer",
              }
            : {
                border: "1px solid #ccc",
                display: "block",
                margin: "0 auto",
                cursor: "grab",
              }
        }
        onClick={(e) => handleCanvasClick(e)} // クリックイベントを追加
        onMouseMove={(e) => handleMouseMove(e)} // マウスの移動を追跡
      ></canvas>
      {hoversNode && (
        <div
          id="hoverDiv"
          className="hover-div"
          style={{
            left: `${mouseXY.x}px`, // ノードのX位置に10pxオフセット
            top: `${mouseXY.y - 40}px`, // ノードのY位置に10pxオフセット
            position: "absolute", // 絶対位置で配置
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "5px",
            borderRadius: "5px",
          }}
        >
          {hoversNode.animename}
        </div>
      )}
      {updateNodeData.length == 0 && (
        <div className="Load">
          <Loading />
        </div>
      )}
    </div>
  );
};

export default Graph;
