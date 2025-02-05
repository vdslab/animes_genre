import { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import Graph from "./page/components/Graph";
import ClickAfter from "./page/components/ClickAfter";
import "./page/app.css";
import Select from "react-select";
import { Loading } from "./page/components/Loding";
function App() {
  const [pagestatus, setStatus] = useState(false);
  const [nodedata, setNodedata] = useState([]);
  const [mininodeData, setMininodeData] = useState([]);
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
  const canvasRef = useRef(null); // Canvas要素の参照
  const [yearsanime, setYearsanime] = useState(null);
  const [width, setWidth] = useState(null);
  const [height, setHeight] = useState(null);

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
          const Scale = d3.scaleLinear().domain([0, max]).range([3, 10]).nice();
          setNodeScale(() => Scale); // setNodeScaleを直接関数として渡す
          setScaleStatus(true);
        } else {
          const Scale = d3.scaleLinear().domain([0, max]).range([3, 3]).nice();
          setNodeScale(() => Scale); // setNodeScaleを直接関数として渡す
          setScaleStatus(true);
        }
      }
    };

    fetchData();
  }, [alldata, allview, select, yearsnext, monthsnext]);

  const scalemake = (data) => {
    console.log(1);
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

    scale["xScale"] = d3.scaleLinear().domain([xmin, xmax]).range([200, 1100]);
    scale["yScale"] = d3.scaleLinear().domain([ymin, ymax]).range([200, 1100]);

    data.map((node) => {
      node.x = scale["xScale"](node.x);
      node.y = scale["yScale"](node.y);
    });
    console.log("1");
    setNodedata(data);
    setMininodeData(data);
    return scale;
  };

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

  return (
    <div className="all_content">
      <header>
        <h2>アニメ探索マップ</h2>

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

        {/* <button
              onClick={() => {
                setScaleStatus(false);
                setAllview(!allview);
              }}>
            人気の推移を見る</button>
             {!allview && (
          <div style={{ textAlign: "center" }}>
            <h3>
              {yearsnext}年{monthsnext}月 時点の<br />
              人気度
            </h3>
            {!stop ? (
              <button onClick={() => setStop(true)}>STOP</button>
            ) : (
              <button onClick={() => setStop(false)}>START</button>
            )}
            <input
              type="range"
              min="0"
              max={(years.length - 1) * months.length}
              value={
                years.findIndex((item) => item === yearsnext) * 12 +
                months.findIndex((item) => item === monthsnext)
              }
              onChange={(e) => {
                setScaleStatus(false);
                setYearsnext(
                  years[(e.target.value - (e.target.value % 12)) / 12]
                );
                setMonthsnext(months[e.target.value % 12]);
              }}
              style={{
                width: "300px",
                display: "block",
                margin: "0 auto",
              }}
            />
          </div>
        )} */}

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
      </header>

      {pagestatus ? (
        <div className="container">
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
            canvasRef={canvasRef}
            yearsanime={yearsanime}
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
        <div className="Load">
          <Loading />
        </div>
      )}
    </div>
  );
}

export default App;
