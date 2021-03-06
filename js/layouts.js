function layouts() {

    this.init = init;
    this.do_chord = do_chord;
    this.do_component = do_component;
    //this.component_labels = [];

    var component_labels = [];

    var width = 1200;
    var height = 900;

    // initialise svg with chord diagram
    function init() {
	// Event handlers
	window.addEventListener("popstate", function(event) {
	    console.log("** window.onpopstate event handler called: state is " +
			this.currentState);
	    if (this.currentState != "chord") {
		console.log("*** switching layout");
		do_chord();
	    }
	});
	console.log("** setting window.onpopstate event handler: state is " +
		    this.currentState);

	// Initial layout
	do_chord();
    }

    function component_index_to_filename(labels, i) {
	if (i >= labels.length / 2) {
	    return { "none" : true };
	} else {
            var label = labels[i];
            var filename =
		"data/" +
		label.toLowerCase().replace(" ", "_").replace("/", "_") +
		".json";
            return { "some" : filename };
	}
    }

    // Draw the chord diagram after parsing data
    function do_chord() {
	console.log(" * do_chord");

	hide_tooltip();

	d3.csv("data/components.csv", function(data) {
	    console.log(" * do_chord inside csv callback");
	    var component_matrix = []
	    //var component_labels = []
	    //this.component_labels = []
	    component_labels = []

	    currentState = "chord";

	    // extract labels from csv
	    for (var l in data[0]) {
		//this.component_labels.push(l);
		component_labels.push(l);
	    }

	    // parse component matrix
	    component_matrix = data.map(function(d) {
		var array = [];
		for (var e in d) {
		    array.push(parseInt(d[e]));
		}
		return array;
	    })

	    var chord = d3.layout.chord()
		.padding(.05)
		.sortSubgroups(d3.descending)
		.matrix(component_matrix);

	    // var width = 1200;
	    // var height = 900;
	    var innerRadius = Math.min(width, height) * .25;
	    var outerRadius = innerRadius * 1.1;

	    var fill = d3.scale.category20()

	    // Is there a better way to do this than removing svg?
	    $('svg').remove();

	    this.svg = d3.select("body").append("svg")
		.attr("width", width)
		.attr("height", height)
		.append("g")
		.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	    svg.append("g").selectAll("path")
		.data(chord.groups)
		.enter().append("path")
		.style("fill", function(d) { return fill(d.index); })
		.style("stroke", function(d) { return fill(d.index); })
		.attr("d", d3.svg.arc().innerRadius(innerRadius)
		      .outerRadius(outerRadius))

	        // tooltips
		.on("mouseover", function(d,i) {
		    //show_tooltip(labels[i] + ": " + Math.round(d.value));
		    fade(.1)(d,i);
		})
		.on("mouseout", function(d,i) {
		    //hide_tooltip();
		    fade(1)(d,i)
		})

		.on("click", function(d) {
		    console.log("** window.history.pushState()");
		    window.history.pushState({page: 2}, "Component");
		    console.log("** d.index: " + d.index);
		    var filename = component_index_to_filename(component_labels, d.index);
		    console.log("** filename: " + filename.some);
		    if (filename.some) {
			do_component(filename.some);
		    }
		});

	    var ticks = svg.append("g").selectAll("g")
		.data(chord.groups)
		.enter().append("g").selectAll("g")
		//.data(groupTicks(this.component_labels))
		.data(groupTicks(component_labels))
		.enter().append("g")
		.attr("transform", function(d) {
		    return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
			+ "translate(" + outerRadius + ",0)";
		});

	    ticks.append("line")
		.attr("x1", 1)
		.attr("y1", 0)
		.attr("x2", 5)
		.attr("y2", 0)
		.style("stroke", "#000");

	    ticks.append("text")
		.attr("x", 8)
		.attr("dy", ".35em")
		.attr("transform", function(d) {
		    return d.angle > Math.PI ? "rotate(180)translate(-16)" : null;
		})
		.style("text-anchor", function(d) {
		    return d.angle > Math.PI ? "end" : null; })
		.text(function(d) { return d.label; });

	    svg.append("g")
		.attr("class", "chord")
		.selectAll("path")
		.data(chord.chords)
		.enter().append("path")
		.attr("d", d3.svg.chord().radius(innerRadius))
		.style("fill", function(d) { return fill(d.target.index); })
		.style("opacity", 1);
	});
    }


    // Returns an event handler for fading a given chord group.
    function fade(opacity) {
	return function(g, i) {
	    svg.selectAll(".chord path")
		.filter(function(d) { return d.source.index != i && d.target.index != i; })
		.transition()
		.style("opacity", opacity);
	};
    }

    // Returns an array of tick angles and labels, given a group.
    function groupTicks(labels) {
	return function(d) {
	    var k = (d.endAngle - d.startAngle)
	    return [ {
		angle: k * .5 + d.startAngle,
		label: labels[d.index]
	    } ] ;
	};
    }

    function do_component(filename) {
	hide_tooltip();

	var radius = Math.min(width, height) / 2 - 150;
	var color = d3.scale.category20c();

	currentState = "sunburst";

	$('svg').remove();

	svg = d3.select("body").append("svg")
	    .attr("width", width)
	    .attr("height", height)
	    .append("g")
	    .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");

	var partition = d3.layout.partition()
	    .sort(null)
	    .size([2 * Math.PI, radius * radius])
	    .value(function(d) { return d.size; }); // was return 1;

	var arc = d3.svg.arc()
	    .startAngle(function(d) { return d.x; })
	    .endAngle(function(d) { return d.x + d.dx; })
	    .innerRadius(function(d) { return Math.sqrt(d.y); })
	    .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

	//var filename = "data/" + cname + ".json";

	//d3.json("data/chilled_beams.json", function(error, root) {
	d3.json(filename, function(error, root) {
	    // Show name in middle of sunburst. We could make this look better.
	    svg.append("text")
		.attr("text-anchor", "middle")
		.attr("class", "component")
		.text(function(d){ return root.name; })
		.on("click", function() {
		    console.log("** window.history.pushState()");
		    do_chord();
		});

	    var path = svg.datum(root).selectAll("path")
		.data(partition.nodes)
		.enter().append("path")
		.on("click", function() {
		    console.log("** window.history.pushState()");
		    do_chord();
		})

	    // tooltips
		.on("mouseover", function(d) {
		    var value = Math.round(d.value * 10) / 10;
		    show_tooltip(d.name + ": " + value);
		})
		.on("mouseout", function() { hide_tooltip(); })

		.attr("display", function(d) {
		    return d.depth ? null : "none"; }) // hide inner ring
		.attr("d", arc)
		.style("stroke", "#fff")
		.style("fill", function(d) {
		    return color((d.children ? d : d.parent).name); })
		.style("fill-rule", "evenodd")
	    // .append("title")
	    // .text(function(d) { return d.name; })
		.each(stash);

	    d3.selectAll("input").on("change", function change() {
		var value = this.value === "count"
		    ? function() { return 1; }
		: function(d) { return d.size; };

		path
		    .data(partition.value(value).nodes)
		    .transition()
		    .duration(1500)
		    .attrTween("d", arcTween);
	    });
	});

	// Stash the old values for transition.
	function stash(d) {
	    d.x0 = d.x;
	    d.dx0 = d.dx;
	}

	// Interpolate the arcs in data space.
	function arcTween(a) {
	    var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
	    return function(t) {
		var b = i(t);
		a.x0 = b.x;
		a.dx0 = b.dx;
		return arc(b);
	    };
	}

	d3.select(self.frameElement).style("height", height + "px");
    }

    function hide_tooltip() {
	// Hide the tooltip, in case it's still displayed
	d3.select("#tooltip").classed("hidden", true);
    }

    function show_tooltip(t) {
	// Get location -- needs updating!
	// var xPosition = parseFloat(d3.select(this).attr("x")) + xScale.rangeBand() / 2;
	// var yPosition = parseFloat(d3.select(this).attr("y")) / 2 + h / 2;
	var xPosition = 150;
	var yPosition = 150;

	//Update the tooltip position and value
	d3.select("#tooltip")
	    .style("left", xPosition + "px")
	    .style("top", yPosition + "px")
	    .select("#value")
	    .text(t);

	//Show the tooltip
	d3.select("#tooltip").classed("hidden", false);
    }
}

var l = new layouts();

l.init();


/* Local Variables: */
/* indent-tabs-mode: nil */
/* End: */
