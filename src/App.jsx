import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import MiniGraph from "./page/component/MiniGraph";
import Graph from "./page/component/Graph";
import ClickAfter from "./page/component/ClickAfter";
import "./page/app.css";

function App() {
  const [pagestatus, setStatus] = useState(false);
  const [nodedata, setNodedata] = useState([]);
  const [scales, setScales] = useState({});
  const svgRef = useRef(null); // SVG を参照するための useRef
  const zoomRef = useRef(null);
  const [select, setSelect] = useState("videoCount");
  const [allview, setAllview] = useState(true);
  const [alldata, setAlldata] = useState(null);
  const [yearsnext, setYearsnext] = useState(2006);
  const [monthsnext, setMonthsnext] = useState("01");
  const [zoomscale, setZoomscale] = useState({ k: 1, x: 0, y: 0 });
  const [clickNode, setClickNode] = useState(null);
  const [nodeScale, setNodeScale] = useState(null);
  const [stop, setStop] = useState(false);
  const intervalIdRef = useRef(null);
  const [scaleStatus, setScaleStatus] = useState(false);
  const years = [
    2006, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017,
    2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025,
  ];
  const months = [
    "01",
    "02",
    "03",
    "04",
    "05",
    "06",
    "07",
    "08",
    "09",
    "10",
    "11",
    "12",
  ];

  useEffect(() => {
    // データの読み込み
    fetch("../data/node.json")
      .then((response) => response.json())
      .then((res) => {
        setNodedata(res);
        setScales(scalemake(res));
        setStatus(true);
      });
    fetch("../data/data_All.json")
      .then((response) => response.json())
      .then((res) => {
        setAlldata(res);
      });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (alldata) {
        // alldataが存在する場合に処理を実行
        let max = 0;
        if (allview) {
          alldata.forEach((item) => {
            if (max < item[select]) {
              max = item[select];
            }
          });
        } else {
          nodedata.forEach((item) => {
            if (max < item[select][yearsnext][monthsnext]) {
              max = item[select][yearsnext][monthsnext];
            }
          });
        }
        if (max != 0) {
          const Scale = d3.scaleLinear().domain([0, max]).range([1, 10]).nice();
          setNodeScale(() => Scale); // setNodeScaleを直接関数として渡す
          setScaleStatus(true);
        } else {
          const Scale = d3.scaleLinear().domain([0, max]).range([1, 1]).nice();
          setNodeScale(() => Scale); // setNodeScaleを直接関数として渡す
          setScaleStatus(true);
        }
      }
    };

    fetchData();
  }, [alldata, allview, select, yearsnext, monthsnext]);

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

    scale["xScale"] = d3.scaleLinear().domain([xmin, xmax]).range([-50, 1250]);
    scale["yScale"] = d3.scaleLinear().domain([ymin, ymax]).range([-50, 1250]);

    return scale;
  };
  const handleSvgClick = (event) => {
    const canvas = event.currentTarget;
    const rect = canvas.getBoundingClientRect(); // Canvasの位置とサイズを取得
    const x = event.clientX - rect.left; // Canvas内のクリック位置のx座標
    const y = event.clientY - rect.top; // Canvas内のクリック位置のy座標

    // ズームとパンの新しいスケールを計算
    const newScale = {
      k: zoomscale.k,
      x: (-x + 300 / zoomscale.k / 4) * zoomscale.k * 4, // パンの計算
      y: (-y + 300 / zoomscale.k / 4) * zoomscale.k * 4, // パンの計算
    };

    // パンの範囲を制限（画面外に行かないようにする）
    newScale.x = Math.min(0, Math.max(newScale.x, -1250 * newScale.k + 1250));
    newScale.y = Math.min(0, Math.max(newScale.y, -1250 * newScale.k + 1250));

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
    if (clickNode != null) {
      const sca = 10; // 新しいズーム倍率
      const newScale = {
        k: sca,
        x: -scales.xScale(clickNode.x) * sca + 600, // 中心に持ってくる計算
        y: -scales.yScale(clickNode.y) * sca + 600,
      };

      // D3 ズームの状態を更新
      const transform = d3.zoomIdentity
        .translate(newScale.x, newScale.y)
        .scale(newScale.k);

      d3.select(svgRef.current)
        .transition()
        .duration(750)
        .call(zoomRef.current.transform, transform);
    }
    console.log(clickNode)
  }, [clickNode]);

  useEffect(() => {
    if (pagestatus) {
      const svg = d3.select(svgRef.current);

      // D3のズームインスタンスを作成してzoomRefに保存
      const zoom = d3
        .zoom()
        .scaleExtent([1, 10]) // ズーム倍率の範囲
        .translateExtent([
          [-50, -50],
          [1250, 1250],
        ]) // パン可能な範囲
        .on("zoom", (event) => {
          setZoomscale(event.transform);
          svg.select("g").attr("transform", event.transform); // ズームとパンの変換を適用
        });

      svg.call(zoom); // SVG にズーム機能を適用
      zoomRef.current = zoom; // zoom インスタンスを ref に保存
    }
  }, [pagestatus]);

  useEffect(() => {
    const timerId = (g) => {
      if (!stop && !allview) {
        let month = months.findIndex((element) => element == monthsnext) + 1;
        console.log(Number(yearsnext), month);
        if (Number(yearsnext) == 2025 && month == 1) {
          setYearsnext("2005");
          month = 0;
        }
        if (month > 11) {
          month = 0;
          setYearsnext(String(Number(yearsnext) + 1));
          setMonthsnext(months[month]);
        } else {
          setMonthsnext(months[month]);
        }
      }
    };

    const intervalId = setInterval(() => {
      timerId(null);
    }, 2000);
    return () => clearInterval(intervalId);
  }, [stop, allview, yearsnext, monthsnext]); // sortDataとyearsnextが変更されるたびに最新の値を使う

  return pagestatus ? (
    <div className="container">
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

      <Graph
        svgRef={svgRef}
        scaleStatus={scaleStatus}
        nodedata={nodedata}
        zoomscale={zoomscale}
        allview={allview}
        select={select}
        yearsnext={yearsnext}
        monthsnext={monthsnext}
        scales={scales}
        nodeScale={nodeScale}
        alldata={alldata}
        setClickNode={setClickNode}
        clickNode={clickNode}
      />
      <ClickAfter
        allview={allview}
        setAllview={setAllview}
        setScaleStatus={setScaleStatus}
        nodedata={nodedata}
        clickNode={clickNode}
        setClickNode={setClickNode}
        yearsnext={yearsnext}
        monthsnext={monthsnext}
        stop={stop}
        setStop={setStop}
        years={years}
        months={months}
        setYearsnext={setYearsnext}
        setMonthsnext={setMonthsnext}
        setSelect={setSelect}
      />

      <div></div>
    </div>
  ) : (
    <div>読み込み中...</div>
  );
}

export default App;
