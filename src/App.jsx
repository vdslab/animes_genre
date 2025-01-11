import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import "./app.css";

function App() {
  const [pagestatus, setStatus] = useState(false);
  const [nodedata, setNodedata] = useState([]);
  const [scales, setScales] = useState({});
  const svgRef = useRef(null); // SVG を参照するための useRef
  const zoomRef = useRef(null);
  const [select,setSelect]=useState("viewCount")
  const [yearsnext,setYearsnext]=useState(2006)
  const [monthsnext,setMonthsnext]=useState("01")
  const [zoomscale, setZoomscale] = useState({ k: 1, x: 0, y: 0 });
  const [clickNode,setClickNode]=useState(null)
  const [nodeScale,setNodeScale]=useState(null)
  const [scaleStatus,setScaleStatus]=useState(false)
  const years=[2006,2007,2008,2009,2010,2011,2012,2013,2014,2015,2016,2017,2018,2019,2020,2021,2022,2023,2024,2025]
  const months=["01","02","03","04","05","06","07","08","09","10","11","12"]

  useEffect(() => {
    // データの読み込み
    fetch("../data/node.json")
      .then((response) => response.json())
      .then((res) => {
        setNodedata(res);
        console.log(res)
        setScales(scalemake(res));
        setStatus(true);
      });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      let max = 0;
      nodedata.forEach((item) => {
        if (max < item[select][yearsnext][monthsnext]) {
          max = item[select][yearsnext][monthsnext];
        }
      });
      const Scale = d3
        .scaleLinear()
        .domain([0, max])
        .range([1, 10])
        .nice();
      setNodeScale(() => Scale); // setNodeScaleを直接関数として渡す
      setScaleStatus(true);
    };
  
    fetchData();
  }, [select, yearsnext, monthsnext]);
  

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
      {clickNode==null&&(
      <div className="graph">
        <div className="Box">
        <p>2006年1月</p>
        <div style={{ textAlign: "center" }}>
          {/* {stop ? (
            <img
              src="start.png"
              onClick={(e) => {
                setStop(false);
              }}
              style={{ cursor: "pointer" }}
            />
          ) : (
            <img
              src="stop.png"
              onClick={(e) => {
                setStop(true);
              }}
              style={{ cursor: "pointer" }}
            />
          )} */}
          <input
            type="range"
            min="0"
            max={(years.length-1)*months.length}
            value={years.findIndex((item) => item === yearsnext)*12+months.findIndex((item) => item === monthsnext)}
            onChange={(e)=>{
              setScaleStatus(false)
              setYearsnext(years[((e.target.value-e.target.value%12)/12)])
              setMonthsnext(months[e.target.value%12])
              
            }}
            style={{
              width: "300px",
              display: "block",
              margin: "0 auto",
            }}
          />
          <p>{yearsnext}年{monthsnext}月</p>
        </div>
        <p>2025年1月</p>
      </div>

      <div>
        <h3>{yearsnext}年{monthsnext}月</h3>

        <select
          style={{
            display: "block",
            margin: "10px auto",
            padding: "10px 15px",
          }}
          onChange={(e) => setSelect(e.target.value)}
        >
          <option value="viewCount">総視聴回数</option>
          <option value="likeCount">総いいね数</option>
          <option value="commentCount">総コメント数</option>
          <option value="videoCount">総動画数</option>
        </select>
      </div>
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
              {scaleStatus?nodedata.map((node, index) => {
                return (
                  <ellipse
                    key={index}
                    cx={scales.xScale(node.x) / 2}
                    cy={scales.yScale(node.y) / 2}
                    rx={nodeScale(node[select][yearsnext][monthsnext])/2}
                    ry={nodeScale(node[select][yearsnext][monthsnext])/2}
                    fill={node.color}
                  ></ellipse>
                );
              }):(<div>少々お待ちください</div>)}
            </g>
          </svg>
        </div>)}
      <div className="graph">
        <svg
          ref={svgRef}
          width="1000"
          height="1000"
          style={{ top: 20, right: 30, bottom: 30, left: 40 }}
        >
          <g>
            {/* ノードを描画 */}
            {scaleStatus?nodedata.map((node, index) => {
              if (zoomscale.k < 3) {
                return (
                  <ellipse
                    key={index}
                    cx={scales.xScale(node.x)}
                    cy={scales.yScale(node.y)}
                    rx={nodeScale(node[select][yearsnext][monthsnext])}
                    ry={nodeScale(node[select][yearsnext][monthsnext])}
                    fill={node.color}
                    onClick={() =>{
                      const sca = 5; // 新しいズーム倍率
                      const newScale = {
                        k: sca,
                        x: -scales.xScale(node.x) * sca + 500 , // 中心に持ってくる計算
                        y: -scales.yScale(node.y) * sca + 500 ,
                      };
                    
                      // D3 ズームの状態を更新
                      const transform = d3.zoomIdentity
                        .translate(newScale.x, newScale.y)
                        .scale(newScale.k);
                    
                      d3.select(svgRef.current)
                        .transition()
                        .duration(750)
                        .call(zoomRef.current.transform, transform);
                    
                      setClickNode(node);
                                        
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
                      const sca = 5; // 新しいズーム倍率
                      const newScale = {
                        k: sca,
                        x: -scales.xScale(node.x) * sca + 500, // 中心に持ってくる計算
                        y: -scales.yScale(node.y) * sca + 500 ,
                      };
                    
                      // D3 ズームの状態を更新
                      const transform = d3.zoomIdentity
                        .translate(newScale.x, newScale.y)
                        .scale(newScale.k);
                    
                      d3.select(svgRef.current)
                        .transition()
                        .duration(750)
                        .call(zoomRef.current.transform, transform);
                    
                      setClickNode(node);
                    }}
                    
                    style={{ cursor: "pointer" }}
                  />
                );
              }
            }):(<div>少々お待ちください</div>)}
          </g>
        </svg>
      </div>
      {clickNode!=null&&(
        <div>
          <h2>{clickNode.animename}</h2>
          <img src={clickNode.coverImage} alt={clickNode.animename} />
          <h3>あらすじ</h3>
          <h4>{clickNode.description}</h4>
          <h3>放送期間：</h3>
          <h3>{clickNode.startDate.year}年 {clickNode.startDate.month}月 {clickNode.startDate.day}日から{clickNode.endDate.year}年 {clickNode.endDate.month}月 {clickNode.endDate.day}日</h3>
          <h3>公式ページ</h3>
          {clickNode.link.map((node)=>(
            <div>
            <h4>{node["site"]} URL:</h4>
            <a href={node["url"]}>{node["url"]}</a>
            </div>
          ))}

          <button onClick={()=>{setClickNode(null)}}>閉じる</button>

          
        </div>)}
      <div>
        
      </div>
    </div>
  ) : (
    <div>読み込み中...</div>
  );
}

export default App;
