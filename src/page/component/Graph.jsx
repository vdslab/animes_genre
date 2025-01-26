// //<div className="Graph">を分けた
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

  useEffect(() => {
      if(scaleStatus){
      const canvas = document.getElementById("myCanvas");
      const ctx = canvas.getContext("2d"); // 2D描画コンテキスト
  
      // キャンバスをクリア
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  
      // ノードデータの描画
      nodedata.map((node,index) => {
        console.log(scales.xScale(node.x),
        scales.yScale(node.y) ,
        nodeScale(node[select][yearsnext][monthsnext]) / 4,)
        ctx.beginPath(); // 新しいパスを開始
  
        if (!allview) {
          // allviewがfalseの場合、データが0でない場合のみ描画
          if (node[select][yearsnext][monthsnext] !== 0) {
            
            ctx.arc(
              scales.xScale(node.x) / 4,
              scales.yScale(node.y) / 4,
              nodeScale(node[select][yearsnext][monthsnext]) / 4,
              0,
              Math.PI * 2
            );
          }
        } else {
          // allviewがtrueの場合、すべて描画
          ctx.arc(
            scales.xScale(node.x) / 4,
            scales.yScale(node.y) / 4,
            nodeScale(alldata[index][select]) / 4,
            0,
            Math.PI * 2
          );
        }
  
        ctx.fillStyle = "blue"; // 塗りつぶしの色
        ctx.fill(); // 塗りつぶし
        ctx.closePath(); // パスを閉じる
      });
    }
    }, [
      nodedata,
      zoomscale,
      scales,
      nodeScale,
      allview,
      select,
      yearsnext,
      monthsnext,
    ]); // 依存関係を追加して再描画を行う
  return (
    <div className="graph">
      <svg
        ref={svgRef}
        width="1200"
        height="1200"
        style={{ top: 20, right: 30, bottom: 30, left: 40 }}
      >
        <g>
          {/* ノードを描画 */}
          {scaleStatus ? (
            nodedata.map((node, index) => {
              if (zoomscale.k < 3) {
                if (!allview && node[select][yearsnext][monthsnext] !== 0) {
                  return (
                    <ellipse
                      key={index}
                      cx={scales.xScale(node.x)}
                      cy={scales.yScale(node.y)}
                      rx={
                        allview
                          ? nodeScale(alldata[index][select])
                          : nodeScale(node[select][yearsnext][monthsnext])
                      }
                      ry={
                        allview
                          ? nodeScale(alldata[index][select])
                          : nodeScale(node[select][yearsnext][monthsnext])
                      }
                      fill={node.color}
                      onClick={() => setClickNode(node)}
                      style={{ cursor: "pointer" }}
                    ></ellipse>
                  );
                } else if (allview) {
                  return (
                    <ellipse
                      key={index}
                      cx={scales.xScale(node.x)}
                      cy={scales.yScale(node.y)}
                      rx={nodeScale(alldata[index][select])}
                      ry={nodeScale(alldata[index][select])}
                      fill={node.color}
                      onClick={() => setClickNode(node)}
                      style={{ cursor: "pointer" }}
                    ></ellipse>
                  );
                }
              } else {
                const size = allview
                  ? nodeScale(alldata[index][select]) * 5
                  : nodeScale(node[select][yearsnext][monthsnext]) * 5;
                const isNodeSelected = clickNode === node;
                const opacity =
                  isNodeSelected ||
                  (!allview && node[select][yearsnext][monthsnext] === 0)
                    ? 0.35
                    : 1;

                return (
                  <image
                    key={index}
                    x={scales.xScale(node.x) - size / 2} // イメージを中央に配置
                    y={scales.yScale(node.y) - size / 2} // イメージを中央に配置
                    width={size} // サイズ調整
                    height={size} // サイズ調整
                    href={node.coverImage}
                    onClick={() => setClickNode(node)}
                    opacity={opacity}
                    style={{ cursor: "pointer", clipPath: "circle(35%)" }}
                  />
                );
              }
            })
          ) : (
            <div>少々お待ちください</div>
          )}
        </g>
      </svg>
    </div>
  );
};

export default Graph;
