// //<div className="Graph">を分けた
import React from "react";

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
