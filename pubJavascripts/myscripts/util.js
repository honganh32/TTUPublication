var diameter = 1000,
    radius = diameter / 2,
    innerRadius = radius - 120;

var themeList = ["Foundations", "Systems", "Data", "Applications"];

function drawColorLegend() {
  var xx = 10;
  var y1 = [20, 38, 56, 74];
  var rr = 6;
  
  // Draw colored circles and labels for each theme
  themeList.forEach(function(theme, i) {
    // Draw circle
    svg.append("circle")
      .attr("class", "themeLegend")
      .attr("cx", xx)
      .attr("cy", y1[i])
      .attr("r", rr)
      .style("fill", getColor(theme));
    
    // Draw label
    svg.append("text")
      .attr("class", "themeLegend")
      .attr("x", xx + 15)
      .attr("y", y1[i] + 2)
      .text(theme)
      .attr("dy", ".21em")
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .style("text-anchor", "left")
      .style("fill", getColor(theme));
  });
}


function removeColorLegend() {
 svg.selectAll(".nodeLegend").remove();
}
function drawTimeLegend() {
  for (var i=minYear; i<maxYear;i++){
    var xx = xStep+xScale((i-minYear));
    svg.append("line")
      .style("stroke", "#00a")
      .style("stroke-dasharray", ("1, 2"))
      .style("stroke-opacity", 1)
      .style("stroke-width", 0.2)
      .attr("x1", function(d){ return xx; })
      .attr("x2", function(d){ return xx; })
      .attr("y1", function(d){ return 0; })
      .attr("y2", function(d){ return height; });
     svg.append("text")
      .attr("class", "timeLegend")
      .style("fill", "#000")   
      .style("text-anchor","start")
      .style("text-shadow", "1px 1px 0 rgba(255, 255, 255, 0.6")
      .attr("x", xx)
      .attr("y", height-5)
      .attr("dy", ".21em")
      .attr("font-family", "sans-serif")
      .attr("font-size", "12px")
      .style("font-weight", "bold")  
      .text(i);  
  }
}  

function themeToCategory(theme) {
  if (!theme) return "Other";
  
  var t = theme.toLowerCase();
  
  // Red: Foundations of Computing & Intelligence
  if (t.includes("algorithm") || t.includes("theory") || t.includes("optimization") ||
      t.includes("ai") || t.includes("machine learning") || t.includes("quantum") ||
      t.includes("artificial intelligence")) {
    return "Foundations";
  }
  
  // Blue: Systems, Infrastructure & Security
  if (t.includes("software") || t.includes("systems") ||
      t.includes("networking") || t.includes("communications") ||
      t.includes("cybersecurity") || t.includes("blockchain") || t.includes("privacy")) {
    return "Systems";
  }
  
  // Green: Data, Analytics & Intelligent Platforms
  if (t.includes("data") || t.includes("metadata") || t.includes("visualization") ||
      t.includes("analytics") || t.includes("sensor") || t.includes("iot") || t.includes("edge")) {
    return "Data";
  }
  
  // Orange: Cyber-Physical, Human & Societal Applications
  if (t.includes("robotics") || t.includes("cps") || t.includes("manufacturing") ||
      t.includes("healthcare") || t.includes("biomedical") || t.includes("education") ||
      t.includes("workforce") || t.includes("energy") || t.includes("environment") ||
      t.includes("agriculture") || t.includes("disaster") || t.includes("resilience") ||
      t.includes("evacuation")) {
    return "Applications";
  }
  
  return "Other";
}

function getColor(category) {
  var sat = 200;
  if (category=="Foundations")
    return "#e5ff00ff";
  else if (category=="Systems")
    return "#003cffff";
  else if (category=="Data")
    return "#2fff00ff";
  else if (category=="Applications")
    return "#ff65a5ff";
  else{
    return "#000000";    
  }
}

function colorFaded(d) {
  var minSat = 80;
  var maxSat = 200;
  var step = (maxSat-minSat)/maxDepth;
  var sat = Math.round(maxSat-d.depth*step);
 
  //console.log("maxDepth = "+maxDepth+"  sat="+sat+" d.depth = "+d.depth+" step="+step);
  return d._children ? "rgb("+sat+", "+sat+", "+sat+")"  // collapsed package
    : d.children ? "rgb("+sat+", "+sat+", "+sat+")" // expanded package
    : "#aaaacc"; // leaf node
}


function getBranchingAngle1(radius3, numChild) {
  if (numChild<=2){
    return Math.pow(radius3,2);
  }  
  else
    return Math.pow(radius3,1);
 } 

function getRadius(d) {
 // console.log("scaleCircle = "+scaleCircle +" scaleRadius="+scaleRadius);
return d._children ? scaleCircle*Math.pow(d.childCount1, scaleRadius)// collapsed package
      : d.children ? scaleCircle*Math.pow(d.childCount1, scaleRadius) // expanded package
      : scaleCircle;
     // : 1; // leaf node
}


function childCount1(level, n) {
    count = 0;
    if(n.children && n.children.length > 0) {
      count += n.children.length;
      n.children.forEach(function(d) {
        count += childCount1(level + 1, d);
      });
      n.childCount1 = count;
    }
    else{
       n.childCount1 = 0;
    }
    return count;
};

function childCount2(level, n) {
    var arr = [];
    if(n.children && n.children.length > 0) {
      n.children.forEach(function(d) {
        arr.push(d);
      });
    }
    arr.sort(function(a,b) { return parseFloat(a.childCount1) - parseFloat(b.childCount1) } );
    var arr2 = [];
    arr.forEach(function(d, i) {
        d.order1 = i;
        arr2.splice(arr2.length/2,0, d);
    });
    arr2.forEach(function(d, i) {
        d.order2 = i;
        childCount2(level + 1, d);
        d.idDFS = nodeDFSCount++;   // this set DFS id for nodes
    });

};

d3.select(self.frameElement).style("height", diameter + "px");




// Toggle children on click.
function click(d) {
/*  if (d3.event.defaultPrevented) return; // ignore drag
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
  console.log("Clicking on = "+d.name+ " d.depth = "+d.depth);
  
 update();*/
}

/*
function collide(alpha) {
  var quadtree = d3.geom.quadtree(tree_nodes);
  return function(d) {
    quadtree.visit(function(quad, x1, y1, x2, y2) {
    if (quad.point && (quad.point !== d) && (quad.point !== d.parent) && (quad.point.parent !== d)) {
         var rb = getRadius(d) + getRadius(quad.point),
        nx1 = d.x - rb,
        nx2 = d.x + rb,
        ny1 = d.y - rb,
        ny2 = d.y + rb;

        var x = d.x - quad.point.x,
            y = d.y - quad.point.y,
            l = Math.sqrt(x * x + y * y);
          if (l < rb) {
          l = (l - rb) / l * alpha;
          d.x -= x *= l;
          d.y -= y *= l;
          quad.point.x += x;
          quad.point.y += y;
        }
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    });
  };
}
*/
