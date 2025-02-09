import { useEffect, useRef } from "react";
import * as d3 from "d3";

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
  startXY,
  setStartXY,
  zoomLevel,
  clickNode,
  zoomRef,
  status,
  yearsanime,
  canvasmain,
}) => {
  const nodes = nodedata;

  // canvasへの参照を作成
  const canvasRef = useRef(null);

  // クリックイベントの処理
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    console.log(x, y);

    const newStartXY = {
      k: startXY.k,
      x: -(x - 300 / zoomLevel / 2) * zoomLevel * 4,
      y: -(y - 300 / zoomLevel / 2) * zoomLevel * 4,
    };
    const newTransform = d3.zoomIdentity
      .translate(newStartXY.x, newStartXY.y)
      .scale(zoomLevel);
    d3.select(canvasmain).call(zoomRef.current.transform, newTransform);

    setStartXY(newStartXY);
  };
  useEffect(() => {
    if (status) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        nodes.forEach((node, index) => {
          if (yearsanime == null || node.startDate.year == yearsanime) {
            ctx.beginPath();

            if (!allview) {
              if (node[select][yearsnext][monthsnext] !== 0) {
                ctx.arc(
                  node.x / 4,
                  node.y / 4,
                  nodeScale(node[select][yearsnext][monthsnext]) / 4,
                  0,
                  Math.PI * 2
                );
              }
            } else {
              ctx.arc(
                node.x / 4,
                node.y / 4,
                nodeScale(alldata[index][select]) / 4,
                0,
                Math.PI * 2
              );
            }

            ctx.fillStyle = clickNode === node ? "orange" : "blue";
            ctx.fill();
            ctx.closePath();
          }
        });

        ctx.beginPath();
        ctx.rect(
          -startXY.x / zoomLevel / 4,
          -startXY.y / zoomLevel / 4,
          300 / zoomLevel,
          300 / zoomLevel
        );
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.closePath();
      }
    }
  }, [
    status,
    nodedata,
    zoomscale,
    scales,
    nodeScale,
    allview,
    select,
    yearsnext,
    monthsnext,
    startXY,
    zoomLevel,
    scaleStatus,
    yearsanime,
  ]);

  return (
    <div className="mini_graph">
      {scaleStatus ? (
        <canvas
          ref={canvasRef} // refを設定
          width="300"
          height="300"
          onClick={handleCanvasClick}
        ></canvas>
      ) : (
        <div>少々お待ちください</div>
      )}
    </div>
  );
};

export default MiniGraph;
