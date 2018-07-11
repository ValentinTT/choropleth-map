document.addEventListener("DOMContentLoaded", () => getData());
const getData = async () => {
  let responeStudies = await fetch(
    "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/for_user_education.json"
  );
  let dataStudies = await responeStudies.json();
  let responseMap = await fetch(
    "https://raw.githubusercontent.com/no-stack-dub-sack/testable-projects-fcc/master/src/data/choropleth_map/counties.json"
  );
  let dataMap = await responseMap.json();
  drawChart(dataStudies, dataMap);
};

const drawChart = (educationStatistics, usaMap) => {
  //Header
  const header = d3.select("body").append("header");
  header
    .append("h1")
    .attr("id", "title")
    .text("United States Educational Attainment");
  header
    .append("h2")
    .attr("id", "description")
    .text(
      "Percentage of adults age 25 and older with a bachelor 's degree or higher (2010-2014)"
    );

  //Main Chart
  const margin = {
      top: 10,
      right: 10,
      bottom: 30,
      left: 10
    },
    width = 960 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  const svg = d3
    .select("body")
    .append("main")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const [minBachelorOrHiger, maxBachelorOrHiger] = [
    ...d3.extent(educationStatistics.map(v => v.bachelorsOrHigher))
  ];
  const colorQuantity = 8;
  const legendCellWidth = 30;
  const legendCellHeight = 10;
  const scaleColors = d3
    .scaleThreshold()
    .domain(
      d3
        .range(colorQuantity)
        .map(
          v =>
            v * ((maxBachelorOrHiger - minBachelorOrHiger) / colorQuantity) +
            minBachelorOrHiger
        )
    )
    .range(d3.schemeOranges[colorQuantity]);
  const scaleX = d3
    .scaleLinear()
    .domain([
      minBachelorOrHiger -
        (maxBachelorOrHiger - minBachelorOrHiger) / colorQuantity,
      maxBachelorOrHiger
    ])
    .range([width - (colorQuantity + 1) * legendCellWidth, width]);

  //A map with all the fips and theirs county values
  let fipsCountiesMap = d3.map();
  educationStatistics.map(v =>
    fipsCountiesMap.set(v.fips, {
      areaName: v.area_name,
      bachelorsOrHigher: v.bachelorsOrHigher,
      state: v.state
    })
  );
  //This draw the map
  const path = d3.geoPath();
  svg
    .append("g")
    .attr("class", "counties")
    .selectAll("path")
    .data(topojson.feature(usaMap, usaMap.objects.counties).features)
    .enter()
    .append("path")
    .classed("county", true)
    .attr("data-fips", d => d.id)
    .attr(
      "data-education",
      d => fipsCountiesMap.get(d.id).bachelorsOrHigher || 0
    )
    .attr("fill", d =>
      scaleColors(fipsCountiesMap.get(d.id).bachelorsOrHigher || 0)
    )
    .attr("d", path)
    .on("mousemove", d => {
      let county = fipsCountiesMap.get(d.id);
      tooltip
        .attr("data-education", county.bachelorsOrHigher || 0)
        .style("left", d3.event.pageX - 50 + "px")
        .style("top", d3.event.pageY - 70 + "px")
        .style("display", "inline-block")
        .html(
          county.areaName +
            " (" +
            county.state +
            ") " +
            county.bachelorsOrHigher +
            "%"
        );
    })
    .on("mouseout", () => tooltip.style("display", "none"));

  //Legend
  const g = svg
    .append("g")
    .attr("id", "legend")
    .attr("transform", "translate(0," + legendCellHeight + ")");
  g.selectAll("rect")
    .data(
      scaleColors.range().map(d => {
        d = scaleColors.invertExtent(d);
        if (d[0] == null) d[0] = scaleX.domain()[0];
        if (d[1] == null) d[1] = scaleX.domain()[1];
        return d;
      })
    )
    .enter()
    .append("rect")
    .attr("height", legendCellHeight)
    .attr("x", d => scaleX(d[0]))
    .attr("width", d => scaleX(d[1]) - scaleX(d[0]))
    .attr("fill", d => scaleColors(d[0]));

  g.call(
    d3
      .axisBottom(scaleX)
      .tickSize(13)
      .tickFormat(function(x, i) {
        return i ? Math.round(x) : Math.round(x) + "%";
      })
      .tickValues(scaleColors.domain())
  )
    .select(".domain")
    .remove();

  //Tooltip
  const tooltip = d3
    .select("body")
    .append("div")
    .attr("id", "tooltip");
};
