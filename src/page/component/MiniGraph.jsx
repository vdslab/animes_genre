//<div className="mini_graph">を分けた
import React from "react";

const MiniGraph = ({
  zoomscale,
  nodedata,
  scales,
  nodeScale,
  allview,
  alldata,
  select,
  yearsnext,
  monthsnext,
  scaleStatus,
  handleSvgClick,
}) => {
  return (
    <div className="mini_graph">
      <svg
        width="300"
        height="300"
        onClick={handleSvgClick}
        style={{ cursor: "pointer" }}
      >
        <g>
          <rect
            x={-zoomscale.x / 4 / zoomscale.k}
            y={-zoomscale.y / 4 / zoomscale.k}
            width={300 / zoomscale.k}
            height={300 / zoomscale.k}
            fill="grey"
            stroke="red"
            strokeWidth={5}
          ></rect>
          {/* ノードを描画 */}
          {scaleStatus ? (
            nodedata.map((node, index) => {
              if (!allview) {
                if (node[select][yearsnext][monthsnext] !== 0) {
                  return (
                    <ellipse
                      key={index}
                      cx={scales.xScale(node.x) / 4}
                      cy={scales.yScale(node.y) / 4}
                      rx={nodeScale(node[select][yearsnext][monthsnext]) / 4}
                      ry={nodeScale(node[select][yearsnext][monthsnext]) / 4}
                      fill={node.color}
                    ></ellipse>
                  );
                }
              } else {
                return (
                  <ellipse
                    key={index}
                    cx={scales.xScale(node.x) / 4}
                    cy={scales.yScale(node.y) / 4}
                    rx={
                      allview
                        ? nodeScale(alldata[index][select]) / 4
                        : nodeScale(node[select][yearsnext][monthsnext]) / 4
                    }
                    ry={
                      allview
                        ? nodeScale(alldata[index][select]) / 4
                        : nodeScale(node[select][yearsnext][monthsnext]) / 4
                    }
                    fill={node.color}
                  ></ellipse>
                );
              }
              return null;
            })
          ) : (
            <text x="50%" y="50%" textAnchor="middle">
              少々お待ちください
            </text>
          )}
        </g>
      </svg>
    </div>
  );
};

export default MiniGraph;
