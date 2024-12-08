import { useState, useEffect } from "react";
import * as d3 from "d3";

function App() {
  const [pagestatus, setStatus] = useState(false);
  const [nodedata, setNodedata] = useState([]);
  const [scales,setScales]=useState({})

  useEffect(() => {
    // データの読み込み
    fetch("../data/node.json")
      .then((response) => response.json()) 
      .then((res) => {
        setNodedata(res);
        setScales(scalemake(res));
        setStatus(true);
      })
      
  }, []);

  const scalemake=(data)=>{
    let scale={}
    //座標のスケール
    let xmax=data[0].x
    let xmin=data[0].x
    let ymax=data[0].y
    let ymin=data[0].y

    data.map((d,i)=>{
        if(xmax<d.x){
            xmax=d.x
        }
        if(xmin>d.x){
            xmin=d.x
        }
        if(ymax<d.y){
            ymax=d.y
        }
        if(ymin>d.y){
            ymin=d.y
        }
    })
    scale["xScale"]=d3.scaleLinear()
    .domain([xmin,xmax])
    .range([10,1000+5])

    scale["yScale"]=d3.scaleLinear()
    .domain([ymin,ymax])
    .range([10,1000+5])

    return scale

  }

  return (
    pagestatus ? (
      <svg width="1000" height="1000">
        {nodedata.map((node, index) => (
          <ellipse
            key={index}  
            cx={scales.xScale(node.x)}  
            cy={scales.yScale(node.y)}  
            rx="5"  
            ry="5"  
            fill={node.color}
            onClick={()=>{
                console.log(node.animename)
            }}
            style={{cursor: "pointer"}}
          >
          </ellipse>
        ))}
      </svg>
    ) : (
      <div>読み込み中...</div>
    )
  );
}

export default App;
