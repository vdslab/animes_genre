import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import "./app.css";

function App() {
  const [pagestatus, setStatus] = useState(false);
  const [nodedata, setNodedata] = useState([]);
  const [scales, setScales] = useState({});
  const svgRef = useRef(null); // SVG を参照するための useRef
  const zoomRef = useRef(null);
  const [zoomscale, setZoomscale] = useState({ k: 1, x: 0, y: 0 });

  useEffect(() => {
    // データの読み込み
    fetch("../data/node.json")
      .then((response) => response.json())
      .then((res) => {
        setNodedata(res);
        setScales(scalemake(res));
        setStatus(true);
      });
  }, []);

  const scalemake = (data) => {
    let scale = {};
    // 座標のスケール
    let xmax = data[0].x;
    let xmin = data[0].x;
    let ymax = data[0].y;
    let ymin = data[0].y;

    data.forEach((d) => {
      if (xmax < d.x) {
        xmax = d.x;
      }
      if (xmin > d.x) {
        xmin = d.x;
      }
      if (ymax < d.y) {
        ymax = d.y;
      }
      if (ymin > d.y) {
        ymin = d.y;
      }
    });

    scale["xScale"] = d3.scaleLinear().domain([xmin, xmax]).range([0, 1000]);
    scale["yScale"] = d3.scaleLinear().domain([ymin, ymax]).range([0, 1000]);

    return scale;
  };
  const handleSvgClick = (event) => {
    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;

    // クリック位置を SVG 座標系に変換
    const transformPoint = point.matrixTransform(svg.getScreenCTM().inverse());

    let newScale = {
      k: zoomscale.k,
      x: (-transformPoint.x + 500 / zoomscale.k / 2) * zoomscale.k * 2,
      y: (-transformPoint.y + 500 / zoomscale.k / 2) * zoomscale.k * 2,
    };

    // パンの範囲を制限（画面外に行かないようにする）
    newScale.x = Math.min(0, Math.max(newScale.x, -1000 * newScale.k + 1000));
    newScale.y = Math.min(0, Math.max(newScale.y, -1000 * newScale.k + 1000));

    // D3 ズームの状態を更新
    const transform = d3.zoomIdentity
      .translate(newScale.x, newScale.y)
      .scale(newScale.k);

    d3.select(svgRef.current)
      .transition()
      .duration(750)
      .call(zoomRef.current.transform, transform);
  };

  useEffect(() => {
    if (pagestatus) {
      const svg = d3.select(svgRef.current);

      // D3のズームインスタンスを作成してzoomRefに保存
      const zoom = d3
        .zoom()
        .scaleExtent([1, 10]) // ズーム倍率の範囲
        .translateExtent([
          [0, 0],
          [1000, 1000],
        ]) // パン可能な範囲
        .on("zoom", (event) => {
          setZoomscale(event.transform);
          svg.select("g").attr("transform", event.transform); // ズームとパンの変換を適用
        });

      svg.call(zoom); // SVG にズーム機能を適用
      zoomRef.current = zoom; // zoom インスタンスを ref に保存
    }
  }, [pagestatus]);

  return pagestatus ? (
    <div className="container">
      <div className="graph">
        <svg
          ref={svgRef}
          width="1000"
          height="1000"
          style={{ top: 20, right: 30, bottom: 30, left: 40 }}
        >
          <g>
            {/* ノードを描画 */}
            {nodedata.map((node, index) => {
              if (zoomscale.k < 3) {
                return (
                  <ellipse
                    key={index}
                    cx={scales.xScale(node.x)}
                    cy={scales.yScale(node.y)}
                    rx="10"
                    ry="10"
                    fill={node.color}
                    onClick={() => {
                      console.log(node.animename);
                    }}
                    style={{ cursor: "pointer" }}
                  ></ellipse>
                );
              } else {
                return (
                  <image
                    key={index}
                    x={scales.xScale(node.x) - 10} // イメージを中央に配置
                    y={scales.yScale(node.y) - 10} // イメージを中央に配置
                    width="10" // サイズ調整
                    height="10" // サイズ調整
                    href={node.coverImage}
                    onClick={() => {
                      console.log(node.animename);
                    }}
                    style={{ cursor: "pointer" }}
                  />
                );
              }
            })}
          </g>
        </svg>
      </div>
      <div>
        <div className="graph">
          <svg
            width="500"
            height="500"
            onClick={handleSvgClick}
            style={{ cursor: "pointer" }}
          >
            <g>
              <rect
                x={-zoomscale.x / 2 / zoomscale.k}
                y={-zoomscale.y / 2 / zoomscale.k}
                width={500 / zoomscale.k}
                height={500 / zoomscale.k}
                fill="grey"
                stroke="red"
                strokeWidth={5}
              ></rect>
              {/* ノードを描画 */}
              {nodedata.map((node, index) => {
                return (
                  <ellipse
                    key={index}
                    cx={scales.xScale(node.x) / 2}
                    cy={scales.yScale(node.y) / 2}
                    rx="5"
                    ry="5"
                    fill={node.color}
                  ></ellipse>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  ) : (
    <div>読み込み中...</div>
  );
}

export default App;
