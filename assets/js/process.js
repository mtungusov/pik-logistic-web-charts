'use strict';

let zoneChart = dc.rowChart("#zone-chart");
let groupChart = dc.rowChart("#group-chart");
// let timesChart = dc.barChart("#times-chart");
let timesChart = dc.lineChart("#times-chart");
// var timeInZonesChart = dc.barChart("#time-in-zones-chart");
let timeInZonesChart = dc.compositeChart("#time-in-zones-chart");

let chartColors = ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3", "#fdb462", "#b3de69", "#fccde5", "#d9d9d9", "#bc80bd", "#ccebc5", "#ffed6f", "#66c2a5", "#fc8d62", "#8da0cb", "#e78ac3", "#a6d854", "#ffd92f", "#e5c494", "#b3b3b3", "#e41a1c", "#377eb8", "#4daf4a", "#984ea3", "#ff7f00", "#ffff33", "#a65628", "#f781bf", "#999999", "#b3e2cd", "#fdcdac", "#cbd5e8", "#f4cae4", "#e6f5c9", "#fff2ae", "#f1e2cc", "#cccccc", "#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6", "#ffffcc", "#e5d8bd", "#fddaec", "#f2f2f2"];

function roundToTwo(num) {
  return +(Math.round(num + "e+2")  + "e-2");
}

function pad(i) {
  return ("0" + i).substr(-2)
}

function minutesToString(m) {
  if (m < 1) {
    return '.' + pad(Math.floor(m * 60))
  } else {
    const oneD = 24 * 60
    const oneH = 60
    let _m = Math.round(m)
    let days = Math.floor(_m/oneD)
    let hours = Math.floor((_m % oneD)/oneH)
    let minutes = pad((_m % oneD) % oneH)
    let result = hours > 0 ? pad(hours) + ':' + minutes : '00:' + minutes
    return days > 0 ? pad(days) + 'д.' + result : result
  }
}

function formatDate(date) {
  let y = pad(date.getFullYear())
  let m = pad(date.getMonth() + 1)
  let d =pad(date.getDate())
  return d + '/' + m + '/' + y
}

// function getKeys(gr) {
//   gr.forEach(g)
// }

d3.tsv('./2017_09.tsv',
  function (d) {
    let dateFormat = d3.time.format('%Y-%m-%d')

    return {
      in_date: dateFormat.parse(d.in_date),
      zone_label: d.zone_label,
      group_title: d.group_title,
      tracker_id: d.tracker_id,
      total_duration_in_sec: +d.total_duration_in_sec,
      total_duration_in_min: roundToTwo(+d.total_duration_in_sec / 60)
    }
  },
  function (err, rows) {
    if (err) throw err;

    var ndx = crossfilter(rows);
    var all = ndx.groupAll();

    var dateDim = ndx.dimension(d => {
      return d.in_date
    });
    var zoneDim = ndx.dimension(d => {
      return d.zone_label
    });
    var groupDim = ndx.dimension(d => {
      return d.group_title
    });

    var zoneGroup = zoneDim.group();
    var groupGroup = groupDim.group();

    var timesGroup = dateDim.group().reduceSum(dc.pluck("total_duration_in_min"));
    var minDate = dateDim.bottom(1)[0].in_date;
    var maxDate = dateDim.top(1)[0].in_date;

    // let zone0_key = zoneGroup.all()[0].key;
    // let zone1_key = zoneGroup.all()[1].key;
    // let zone2_key = zoneGroup.all()[2].key;
    // let zone3_key = zoneGroup.all()[3].key;
    // let zone4_key = zoneGroup.all()[4].key;
    
    let zone_keys = zoneGroup.all().map(function (k) {
      return k.key
    });
    
    let zones = zone_keys.map(function (k) {
      return dateDim.group().reduceSum(function (d) {
        let res = d.zone_label == k ? d.total_duration_in_min : 0
        return res
      })
    });
    
    zoneChart
      .height(400)
      .margins({top: 10, right: 0, bottom: 20, left: 5})
      .dimension(zoneDim)
      .group(zoneGroup)
      .elasticX(true)
      .ordinalColors(chartColors)
      .colors(function (d){ return chartColors[zone_keys.indexOf(d)] })
      .xAxis().ticks(0)

    groupChart
      .height(400)
      .margins({top: 10, right: 0, bottom: 20, left: 5})
      .dimension(groupDim)
      .group(groupGroup)
      .elasticX(true)
      .xAxis().ticks(0)

    // timesChart
    //   .height(150)
    //   .width(900)
    //   .margins({top: 10, right: 20, bottom: 20, left: 65})
    //   .dimension(dateDim)
    //   .group(timesGroup)
    //   .centerBar(true)
    //   .x(d3.time.scale().domain([minDate, maxDate]))
    //   .renderHorizontalGridLines(true)
    //   .elasticY(true)
    //   .yAxis().ticks(3)
    
    timesChart
      .height(150)
      .width(900)
      .margins({top: 20, right: 20, bottom: 20, left: 65})
      .dimension(dateDim)
      .group(timesGroup)
      .x(d3.time.scale().domain([minDate, maxDate]))
      .renderHorizontalGridLines(true)
      .elasticY(true)
      .yAxis().ticks(3)
    
    timesChart.xAxis().tickFormat(function (v) {
      return formatDate(v)
    })
  
    timesChart.yAxis().tickFormat(function (v) {
      return minutesToString(v)
    })
    
    // let timeZonesBarCharts = zone_keys.map(function (z, i) {
    //   return dc.barChart(timeInZonesChart)
    //     .group(zones[i], z)
    //     .centerBar(true)
    //     .colors(chartColors[i])
    //     .gap(1)
    // })
    
    let timeZonesLineCharts = zone_keys.map(function (z, i) {
      return dc.lineChart(timeInZonesChart)
        .group(zones[i], z)
        .colors(chartColors[i])
    })
    
    timeInZonesChart
      .height(600)
      .width(900)
      .margins({top: 20, right: 20, bottom: 100, left: 65})
      .dimension(dateDim)
      .rangeChart(timesChart)
      .brushOn(false)
      .compose(timeZonesLineCharts)
      // .compose([timeLineChart0, timeLineChart1, timeLineChart2, timeLineChart3])
      // .shareColors(true)
      // .group(zones[0], zone_keys[0])
      // .stack(zones[1], zone_keys[1])
      // .stack(zones[2], zone_keys[2])
      // .stack(zones[3], zone_keys[3])
      .x(d3.time.scale().domain([minDate, maxDate]))
      .renderHorizontalGridLines(true)
      .elasticY(true)
      .legend(dc.legend().x(70).y(20).itemHeight(13).gap(2))
      .yAxis().ticks(6)
  
    timeInZonesChart.xAxis().tickFormat(function (v) {
      return formatDate(v)
    })

    timeInZonesChart.yAxis().tickFormat(function (v) {
      return minutesToString(v)
    })
    
    // timeInZonesChart
    //   .on('renderlet', function(chart){
    //     zone_keys.forEach(function (_, i) {
    //       chart.selectAll('g._' + i).attr("transform", "translate(" + i + ", 0)")
    //     })
    //   })
    
    dc.renderAll();

    // console.log(zones[0]);
  }
)
