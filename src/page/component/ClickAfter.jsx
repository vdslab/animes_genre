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
  const [translatedTags, setTranslatedTags] = useState([]); // 翻訳されたタグを保持

  // 非同期処理を行う関数
  async function trans(node) {
    if (clickNode != null) {
      node = node.replace(/<[^>]*>/g, "");  // HTMLタグを削除
      console.log(node)
      try {
        const response = await fetch(
          `https://script.google.com/macros/s/AKfycbxwZewBANl5EuM-pnpbTgMwGryNhDapa3aTYCtBSFf5XIOVzgPmSTTxkiw8bj2fChl-AA/exec?text=${node}&source=en&target=ja`
        );
        const feachData = await response.json();
        return feachData.text; // 翻訳されたテキストを返す
      } catch (error) {
        console.error("Error fetching data:", error);
        return "";  // エラーが発生した場合は空文字を返す
      }
    }
    return "";  // clickNode が null の場合は空文字を返す
  }

  useEffect(() => {
    // clickNode が存在する場合にタグを翻訳
    if (clickNode != null && clickNode.tag.length > 0) {
      const translateTags = async () => {
        const translated = await Promise.all(
          clickNode.tag.map((node) => trans(node.name))
        );
        setTranslatedTags(translated); // 翻訳されたタグを状態に保存
      };
      translateTags();
    }
  }, [clickNode]); // clickNode が変更されるたびに実行される

  return (
    <div className="click_After">
      <div className="Box">
        <div style={{ textAlign: "center" }}>
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

      {clickNode == null ? (
        <div>
          <div style={{ marginTop: "20px" }}>
            <h3>操作説明</h3>
            <p>このサイトでは、アニメのジャンルと人気度を可視化しました。</p>
            {/* ここに操作説明 */}
          </div>
        </div>
      ) : (
        <div>
          <h2>{clickNode.animename}</h2>
          <img src={clickNode.coverImage} alt={clickNode.animename} />
          <h3>あらすじ</h3>
          <h4>{clickNode.description != null && clickNode.description.text}</h4>
          <h3>ジャンル</h3>
          <h4>{translatedTags.join(", ")}</h4> {/* 翻訳されたタグを表示 */}
          <h3>放送期間：</h3>
          <h3>
            {clickNode.startDate.year}年 {clickNode.startDate.month}月{" "}
            {clickNode.startDate.day}日から{clickNode.endDate.year}年{" "}
            {clickNode.endDate.month}月 {clickNode.endDate.day}日
          </h3>
          {clickNode.studio.length !== 0 && <h3>スタジオ</h3>}
          <h4>{clickNode.studio.map((node) => node.name).join(", ")}</h4>
          {clickNode.link.length !== 0 && <h3>公式ページ</h3>}
          {clickNode.link.map((node, index) => (
            <div key={index}>
              <h4>{node["site"]} URL:</h4>
              <a href={node["url"]} target="_blank" rel="noopener noreferrer">
                {node["url"]}
              </a>
            </div>
          ))}
          <button
            onClick={() => {
              setClickNode(null);
            }}
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
};

export default ClickAfter;
