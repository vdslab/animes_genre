import { useState, useEffect } from "react";

const ClickAfter = ({ clickNode, setClickNode }) => {
  const [translatedTags, setTranslatedTags] = useState([]); // 翻訳されたタグを保持
  return (
    <div className="click_After">
      {clickNode == null ? (
        <div>
          <h3>操作説明</h3>
          <p>このサイトでは、アニメのジャンルと人気度を可視化しました。</p>
          <p>
            ノードが近いとジャンルが類似していて、遠いとジャンルは類似してません。
          </p>
          <p>
            人気度が高いとノードが大きく、人気度が少ないとノードが小さくなっています。
          </p>
          <p>
            上記の「総合を見る」をチェックすると、全体のデータの表示に、チェックを外すと年月別での表示になります。
          </p>
          <p>
            「STOP」ボタンをクリックするとデータの更新が止まり、「START」で再開できます。また、スライダーで年月を変更できます。
          </p>
          <p>「アニメを検索」バーで好きなアニメを検索できます。</p>
          <p>
            マップ上のノードをクリックすると、そのアニメの詳細情報が右に表示されます。
          </p>
        </div>
      ) : (
        <div>
          <h2>{clickNode.animename}</h2>
          <img src={clickNode.coverImage} alt={clickNode.animename} />
          <h3>あらすじ</h3>
          <h4>{clickNode.description != null && clickNode.description.text}</h4>
          <h3>ジャンル</h3>
          <h4>{clickNode.tag.map((tag) => tag.name + ",")}</h4>{" "}
          {/* 翻訳されたタグを表示 */}
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
