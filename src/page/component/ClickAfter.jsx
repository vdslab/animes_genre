//<div className="click_After">を分けた
import { useState, useEffect } from "react";


const ClickAfter = ({
  allview,
  setAllview,
  setScaleStatus,
  nodedata,
  clickNode,
  setClickNode,
  yearsnext,
  monthsnext,
  stop,
  setStop,
  years,
  months,
  setYearsnext,
  setMonthsnext,
  setSelect,
}) => {
  console.log(clickNode)
  return (
    <div className="click_After">
      <div className="Box">
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
          <div>
            <input
              type="checkbox"
              checked={allview}
              onChange={() => {
                setScaleStatus(false);
                setAllview(!allview);
              }}
            />
            <label>総合を見る</label>
          </div>
         
        </div>

        {!allview && (
          <div>
            <h3>
              {yearsnext}年{monthsnext}月
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
        )}
      </div>

      {/* <div>
        <select
          style={{
            display: "block",
            margin: "10px auto",
            padding: "10px 15px",
          }}
          onChange={(e) => setSelect(e.target.value)}
        >
          <option value="videoCount">総動画数</option>
          <option value="viewCount">総視聴回数</option>
          <option value="likeCount">総いいね数</option>
          <option value="commentCount">総コメント数</option>
        </select>
      </div> */}
      {clickNode != null && (
        <div>
          <h2>{clickNode.animename}</h2>
          <img src={clickNode.coverImage} alt={clickNode.animename} />
          <h3>あらすじ</h3>
          <h4>{clickNode.description!=null&&clickNode.description.text}</h4>
          <h3>放送期間：</h3>
          <h3>
            {clickNode.startDate.year}年 {clickNode.startDate.month}月{" "}
            {clickNode.startDate.day}日から{clickNode.endDate.year}年{" "}
            {clickNode.endDate.month}月 {clickNode.endDate.day}日
          </h3>
          {clickNode.studio.length != 0 && <h3>スタジオ</h3>}
          <h4>{clickNode.studio.map((node) => node.name).join(", ")}</h4>
          {clickNode.link.length != 0 && <h3>公式ページ</h3>}
          {clickNode.link.map((node, index) => (
            <div key={index}>
              <h4>{node["site"]} URL:</h4>
              <a href={node["url"]}>{node["url"]}</a>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default ClickAfter;
