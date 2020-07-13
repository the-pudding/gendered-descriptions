import Swiper from 'swiper';
import "intersection-observer";
import scrollama from "scrollama";
import loadData from './load-data'
import rough from 'roughjs/bundled/rough.cjs';
import db from './db';
import { annotate } from 'rough-notation';

import enterView from 'enter-view'

const VERSION = Date.now();
let dataURL = 'https://pudding.cool/2020/07/gendered-descriptions-data/data.json?version='+VERSION
let adjGenderDataLoaded = false;
let bodyGenderDataLoaded = false;
let fairyTextFadedIn = false;
let quiz = null;
let removedWords = ["her","blond","of","be"]
/* global d3 */
let zoomed = false;
let adjCount = 50;
let spaceBetween = 20;
function resize() {
  setupAnnotations();
}

function initQuiz(){

  const quizText = [
    ["<span class=pos></span> bare legs, crossed, show the blue dabs of varicose veins.",0],
    ["<span class=sub></span> paused and wrung <span class=pos></span> little hands.",0],
    ["The skin of <span class=pos></span> naked shoulders appeared silver in the glow of lights through the windows.",0],
    ["<span class=pos></span> panting tongue hangs out; <span class=pos></span> red lips are thick and fresh.",0],
    ["<span class=sub></span> had an oval face, with rosy cheeks and lustrous skin.",0],
    ["<span class=sub></span> limped a bit from <span class=pos></span> wounded leg.",1],
    ["<span class=pos></span> lower lip is split, and the blood has dried blackly.",1],
    ["<span class=pos></span> huge hands clenched helplessly.",1],
    ["<span class=pos></span> square face was flushed and ruddy.",1],
    ["<span class=pos></span> head lolls back, tensing the muscles in <span class=pos></span> great thick neck.",1]
  ]

  let wordDict = {
    "pos":["her","his"],
    "sub":["she","he"]
  }

  let scored = {
    0:false,
    1:false,
    2:false,
    3:false,
    4:false,
    5:false,
    6:false,
    7:false,
    8:false,
    9:false
  }

  let score = {
    0:null,
    1:null,
    2:null,
    3:null,
    4:null,
    5:null,
    6:null,
    7:null,
    8:null,
    9:null
  }

  function calcScore(){
    let answered = 0;
    let correct = 0;
    let keys = Object.keys(score);
    for (var key in keys){
      if(score[keys[key]] == 0 || score[keys[key]] == 1){
        answered = answered + 1;
      }
      if(score[keys[key]] == 1){
        correct = correct + 1;
      }
    }
    db.update({"score":correct/answered});
    d3.select(".score-output").text(correct+" out of "+answered+" correct")
  }

  d3.select(".quiz-images").selectAll(".swiper-slide")
    .append("p")
    .attr("class","quiz-text")
    .html(function(d,i){
      d3.select(this).datum(i);
      return quizText[i][0]
    })
    .each(function(d,i){
      d3.select(this).selectAll("span").each(function(d,i){
        let word = d3.select(this).attr("class");

        let buttons = d3.select(this).selectAll("div").data(wordDict[word]).enter().append("div").attr("class","option").text(function(d,i){
          return d;
        }).on("click",function(d,i){

            let index = d3.select(this.parentNode.parentNode).datum();

            if(!scored[index]){
              scored[index] = true;
              if(i == quizText[index][1]){
                score[index] = 1
                // db.update({"card":index,"answer":1});
              }
              else {
                score[index] = 0;
                // db.update({"card":index,"answer":0});
              }
            }


            d3.select(this.parentNode).selectAll("div").classed("correct",function(d,i){
              if(i == quizText[index][1]){
                return true;
              }
              return false;
            })
            setTimeout(function(d){
              quiz.slideNext();
            },1000)

            calcScore();

        })
      })
    })

    // d3.select(".quiz-images").selectAll(".swiper-slide")
    // .select("img").on("click",function(d){
    //   quiz.slideNext();
    // })
}

function initDek(){
  let container = d3.select("#body-graphic").select(".graphic-title-dek");
  container.selectAll("span").each(function(){
    let attr = d3.select(this).attr("data-attr");
    if(attr == "circle-size"){
      d3.select(this).attr("class","circle-wrapper").selectAll("div").data([0,1,2]).enter()
        .append("div")
        .attr("class","circle")
        .style("width",function(d,i){
          return (i+1)*9+"px"
        })
        .style("height",function(d,i){
          return (i+1)*9+"px"
        })
    }
    else {
      d3.select(this).attr("class","gender-wrapper").selectAll("div").data([0,1]).enter()
        .append("div")
        .attr("class","circle")
        .text(function(d,i){
          if(i==0){
            return "women";
          }
          return "men";
        })
    }
  })
}

function endScroll(){
  const endSvg = d3.select("#end").select("svg");
  const offsetScale = d3.scaleLinear().domain([0,1]).range([0,2]);

  const endScrolling = enterView({
    selector: "#end",//'.lollipop-g',
    enter(el) {
      endSvg.selectAll("text").transition().duration(500).delay(function(d,i){
        return i*30;
      }).style("opacity",1)
      endSvg.selectAll("tspan").transition().duration(500).delay(function(d,i){
        return i*30;
      }).style("opacity",1)
    },
    offset: 0, // enter at middle of viewport
    once: true // trigger just once
  });
}

function hermioneScroll(){
  const hermSvg = d3.select("#hermione-2").select("svg");
  const offsetScale = d3.scaleLinear().domain([0,1]).range([0,2]);

  const hermScrolling = enterView({
    selector: "#hermione-2",//'.lollipop-g',
    progress(el, progress) {
      let offset = offsetScale(progress)*5+"%";
      hermSvg.style("transform","translate(0,"+offset+")");
    },
    offset: .5, // enter at middle of viewport
    once: false // trigger just once
  });
}

function parserScroll(){
  const parserSvg = d3.select("#parser").select("svg");
  const offsetScale = d3.scaleLinear().domain([0,1]).range([0,2]);

  const parserScrolling = enterView({
    selector: "#parser",//'.lollipop-g',
    enter(el) {
      parserSvg.selectAll("text").transition().duration(500).delay(function(d,i){
        return i*30;
      }).style("opacity",1)
      parserSvg.selectAll("tspan").transition().duration(500).delay(function(d,i){
        return i*30;
      }).style("opacity",1)
    },
    offset: 0, // enter at middle of viewport
    once: true // trigger just once
  });

}

function introScroll(){

  let titleSvg;
  if(window.innerWidth > window.innerHeight){
    titleSvg = d3.select(".title-wrapper").select(".desktop-svg").select("svg");
  }
  else {
    titleSvg = d3.select(".title-wrapper").select(".mobile-svg").select("svg");
  }

  const offsetScale = d3.scaleLinear().domain([0,1]).range([0,2]);

  const introScrolling = enterView({
    selector: "#title-selector",//'.lollipop-g',
    progress(el, progress) {
      let offset = offsetScale(progress)*5+"%";
      titleSvg.style("transform","translate(0,"+offset+")");
    },
    offset: 1, // enter at middle of viewport
    once: false // trigger just once
  });

}

function fairyScroll(){

  const fairySvg = d3.select("#fairy-2").select("svg");
  const offsetScale = d3.scaleLinear().domain([0,1]).range([-2,1]);

  const fairyScrolling = enterView({
    selector: "#fairy-2",//'.lollipop-g',
    enter(el) {
      if(!fairyTextFadedIn){
        fairySvg.selectAll("tspan").transition().duration(500).delay(function(d,i){
          return i*30;
        }).style("opacity",1)
        fairyTextFadedIn = true;
      }

    },
    progress(el, progress) {
      let offset = offsetScale(progress)+"%";
      fairySvg.select("#VINES").style("transform","translate(0,"+offset+")");
    },
    offset: 0, // enter at middle of viewport
    once: false, // trigger just once
  });

}

function initAdjScroller(){
  const scroller = scrollama();

  scroller
    .setup({
      container: '#adj-graphic', // our outermost scrollytelling element
      graphic: '.graphic', // the graphic
      text: '.story', // the step container
      step: '.story .step', // the step elements
      offset: 0.5 // set the trigger to be 1/2 way down screen
    })
    .onStepEnter(response => {
      // { element, index, direction } = response;
      // console.log(index);
    })
    .onStepExit(response => {
      // { element, index, direction }
    });

  // setup resize event
  window.addEventListener("resize", scroller.resize);
}

function filterData(data){

  return data.filter(function(d){
    d.shareF = +d.totalF / +d.total;
    if(d.diff > 0){
      d.logDiff = Math.log2(+d.diff);
    }
    else {
      d.logDiff = Math.log2(Math.abs(+d.diff))*-1;
    }
    if(d.adj == "bushy"){
      return d;
    }
    return removedWords.indexOf(d.adj) == -1 && d.total > 25;
  }).sort(function(a,b){
      if(b.adj == "bushy"){
        return 1;
      }
      if(a.adj == "bushy"){
        return 1;
      }
      return b.total - a.total
    }).slice(0,adjCount);
}

function buildAdjChart(data){

  let adjM = null;
  let adjF = null;

  function changeDataSet(dataSet){

    nested = d3.nest().key(function(d){
        return d.BodyPart;
      })
      .entries(dataSet)

    nestedMap = d3.map(nested,function(d){return d.key});
    bodyParts = nested.map(function(d){return d.key});
    getNewData(partSelected);
  }

  function setupAuthorToggles(){
    d3.select("#adj-graphic")
      .select(".author-filter")
      .selectAll('input')
      .on('change', function (d) {

        let value = d3.select(this).attr("value");
        container.selectAll("p").remove();
        if(!adjGenderDataLoaded){
          adjGenderDataLoaded = true;
          loadData(['adj_m.csv','adj_f.csv']).then(result => {
            adjM = result[0];
            adjF = result[1];

            if(value == "men"){
              changeDataSet(adjM)
            }
            else if (value == "women"){
              changeDataSet(adjF)
            }
            else {
              changeDataSet(data)
            }
          }).catch(console.error);
        }
        else {
          if(value == "men"){
            changeDataSet(adjM)
          }
          else if (value == "women"){
            changeDataSet(adjF)
          }
          else {
            changeDataSet(data)
          }
        }
      });


  }

  let container = d3.select(".chart");
  let width = Math.min(700,d3.select("body").node().offsetWidth);
  let margin = 50;
  if(d3.select("body").node().offsetWidth > 750){
    margin = 75
  }
  let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  let height = 400;

  if(d3.select("body").node().offsetWidth > 700){
    height = container.node().offsetHeight - 40;//Math.min(vh - 300,600);
  }
  else {
    height = container.node().offsetHeight - 150;//Math.min(vh - 300,600);
  }

  let fontExtent = [16,36];
  if(d3.select("body").node().offsetWidth < 900){
    fontExtent = [12,24];
  }
  if(d3.select("body").node().offsetWidth < 700){
    height = vh - 150;
  }

  let titlePart = d3.select("#adj-graphic").select(".graphic-title-hed").select(".part")
  let titleVerb = d3.select("#adj-graphic").select(".graphic-title-hed").select(".verb")



  container.style("width",width+"px")
  // container.style("height",height+"px")

  let nested = d3.nest().key(function(d){
      return d.BodyPart;
    })
    .entries(data)

  let nestedMap = d3.map(nested,function(d){return d.key});
  let bodyParts = nested.map(function(d){return d.key})
    .sort(function(x,y){ return x == "hair" ? -1 : y == "hair" ? 1 : 0; });

  let bodyNameMap = {
    "mouth":["mouths","are"],
    "arm":["arms","are"],
    "body":["bodies","are"],
    "eye":["eyes","are"],
    "finger":["fingers","are"],
    "foot":["feet","are"],
    "hand":["hands","are"],
    "face":["faces","are"],
    "head":["heads","are"],
    "leg":["legs","are"],
    "lip":["lips","are"],
    "mouths":["mouths","are"],
    "shoulder":["shoulders","are"],
    "skin":["skin","is"],
    "hair":["hair","is"],
    "heart":["heart","is"]
  }
  let partSelected = "hair";

  let partsButtons = d3.select(".part-selector").selectAll("div")
    .data(bodyParts)
    .enter()
    .append("div")
    .text(function(d){
      if(Object.keys(bodyNameMap).indexOf(d) > -1){
        return bodyNameMap[d][0];
      }
      return d;
    })
    .classed("selected",function(d){
      if(d == partSelected){
        return true;
      }
      return false;
    })
    .on("click",function(d){
      partSelected = d;
      partsButtons.classed("selected",false);
      d3.select(this).classed("selected",true);
      getNewData(d);
    })
    ;

  function getBackgroundColor(d){
    let color;
    if(+d[varSelected] < 0){
      color = d3.hsl(colorScaleInterpolateLeft(colorScaleLeft(+d[varSelected])));
    }
    else {
      color = d3.hsl(colorScaleInterpolateRight(colorScaleRight(+d[varSelected])));
    }
    color.l = .96;
    return color
  }

  function getColor(d){
    if(+d[varSelected] < 0){
      return d3.color(colorScaleInterpolateLeft(colorScaleLeft(+d[varSelected]))).darker(.3);
    }
    return d3.color(colorScaleInterpolateRight(colorScaleRight(+d[varSelected]))).darker(.3);
  }

  function getNewData(bodyPart){

    titlePart.text(bodyNameMap[bodyPart][0])
    titleVerb.text(bodyNameMap[bodyPart][1])

    dataSelected = nestedMap.get(bodyPart).values;
    dataSelected = filterData(dataSelected);

    console.log(dataSelected);
    setScales();

    container.selectAll("p").remove();

    words = container.selectAll("p")
      .data(dataSelected)
      .enter()
      .append("p")
      .attr("class","word")
      .classed("highlight",function(d,i){
        if(d.adj == "bushy"){
          return true;
        }
        return false;
      })
      .text(function(d){
        return d.adj;
      })
      .style("font-size",function(d){
        return radiusScale(+d.total)+"px";
      })
      .style("color",function(d){
        return getColor(d);
      })
      .each(function(d){
        let bounds = d3.select(this).node().getBoundingClientRect();
        d.width = bounds.width;
        d.height = bounds.height;
      })
      .style("width",function(d){
        return d.width+"px";
      })
      .style("height",function(d){
        return d.height+"px";
      })
      .style("background-color",function(d){
        return getBackgroundColor(d);
      })


    var simulation = d3.forceSimulation(dataSelected)
      .force("x", d3.forceX(function(d) {
          return x(+d[varSelected]);
        })
        .strength(3)
      )
    	.force("y", d3.forceY(height / 2))
      .force("collide", collide)
      .stop()
      ;

    for (var i = 0; i < 250; ++i) simulation.tick();

    words
      .style("left",function(d){
        return d.x+"px"
      })
      .style("top",function(d){
        return d.y+"px";
      })
  }

  function setScales(){
    radiusScale.domain(d3.extent(dataSelected,function(d){ return +d.total }));
    dataExtent = d3.extent(dataSelected,function(d){ return +d[varSelected] });
    if(dataExtent[0] < -4){
      dataExtent[0] = -4;
    }
    if(dataExtent[1] > 4){
      dataExtent[1] = 4;
    }
    if(dataExtent[0] > -1){
      dataExtent[0] = -1.1;
    }
    if(dataExtent[1] < 1){
      dataExtent[1] = 1.1;
    }

    x.domain(dataExtent).clamp(true);

    console.log(x.range());

    midScale.transition().duration(1000).delay(500)
      .style("left",x(0)+"px");

    oneScale
      .classed("last",function(d){
        return getLast(d);
      })
      .classed("first",function(d){
        return getFirst(d);
      })
      .style("display",function(d,i){
        if(dataExtent[0] > -1 && i == 0){
          return "none";
        }
        if(dataExtent[1] < 1 && i == 1){
          return "none";
        }
        return null;
      })
      .transition().duration(1000).delay(500)
      .style("left",function(d){
        return x(d)+"px"
      })
      .style("opacity",function(d,i){
        if(dataExtent[0] > -1 && i == 0){
          return 0;
        }
        if(dataExtent[1] < 1 && i == 1){
          return 0;
        }
        return null;
      })
      ;

    twoScale
      .classed("last",function(d){
        return getLast(d);
      })
      .classed("first",function(d){
        return getFirst(d);
      })
      .style("display",function(d,i){
        if(dataExtent[0] > -2 && i == 0){
          return "none";
        }
        if(dataExtent[1] < 2 && i == 1){
          return "none";
        }
        return null;
      })
      .transition().duration(1000).delay(500)
      .style("left",function(d){
        return x(d)+"px"
      })
      .style("opacity",function(d,i){
        if(dataExtent[0] > -2 && i == 0){
          return 0;
        }
        if(dataExtent[1] < 2 && i == 1){
          return 0;
        }
        return null;
      })
      ;

    threeScale
      .classed("last",function(d){
        return getLast(d);
      })
      .classed("first",function(d){
        return getFirst(d);
      })
      .style("display",function(d,i){
        if(dataExtent[0] > -3 && i == 0){
          return "none";
        }
        if(dataExtent[1] < 3 && i == 1){
          return "none";
        }
        return null;
      })
      .transition().duration(1000).delay(500)
      .style("left",function(d){
        return x(d)+"px"
      })
      .style("opacity",function(d,i){
        if(dataExtent[0] > -3 && i == 0){
          return 0;
        }
        if(dataExtent[1] < 3 && i == 1){
          return 0;
        }
        return null;
      })
      ;

    fourScale
      .classed("last",function(d){
        return getLast(d);
      })
      .classed("first",function(d){
        return getFirst(d);
      })
      .style("display",function(d,i){
        if(dataExtent[0] > -4 && i == 0){
          return "none";
        }
        if(dataExtent[1] < 4 && i == 1){
          return "none";
        }
        return null;
      })
      .transition().duration(1000).delay(500)
      .style("left",function(d){
        return x(d)+"px"
      })
      .style("opacity",function(d,i){
        if(dataExtent[0] > -4 && i == 0){
          return 0;
        }
        if(dataExtent[1] < 4 && i == 1){
          return 0;
        }
        return null;
      })
      ;
  }

  function getFirst(value){
    if(value == 1 && dataExtent[1] > 1 && dataExtent[1] < 2){
      return true
    }
    else if(value == 2 && dataExtent[1] > 2 && dataExtent[1] < 3){
      return true
    }
    else if(value == 3 && dataExtent[1] > 3 && dataExtent[1] < 4){
      return true
    }
    else if(value >= dataExtent[1] && value > 0){
      return true;
    }

    return false;
  }

  function getLast(value){
    if(value == -1 && dataExtent[0] < -1 && dataExtent[0] > -2){
      return true
    }
    else if(value == -2 && dataExtent[0] < -2 && dataExtent[0] > -3){
      return true
    }
    else if(value == -3 && dataExtent[0] < -3 && dataExtent[0] > -4){
      return true
    }
    else if(value <= dataExtent[0] && value < 0){
      return true;
    }
    return false
  }

  let varSelected = "logDiff";

  let dataSelected = nestedMap.get(partSelected).values;
  dataSelected = filterData(dataSelected);
  let dataExtent = d3.extent(dataSelected,function(d){ return +d[varSelected] });
  let radiusScale = d3.scaleLinear().domain(d3.extent(dataSelected,function(d){ return +d.total })).range(fontExtent);
  let colorScale = d3.scaleLinear().domain([-1,0,1]).range([0,.5,1]).clamp(true);
  let colorScaleLeft = d3.scaleLinear().domain([-1,0]).range([0,1]).clamp(true);
  let colorScaleRight = d3.scaleLinear().domain([0,1]).range([0,1]).clamp(true);
  let colorScaleInterpolateLeft = d3.interpolateHcl("#FFA269","#777")//"#4EC6C4");
  let colorScaleInterpolateRight = d3.interpolateHcl("#777","#4EC6C4")//"#4EC6C4");
  let x = d3.scaleLinear().domain(d3.extent(dataSelected,function(d){ return +d[varSelected] })).range([margin/2,width-margin/2]);
  x.domain(d3.extent(dataSelected,function(d){ return +d[varSelected] })).clamp(true);

  let scales = container.append("div").attr("class","scales");
  let midScale = scales.append("div").attr("class","mid");
  let oneScale = scales.append("div").attr("class","one-scales").selectAll("div").data([-1,1]).enter().append("div").attr("class","one-scale")
  let twoScale = scales.append("div").attr("class","two-scales").selectAll("div").data([-2,2]).enter().append("div").attr("class","two-scale")
  let threeScale = scales.append("div").attr("class","three-scales").selectAll("div").data([-3,3]).enter().append("div").attr("class","three-scale")
  let fourScale = scales.append("div").attr("class","four-scales").selectAll("div").data([-4,4]).enter().append("div").attr("class","four-scale")

  setScales();

  let words = container.append("div").attr("class","word-wrapper").selectAll("p")
    .data(dataSelected)
    .enter()
    .append("p")
    .attr("class","word")
    .classed("highlight",function(d,i){
      if(d.adj == "bushy"){
        return true;
      }
      return false;
    })
    .text(function(d){
      return d.adj;
    })
    .style("font-size",function(d){
      return radiusScale(+d.total)+"px";
    })
    .each(function(d){
      let bounds = d3.select(this).node().getBoundingClientRect();
      d.width = bounds.width;
      d.height = bounds.height;
    })
    .style("width",function(d){
      return d.width+"px";
    })
    .style("height",function(d){
      return d.height+"px";
    })
    .style("background-color",function(d){
      return getBackgroundColor(d);
    })
    .style("color",function(d){
      return getColor(d);
    })
    ;


  function rectWidth(word, value) {
    return word.length * value;
  }

  var collide = bboxCollide(function (d,i) {
      d.value = d.height//radiusScale(+d.total)/10;
      let heightMod = .5;
      var width = d.width*1.2//rectWidth(d.adj, d.value)
      return [[-width / 2, -d.value * heightMod],[width / 2, d.value * heightMod]]
    })
    .strength(1)
    .iterations(2)

  var collisionForce = rectCollide()
      .size(function (d) { return [d.width*1.5, d.height] })

	var simulation = d3.forceSimulation(dataSelected)
  	.force("x", d3.forceX(function(d) {
        return x(+d[varSelected]);
      })
      .strength(3)
    )
  	.force("y", d3.forceY(height / 2))
    .force("collide", collide)
  	.stop()
  	;

  for (var i = 0; i < 250; ++i) simulation.tick();


  words
    .style("left",function(d){
      return d.x+"px"
    })
    .style("top",function(d){
      return d.y+"px";
    })

  setupAuthorToggles();


}

function buildHistogram(data){

  function setScales(){
    radiusScale.domain(d3.extent(dataSelected,function(d){ return +d.total }));
    dataExtent = d3.extent(dataSelected,function(d){ return +d[varSelected] });
    if(dataExtent[0] < -4){
      dataExtent[0] = -4;
    }
    if(dataExtent[1] > 4){
      dataExtent[1] = 4;
    }
    if(dataExtent[0] > -1){
      dataExtent[0] = -1.1;
    }
    if(dataExtent[1] < 1){
      dataExtent[1] = 1.1;
    }

    x.domain(dataExtent).clamp(true);

  }

  let partSelected = "hair";

  let width = d3.select("body").node().offsetWidth;
  let vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
  let height = 400;
  let fontExtent = [18,48];
  if(width < 700){
    fontExtent = [12,24];
    height = vh - 150;
  }
  width = width * .9;


  let container = d3.select(".chart");

  let nested = d3.nest().key(function(d){
      return d.BodyPart;
    })
    .entries(data.filter(function(d){
      return +d.total > 50;
    }))

  let nestedMap = d3.map(nested,function(d){return d.key});
  let bodyParts = nested.map(function(d){return d.key});

  let varSelected = "logDiff";

  let dataSelected = nestedMap.get(partSelected).values;
  dataSelected = filterData(dataSelected);

  let dataExtent = d3.extent(dataSelected,function(d){ return +d[varSelected] });
  let radiusScale = d3.scaleLinear().domain(d3.extent(dataSelected,function(d){ return +d.total })).range(fontExtent);
  let colorScale = d3.scaleLinear().domain([-1,0,1]).range([0,.5,1]).clamp(true);
  let colorScaleLeft = d3.scaleLinear().domain([-1,0]).range([0,1]).clamp(true);
  let colorScaleRight = d3.scaleLinear().domain([0,1]).range([0,1]).clamp(true);
  let colorScaleInterpolateLeft = d3.interpolateHcl("#FFA269","#777")//"#4EC6C4");
  let colorScaleInterpolateRight = d3.interpolateHcl("#777","#4EC6C4")//"#4EC6C4");
  let x = d3.scaleLinear().domain(d3.extent(dataSelected,function(d){ return +d[varSelected] })).range([0,width]);
  x.domain(d3.extent(dataSelected,function(d){ return +d[varSelected] })).clamp(true);

  setScales();

  let buckets = 15;
  var histogramScale = d3.scaleQuantile().domain([0,1]).range(d3.range(buckets));

  var nestedHistogram = d3.nest().key(function(d){




      if(Math.abs(d.logDiff) < .5){
        return 0
      }
      else if(d.logDiff < -4 && dataExtent[0]){
        return -4;
      }
      else if(d.logDiff > 4 && dataExtent[0]){
        return 4;
      }

      else {
        return Math.round(d.logDiff);
      }

  	})
  	.sortKeys(function(a,b){
  		return +a - +b;
  	})
  	.sortValues(function(a,b){
  		return +a["total"] - +b["total"]
  	})
  	.entries(dataSelected)
  	;

    console.log(nestedHistogram);

  let words = container
    .attr("class","histogram")
    .selectAll("div")
    .data(nestedHistogram)
    .enter()
    .append("div")
    .attr("class","column")
    .selectAll("p")
    .data(function(d){
      return d.values;
    })
    .enter()
    .append("p")
    .text(function(d){
      return d.adj;
    })
    .attr("class","word")
    .style("font-size",function(d){
      return radiusScale(+d.total)+"px";
    })
    .style("color",function(d){
      return colorScale(+d[varSelected]);
    })
    .style("background-color",function(d){
      let color = d3.color(colorScale(+d[varSelected]));
      return "rgba("+color.r+","+color.g+","+color.b+",.1)"
    })
    ;


    // .append("p")
    // .attr("class","word")
    // .text(function(d){
    //   return d.adj;
    // })
    // .style("font-size",function(d){
    //   return radiusScale(+d.total)+"px";
    // })
    // .style("color",function(d){
    //   return colorScale(+d[varSelected]);
    // })
    // .each(function(d){
    //   let bounds = d3.select(this).node().getBoundingClientRect();
    //   d.width = bounds.width;
    //   d.height = bounds.height;
    // })
    // .style("width",function(d){
    //   return d.width+"px";
    // })
    // .style("height",function(d){
    //   return d.height+"px";
    // })
    // .style("background-color",function(d){
    //   let color = d3.color(colorScale(+d[varSelected]));
    //   return "rgba("+color.r+","+color.g+","+color.b+",.1)"
    // })
    // ;

}

function initBodyScroller(){
  const scroller = scrollama();
  let svg = d3.selectAll(".body-img");

  function stepEnter(response){
    let index = response.index;
    if(index==0){
      zoomed = true;
      svg.classed("head-zoomed",true);
      svg.classed("head-visible",true);
      svg.classed("body-visible",false);
      svg
        //.transition().duration(1000)
        .style("transform","translate3d(0,0,0) scale(3,3)")
      svg.select("#hair").selectAll("path").classed("highlighted",false).classed("highlighted-two",false);
    }
    else if(index == 1){
      zoomed = true;
      svg.classed("head-zoomed",true);
      svg.classed("head-visible",true);
      svg.classed("body-visible",false);
      svg.select("#hair").selectAll("path")
        .classed("highlighted",function(d,i){
          if(i==0){
            return true;
          }
          return false;
        })
        .classed("highlighted-two",function(d,i){
          if(i==1){
            return true;
          }
          return false;
        })
        ;
      svg
        //.transition().duration(1000)
        .style("transform","translate3d(0,0,0) scale(3,3)")
      svg.select("#click-circle").style("pointer-events","none")
      svg.select("#zoom").transition().duration(1000).style("opacity",0);
      svg.select("#nipple").selectAll("path").style("stroke",null);
      svg.select("#hip").selectAll("path").style("stroke",null);
      svg.select("#waist").selectAll("path").style("stroke",null);
      svg.select("#thigh").selectAll("path").style("stroke",null);
    }
    else if(index == 2){
      zoomed = false;
      svg.select("#hair").selectAll("path").classed("highlighted",false).classed("highlighted-two",false);
      svg.classed("head-zoomed",false);
      svg.classed("head-visible",false);
      svg.classed("body-visible",true);
      svg
        //.transition().duration(1000)
        .style("transform","translate3d(0,0,0) scale(1,1)")
      svg.select("#click-circle").style("pointer-events","all")
      svg.select("#zoom").transition().duration(1000).style("opacity",1);
      svg.select("#nipple").selectAll("path").classed("highlighted",function(d,i){
        if(i==0){
          return true;
        }
        return false;
      })
      .classed("highlighted-two",function(d,i){
        if(i==1){
          return true;
        }
        return false;
      })
      svg.select("#hip").selectAll("path").classed("highlighted",function(d,i){
        if(i==0){
          return true;
        }
        return false;
      })
      .classed("highlighted-two",function(d,i){
        if(i==1){
          return true;
        }
        return false;
      })
      svg.select("#waist").selectAll("path").classed("highlighted",function(d,i){
        if(i==0){
          return true;
        }
        return false;
      })
      .classed("highlighted-two",function(d,i){
        if(i==1){
          return true;
        }
        return false;
      })
      svg.select("#thigh").selectAll("path").classed("highlighted",function(d,i){
        if(i==0){
          return true;
        }
        return false;
      })
      .classed("highlighted-two",function(d,i){
        if(i==1){
          return true;
        }
        return false;
      })
      svg.select("#chest").selectAll("path").classed("highlighted-four",false).classed("highlighted-three",false);
      svg.select("#fist").selectAll("path").classed("highlighted-four",false).classed("highlighted-three",false);
      svg.select("#knuckle").selectAll("path").classed("highlighted-four",false).classed("highlighted-three",false);
    }
    else if(index == 3){
      svg.select("#nipple").selectAll("path").classed("highlighted",false).classed("highlighted-two",false);
      svg.select("#hip").selectAll("path").classed("highlighted",false).classed("highlighted-two",false);
      svg.select("#waist").selectAll("path").classed("highlighted",false).classed("highlighted-two",false);
      svg.select("#thigh").selectAll("path").classed("highlighted",false).classed("highlighted-two",false);
      svg.select("#chest").selectAll("path").classed("highlighted-three",function(d,i){
        if(i==0){
          return true;
        }
        return false;
      })
      .classed("highlighted-four",function(d,i){
        if(i==1){
          return true;
        }
        return false;
      })
      svg.select("#fist").selectAll("path").classed("highlighted-three",function(d,i){
        if(i==0){
          return true;
        }
        return false;
      })
      .classed("highlighted-four",function(d,i){
        if(i==1){
          return true;
        }
        return false;
      })
      svg.select("#knuckle").selectAll("path").classed("highlighted-three",function(d,i){
        if(i==0){
          return true;
        }
        return false;
      })
      .classed("highlighted-four",function(d,i){
        if(i==1){
          return true;
        }
        return false;
      })
      svg.selectAll("#click-circle").style("pointer-events","all")
      svg.select("#zoom").transition().duration(1000).style("opacity",1);
    }
  }

  scroller
    .setup({
      container: '#body-graphic', // our outermost scrollytelling element
			graphic: '.graphic', // the graphic
			text: '.story', // the step container
			step: '.story .step', // the step elements
			offset: 0.8 // set the trigger to be 1/2 way down screen
    })
    .onStepEnter(stepEnter)
    .onStepExit(response => {
      // { element, index, direction }
    });

  // setup resize event
  window.addEventListener("resize", scroller.resize);

}
function setupMethod(){
  d3.select(".adj-chart").append("img")
    .attr("src","assets/images/adj_structure.png")

  d3.select(".formula-chart").append("img")
    .attr("src","assets/images/formula1.png")

  d3.select(".formula-chart-two").append("img")
    .attr("src","assets/images/formula2.png")
}
function setupAnnotations(){

  d3.selectAll(".rough-annotation").remove();

  const e = d3.select(".text-highlight").node();
  const annotation = annotate(e, { padding:[0, 0, 0, 0], type: 'highlight', color: '#fff176', animate: false });
  annotation.show();

  const textUnderlines = d3.selectAll(".text-underline").each(function(d,i){
    let element = d3.select(this).node();
    annotate(element, { type: 'underline', color: '#a484f0', multiline: true, animate: false }).show();
  });
}
function init() {

  if(d3.select("body").classed("is-mobile")){
    spaceBetween = 10;
  }


  //
  d3.select(".score-avg").classed("text-underline",true);
  d3.select(".method").select("button").on("click",function(d){
    d3.select(".method").classed("expanded",true)
  })
  //
  setupAnnotations();
  //
  quiz = new Swiper('.swiper-container', {
    speed: 400,
    spaceBetween: spaceBetween,
    slidesPerView:"auto",
    centeredSlides:true
    // mousewheel:{
    //   forceToAxis:true,
    //   invert:true
    // }
  });
  initQuiz();
  initDek();
  initBodyScroller();
  initAdjScroller();
  fairyScroll();
  introScroll();
  parserScroll();
  hermioneScroll();
  endScroll();
  setupMethod();
  //
  //
  loadData([dataURL]).then(result => {
    d3.select(".score-avg").text(Math.round(result[0].avg*100)+"%")
  })
  // //
  // //
	loadData(['adj_3.csv', 'parts5_1.csv']).then(result => {
    buildAdjChart(result[0]);
  // buildHistogram(result[0]);

    // setupBodyImg(result[1])

    bodyEvents(result[1]);

    setupDB();
    //
    d3.select(".puff").classed("puff-image",true);
    d3.select(".butterfly").classed("butterfly-image",true);
    d3.select(".brush").classed("brush-image",true);
  //
	}).catch(console.error);

}



function setupDB() {
  db.setup();
  // const answers = db.getAnswers();
  // if(answers){
  //   hasExistingData = true;
  //
  //   yearSelected = answers["year"];
  //   genSelected = getGeneration(yearSelected);
  //
  //   d3.select(".new-user").style("display","none")
  //   d3.select(".old-user").style("display","flex")
  //   d3.selectAll(".old-bday").text(yearSelected);
  //
  //   answers["answers"].forEach(function(d){
  //     dbOutput.push(d);
  //     let songInfo = uniqueSongMap.get(d.key);
  //     songOutput.push({"song_url":songInfo.song_url,"key":d.key,"artist":songInfo.artist,"title":songInfo.title,"text":answersKey[d.answer].text,"answer":d.answer,"year":songInfo.year})
  //   })
  //   //remove this when staging live
  //   // quizOutput();
  //   // updateOnCompletion();
  // }
}

function bodyEvents(data){

  let partsM = null;
  let partsF = null;
  let bodies = d3.selectAll(".body-img");


  function changeDataSet(dataSet,value){
    bodyPartMap = d3.map(dataSet,function(d){ return d.BodyPart; });
    bodies.classed("body-hidden",function(d){
      let id = d3.select(this).attr("id");
      if(value == "men"){
        if(id == "men-parts"){
          return false;
        }
        return true;
      }
      else if(value == "women"){
        if(id == "women-parts"){
          return false;
        }
        return true;
      }
      else if(value == "all"){
        if(id == "all-parts"){
          return false;
        }
        return true;
      }
    })
  }

  function setupAuthorToggles(){


    d3.select("#body-graphic")
      .select(".author-filter")
      .selectAll('input')
      .on('change', function (d) {

        let value = d3.select(this).attr("value");

        if(!bodyGenderDataLoaded){
          bodyGenderDataLoaded = true;
          loadData(['partsM_2.csv','partsF_2.csv']).then(result => {
            partsM = result[0];
            partsF = result[1];

            if(value == "men"){
              changeDataSet(partsM,value)

            }
            else if (value == "women"){
              changeDataSet(partsF,value)
            }
            else {
              changeDataSet(data,value)
            }
          }).catch(console.error);
        }
        else {
          if(value == "men"){
            changeDataSet(partsM,value)
          }
          else if (value == "women"){
            changeDataSet(partsF,value)
          }
          else {
            changeDataSet(data,value)
          }
        }
      });


  }


  let bodyPartMap = d3.map(data,function(d){ return d.BodyPart; });

  let svg = d3.selectAll(".body-img").on("click",function(){
    if(zoomed){
      zoomed = false;
      d3.selectAll("#click-circle").style("pointer-events","all")
      svg
        //.transition().duration(1000)
        .style("transform","translate3d(0,0,0) scale(1,1)")
      svg.select("#zoom").transition().duration(1000).style("opacity",1);
      svg.classed("head-zoomed",false);
      svg.classed("head-visible",false);
      svg.classed("body-visible",true);
    }

  })

  let width = d3.select("body").node().offsetWidth;

  let toolTipWidth = 350;

  let toolTip = svg.append("g")
    .attr("class","tooltip")

  let toolTipRect = toolTip.append("rect")
    .attr("class","tooltip-rect")
    .attr("width",toolTipWidth)
    .attr("height",150)
    .attr("rx",8)
    .attr("ry",8)
    ;

  let toolTipTextPart = toolTip.append("text")
    .attr("class","tooltip-text")
    .attr("x",40)
    .attr("y",50)
    ;

  let toolTipText = toolTip.append("text")
    .attr("class","tooltip-text")
    .attr("x",40)
    .attr("y",90)
    ;

  let toolTipTextTwo = toolTip.append("text")
    .attr("class","tooltip-text")
    .attr("x",40)
    .attr("y",120)
    ;

  function mouseover(el,section){
    let part = d3.select(el.parentNode).attr("id")
    if(part != "body-text" && part != "face-text"){
      function getCentroid(element) {
          var bbox = element.getBBox();
          return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
      }

      let bodyData = bodyPartMap.get(part);
      let centroid = null;
      d3.select(el.parentNode).selectAll("path").each(function(d,i){
        if(i==1){
          centroid = getCentroid(d3.select(this).node());
        }
      })
      let skew = bodyData.skew;

      d3.select(el.parentNode).datum(function(){

        return {"oddsRatio":bodyData.pctF/bodyData.pctM,"centroid": centroid, "bodyPart":part};
      })

      d3.select("#parts").selectAll("path").style("stroke",null);

      d3.select(el.parentNode).selectAll("path")
        .style("stroke",function(d,i){
          if(i==1){
            return "black"
          }
          return null;
        });

      let scale = 1;
      if(section == "face"){
        scale = .4;
      }

      toolTip
        .style("display","block")
        .attr("transform",function(){
          let parentWidth = d3.select(this.parentNode).node().getBBox().width;
          if(scale < 1){
            return "translate("+(centroid[0] - toolTipWidth*scale/2)+","+centroid[1]+") scale("+scale+")";
          }
          if(centroid[0] < parentWidth/2){
            return "translate("+(centroid[0])+","+centroid[1]+") scale("+scale+")";
          }
          return "translate("+(centroid[0] - toolTipWidth*scale)+","+centroid[1]+") scale("+scale+")";
        });

      let suffix = "women";
      if(skew > 0){
        suffix = "men";
      }

      toolTipText.text(Math.round(Math.abs(skew)*100)/100+"x more likely")
      toolTipTextTwo.text("to appear for "+suffix)
      toolTipTextPart.text(part);
    }

  }

  svg.selectAll("#body-parts").selectAll("path")
    .on("mouseover",function(){
      mouseover(this,"body");
    })
    .on("mouseout",function(){
      svg.select("#parts").selectAll("path").style("stroke",null);

      toolTip
        .style("display","none");
    })

  svg.selectAll("#face-parts").selectAll("path")
    .on("mouseover",function(){
      mouseover(this,"face");
    })
    .on("mouseout",function(){
      d3.select("#parts").selectAll("path").style("stroke",null);

      toolTip
        .style("display","none");
    })
    .on("click",function(d,i){
      d3.event.stopPropagation();
    });

  let face = svg.selectAll("#click-circle").on("click",function(d){
    console.log("clicking");
    d3.event.stopPropagation();
    if(!zoomed){
      zoomed = true;
      d3.select(this).style("pointer-events","none")
      svg.select("#zoom").transition().duration(1000).style("opacity",0);
      svg.classed("head-zoomed",true);
      svg.classed("head-visible",true);
      svg.classed("body-visible",false);
      svg
        //.transition().duration(1000)
        .style("transform"," translate3d(0,0,0) scale(3,3)")
    }
    else {
      zoomed = false;
      d3.select(this).style("pointer-events","all")
      svg.select("#zoom")
        .transition().duration(1000).style("opacity",1);
      svg
        //.transition().duration(1000)
        .style("transform"," translate3d(0,0,0) scale(1,1)")
    }
  })
  .on("mouseover",function(d,i){
    svg.select("#zoom").select("g").selectAll("path").each(function(d,i){
      if(i==0){
        d3.select(this).style("fill","#ffffcc");
      }
    })
  })
  .on("mouseout",function(d,i){
    svg.select("#zoom").select("g").selectAll("path").style("fill",null);
  })

  setupAuthorToggles();
}

function setupBodyImg(data){
  let zoomed = false;

  let face = d3.selectAll("#click-circle").on("click",function(d){
    if(!zoomed){
      d3.select(this).style("pointer-events","none")
      zoomed = true;
      svg.transition().duration(1000).style("transform"," translate3d(0,0,0) scale(3,3)")
      svg.select("#zoom").transition().duration(1000).style("opacity",0);
      svg.select("#face-parts").style("display","block")
      svg.select("#body-parts").style("display","none")
      //svg.selectAll(".body-circle").transition().duration(1000).style("opacity",0);
    }
    else {
      d3.select(this).style("pointer-events",null)
      zoomed = false;
      svg.transition().duration(1000).style("transform",null)
      svg.select("#zoom").transition().duration(1000).style("opacity",null);
      svg.select("#face-parts").style("display",null)
      svg.select("#body-parts").style("display",null)
    }
  })
  .on("mouseover",function(d,i){
    svg.select("#zoom").select("g").selectAll("path").each(function(d,i){
      if(i==0){
        d3.select(this).style("fill","#ffffcc");
      }
    })
  })
  .on("mouseout",function(d,i){
    svg.select("#zoom").select("g").selectAll("path").style("fill",null);
  });

  let bodyPartMap = d3.map(data,function(d){ return d.BodyPart; });

  function getCentroid(element) {
      var bbox = element.getBBox();
      return [bbox.x + bbox.width/2, bbox.y + bbox.height/2];
  }

  let svg = d3.select(".body-img")

  let roughSvg = rough.svg(svg.node());

  let bodyAnnotated = [];
  let bodyAnnotatedFace = [];

  svg.select("#parts").selectAll("path").each(function(d){
    bodyAnnotated.push(d3.select(this).attr("id"));
  })

  svg.select("#face-parts").selectAll("path").each(function(d){
    bodyAnnotatedFace.push(d3.select(this).attr("id"));
  })

  let extent = d3.extent(data.filter(function(d){
    return d.skew != "Inf" && d.skew != "-Inf" && bodyAnnotated.indexOf(d.BodyPart) > -1;
  }).map(function(d){
    return Math.abs(d.skew);
  }));

  let extentFace = d3.extent(data.filter(function(d){
    return d.skew != "Inf" && d.skew != "-Inf" && bodyAnnotatedFace.indexOf(d.BodyPart) > -1;
  }).map(function(d){
    return Math.abs(d.skew);
  }));

  let circleRadius = d3.scalePow().domain(extent).range([30,110]).exponent(.4)
  let circleRadiusFace = d3.scalePow().domain(extentFace).range([8,60]).exponent(.4)

  let colorScale = d3.scaleThreshold().domain([extent[0],0,extent[1]]).range(["#FFA269","#4EC6C4","#4EC6C4"]);
  let colorScaleInterpolate = d3.interpolateRgb("#4EC6C4","#FFA269");

  let dots2 = svg.select("#parts").selectAll("path").datum(function(d){
    let part = d3.select(this).attr("id");
    if(!bodyPartMap.has(part)){
      console.log(part);
    }


  })


  let dots = svg.select("#parts").selectAll("path").attr("fill","none").attr("stroke","none").datum(function(d){

    let part = d3.select(this).attr("id");

    let bodyData = bodyPartMap.get(part);

    let centroid = getCentroid(d3.select(this).node())
    return {"oddsRatio":bodyData.pctF/bodyData.pctM,"centroid": centroid, "bodyPart":part,"skew":bodyData.skew};
  })

  .each(function(d){

    let centroid = d.centroid;
    let oddsRatio = d.oddsRatio;
    let part = d.bodyPart;
    let faceCircle = false;
    let strokeWidth = 3;
    let hachureGap = 2;
    let roughness = 1.2;
    let fillWeight = .8;
    let skew = d.skew;
    let radius = circleRadius(Math.abs(skew));


    if(d3.select(this.parentNode).attr("id") == "face-parts"){
      faceCircle = true;
      radius = circleRadiusFace(Math.abs(skew));
      strokeWidth = 1;
      hachureGap = 1;
      fillWeight = .5;
      roughness = .5;
    }

    let angle = d3.scaleLinear().domain([0,1]).range([-180,180]);
    let fillColor = d3.color(colorScale(skew));

    let rcCircle = roughSvg.circle(centroid[0], centroid[1], radius, {
      fill: "rgba("+fillColor.r+","+fillColor.g+","+fillColor.b+",.8)",
      fillStyle: 'solid',
      hachureGap:hachureGap,
      roughness:roughness,
      hachureAngle:angle(Math.random()),
      //simplification:.1,
      //bowing: 1,
      //roughness: 2,
      strokeWidth: strokeWidth,
      fillWeight: fillWeight, // thicker lines for hachure
      stroke:d3.color(colorScale(skew)).darker(1)
    });

    let appendedCircle = d3.select(this.parentNode).node().appendChild(rcCircle);
    let circle = d3.select(appendedCircle)
      .attr("class",function(d){
        if(bodyAnnotatedFace.indexOf(part) > -1){
          return "face-circle";
        }
        return "body-circle";
      })
      .attr("id",part)
      .on("click",function(d){
      })
      .attr("data-part",part)
      .datum(radius)
      ;


  })
  ;

  d3.selectAll(".body-circle").sort(function(a,b){
    return b-a;
  })

  d3.selectAll(".face-circle").sort(function(a,b){
    return b-a;
  })

}

function constant(_) {
    return function () { return _ }
}

function rectCollide() {
    var nodes, sizes, masses
    var size = constant([0, 0])
    var strength = 1
    var iterations = 1

    function force() {
        var node, size, mass, xi, yi
        var i = -1
        while (++i < iterations) { iterate() }

        function iterate() {
            var j = -1
            var tree = d3.quadtree(nodes, xCenter, yCenter).visitAfter(prepare)

            while (++j < nodes.length) {
                node = nodes[j]
                size = sizes[j]
                mass = masses[j]
                xi = xCenter(node)
                yi = yCenter(node)

                tree.visit(apply)
            }
        }

        function apply(quad, x0, y0, x1, y1) {
            var data = quad.data
            var xSize = (size[0] + quad.size[0]) / 2
            var ySize = (size[1] + quad.size[1]) / 2
            if (data) {
                if (data.index <= node.index) { return }

                var x = xi - xCenter(data)
                var y = yi - yCenter(data)
                var xd = Math.abs(x) - xSize
                var yd = Math.abs(y) - ySize

                if (xd < 0 && yd < 0) {
                    var l = Math.sqrt(x * x + y * y)
                    var m = masses[data.index] / (mass + masses[data.index])

                    if (Math.abs(xd) < Math.abs(yd)) {
                        node.vx -= (x *= xd / l * strength) * m
                        data.vx += x * (1 - m)
                    } else {
                        node.vy -= (y *= yd / l * strength) * m
                        data.vy += y * (1 - m)
                    }
                }
            }

            return x0 > xi + xSize || y0 > yi + ySize ||
                   x1 < xi - xSize || y1 < yi - ySize
        }

        function prepare(quad) {
            if (quad.data) {
                quad.size = sizes[quad.data.index]
            } else {
                quad.size = [0, 0]
                var i = -1
                while (++i < 4) {
                    if (quad[i] && quad[i].size) {
                        quad.size[0] = Math.max(quad.size[0], quad[i].size[0])
                        quad.size[1] = Math.max(quad.size[1], quad[i].size[1])
                    }
                }
            }
        }
    }

    function xCenter(d) { return d.x + d.vx + sizes[d.index][0] / 2 }
    function yCenter(d) { return d.y + d.vy + sizes[d.index][1] / 2 }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
        masses = sizes.map(function (d) { return d[0] * d[1] })
    }

    force.size = function (_) {
        return (arguments.length
             ? (size = typeof _ === 'function' ? _ : constant(_), force)
             : size)
    }

    force.strength = function (_) {
        return (arguments.length ? (strength = +_, force) : strength)
    }

    force.iterations = function (_) {
        return (arguments.length ? (iterations = +_, force) : iterations)
    }

    return force
}

function boundedBox() {
    var nodes, sizes
    var bounds
    var size = constant([0, 0])

    function force() {
        var node, size
        var xi, x0, x1, yi, y0, y1
        var i = -1
        while (++i < nodes.length) {
            node = nodes[i]
            size = sizes[i]
            xi = node.x + node.vx
            x0 = bounds[0][0] - xi
            x1 = bounds[1][0] - (xi + size[0])
            yi = node.y + node.vy
            y0 = bounds[0][1] - yi
            y1 = bounds[1][1] - (yi + size[1])
            if (x0 > 0 || x1 < 0) {
                node.x += node.vx
                node.vx = -node.vx
                if (node.vx < x0) { node.x += x0 - node.vx }
                if (node.vx > x1) { node.x += x1 - node.vx }
            }
            if (y0 > 0 || y1 < 0) {
                node.y += node.vy
                node.vy = -node.vy
                if (node.vy < y0) { node.vy += y0 - node.vy }
                if (node.vy > y1) { node.vy += y1 - node.vy }
            }
        }
    }

    force.initialize = function (_) {
        sizes = (nodes = _).map(size)
    }

    force.bounds = function (_) {
        return (arguments.length ? (bounds = _, force) : bounds)
    }

    force.size = function (_) {
        return (arguments.length
             ? (size = typeof _ === 'function' ? _ : constant(_), force)
             : size)
    }

    return force
}

function bboxCollide (bbox) {

  function x (d) {
    return d.x + d.vx;
  }

  function y (d) {
    return d.y + d.vy;
  }

  function constant (x) {
    return function () {
      return x;
    };
  }

  var nodes,
      boundingBoxes,
      strength = 1,
      iterations = 1;

      if (typeof bbox !== "function") {
        bbox = constant(bbox === null ? [[0,0][1,1]] : bbox)
      }

      function force () {
        var i,
            tree,
            node,
            xi,
            yi,
            bbi,
            nx1,
            ny1,
            nx2,
            ny2

            var cornerNodes = []
            nodes.forEach(function (d, i) {
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + (boundingBoxes[i][1][0] + boundingBoxes[i][0][0]) / 2, y: d.y + (boundingBoxes[i][0][1] + boundingBoxes[i][1][1]) / 2})
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][0][0], y: d.y + boundingBoxes[i][0][1]})
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][0][0], y: d.y + boundingBoxes[i][1][1]})
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][1][0], y: d.y + boundingBoxes[i][0][1]})
              cornerNodes.push({node: d, vx: d.vx, vy: d.vy, x: d.x + boundingBoxes[i][1][0], y: d.y + boundingBoxes[i][1][1]})
            })
            var cn = cornerNodes.length

        for (var k = 0; k < iterations; ++k) {
          tree = d3.quadtree(cornerNodes, x, y).visitAfter(prepareCorners);

          for (i = 0; i < cn; ++i) {
            var nodeI = ~~(i / 5);
            node = nodes[nodeI]
            bbi = boundingBoxes[nodeI]
            xi = node.x + node.vx
            yi = node.y + node.vy
            nx1 = xi + bbi[0][0]
            ny1 = yi + bbi[0][1]
            nx2 = xi + bbi[1][0]
            ny2 = yi + bbi[1][1]
            tree.visit(apply);
          }
        }

        function apply (quad, x0, y0, x1, y1) {
            var data = quad.data
            if (data) {
              var bWidth = bbLength(bbi, 0),
              bHeight = bbLength(bbi, 1);

              if (data.node.index !== nodeI) {
                var dataNode = data.node
                var bbj = boundingBoxes[dataNode.index],
                  dnx1 = dataNode.x + dataNode.vx + bbj[0][0],
                  dny1 = dataNode.y + dataNode.vy + bbj[0][1],
                  dnx2 = dataNode.x + dataNode.vx + bbj[1][0],
                  dny2 = dataNode.y + dataNode.vy + bbj[1][1],
                  dWidth = bbLength(bbj, 0),
                  dHeight = bbLength(bbj, 1)

                if (nx1 <= dnx2 && dnx1 <= nx2 && ny1 <= dny2 && dny1 <= ny2) {

                  var xSize = [Math.min.apply(null, [dnx1, dnx2, nx1, nx2]), Math.max.apply(null, [dnx1, dnx2, nx1, nx2])]
                  var ySize = [Math.min.apply(null, [dny1, dny2, ny1, ny2]), Math.max.apply(null, [dny1, dny2, ny1, ny2])]

                  var xOverlap = bWidth + dWidth - (xSize[1] - xSize[0])
                  var yOverlap = bHeight + dHeight - (ySize[1] - ySize[0])

                  var xBPush = xOverlap * strength * (yOverlap / bHeight)
                  var yBPush = yOverlap * strength * (xOverlap / bWidth)

                  var xDPush = xOverlap * strength * (yOverlap / dHeight)
                  var yDPush = yOverlap * strength * (xOverlap / dWidth)

                  if ((nx1 + nx2) / 2 < (dnx1 + dnx2) / 2) {
                    node.vx -= xBPush
                    dataNode.vx += xDPush
                  }
                  else {
                    node.vx += xBPush
                    dataNode.vx -= xDPush
                  }
                  if ((ny1 + ny2) / 2 < (dny1 + dny2) / 2) {
                    node.vy -= yBPush
                    dataNode.vy += yDPush
                  }
                  else {
                    node.vy += yBPush
                    dataNode.vy -= yDPush
                  }
                }

              }
              return;
            }

            return x0 > nx2 || x1 < nx1 || y0 > ny2 || y1 < ny1;
        }

      }

      function prepareCorners (quad) {

        if (quad.data) {
          return quad.bb = boundingBoxes[quad.data.node.index]
        }
          quad.bb = [[0,0],[0,0]]
          for (var i = 0; i < 4; ++i) {
            if (quad[i] && quad[i].bb[0][0] < quad.bb[0][0]) {
              quad.bb[0][0] = quad[i].bb[0][0]
            }
            if (quad[i] && quad[i].bb[0][1] < quad.bb[0][1]) {
              quad.bb[0][1] = quad[i].bb[0][1]
            }
            if (quad[i] && quad[i].bb[1][0] > quad.bb[1][0]) {
              quad.bb[1][0] = quad[i].bb[1][0]
            }
            if (quad[i] && quad[i].bb[1][1] > quad.bb[1][1]) {
              quad.bb[1][1] = quad[i].bb[1][1]
            }
        }
      }

      function bbLength (bbox, heightWidth) {
        return bbox[1][heightWidth] - bbox[0][heightWidth]
      }

      force.initialize = function (_) {
        var i, n = (nodes = _).length; boundingBoxes = new Array(n);
        for (i = 0; i < n; ++i) boundingBoxes[i] = bbox(nodes[i], i, nodes);
      };

      force.iterations = function (_) {
        return arguments.length ? (iterations = +_, force) : iterations;
      };

      force.strength = function (_) {
        return arguments.length ? (strength = +_, force) : strength;
      };

      force.bbox = function (_) {
        return arguments.length ? (bbox = typeof _ === "function" ? _ : constant(+_), force) : bbox;
      };

      return force;
}

export default { init, resize };
