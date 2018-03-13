var cy = null;
var MAGIC_LENS_ENABLED = false;
var BEGIN_MAGIC_LENS = "Begin magic lens mode";
var END_MAGIC_LENS = "End magic lens mode";
var REMOVED_EDGES;
var SELECTED_NODE_IDS = [];

function toggleMagicLensMode() {
    if (MAGIC_LENS_ENABLED) {
        endMagicLensMode();
    } else {
        beginMagicLensMode();
    }
}

function toggleMagicLensHelpText() {
    if ($("#helptext").css("display") === "none") {
        $("#helptext").css("display", "block");
    } else {
        $("#helptext").css("display", "none");
    }
}

function beginMagicLensMode() {
    REMOVED_EDGES = cy.remove("edge");
    SELECTED_NODE_IDS = [];
    cy.nodes(":selected").unselect();
    // Set bindings
    cy.on('select', 'node',
        function(n) {
            var x = n.target;
            SELECTED_NODE_IDS.push(x.id());
            var xEdges = x.data("connectedEdges");
            xEdges.restore();
        }
    );
    cy.on('unselect', 'node',
        function(n) {
            // Remove n's edges
            var x = n.target;
            console.log('rming' + x.id());
            SELECTED_NODE_IDS = SELECTED_NODE_IDS.filter(id => id !== x.id());
            var xEdges = x.data("connectedEdges");
            var edgesToRemove = cy.collection();
            for (var i = 0; i < xEdges.length; i++) {
                var srcID = xEdges[i].source().id();
                var tgtID = xEdges[i].target().id();
                var srcInSelection = SELECTED_NODE_IDS.includes(srcID);
                var tgtInSelection = SELECTED_NODE_IDS.includes(tgtID);
                if (srcInSelection || tgtInSelection) {
                    //if (srcInSelection) {
                    //    console.log("Not removing edge btwn. " + srcID +
                    //            " and " + tgtID + " due to " + srcID +
                    //            " being in selection");
                    //}
                    //if (tgtInSelection) {
                    //    console.log("Not removing edge btwn. " + srcID +
                    //            " and " + tgtID + " due to " + tgtID +
                    //            " being in selection");
                    //}
                    continue;
                } else {
                    //console.log("finna remove edge btwn. " + srcID + " and " +
                    //        tgtID);
                    edgesToRemove = edgesToRemove.add(xEdges[i]);
                }
            }
            REMOVED_EDGES = REMOVED_EDGES.union(cy.remove(edgesToRemove));
        }
    );
    $("#helptogglebutton").css("display", "block");
    document.getElementById("magiclensbutton").innerHTML = END_MAGIC_LENS;
    MAGIC_LENS_ENABLED = true;
}

function endMagicLensMode() {
    // restore all removed edges, remove binding
    SELECTED_NODE_IDS = [];
    REMOVED_EDGES.restore();
    cy.off('select');
    cy.off('unselect');
    $("#helptogglebutton").css("display", "none");
    $("#helptext").css("display", "none");
    document.getElementById("magiclensbutton").innerHTML = BEGIN_MAGIC_LENS;
    MAGIC_LENS_ENABLED = false;
}

function updateNetwork() {
    if (MAGIC_LENS_ENABLED) {
        endMagicLensMode();
    }
    if (cy !== null) {
        cy.destroy();
    }
    var networkName = document.getElementById("networkselector").value;
    fetch("data/" + networkName + ".json")
        .then(function(response) {
            if (response.ok) {
                return response.json();
            }
            throw new Error("Couldn't fetch JSON network data file.");
        })
        .then(function(elejson) {
            cy = cytoscape({
                container: document.getElementById("cy"),
        
                layout: {
                    name: document.getElementById("layoutselector").value
                },
    
                style: [
                    {
                        selector: 'node',
                        style: {
                            'label': 'data(label)',
                            'text-valign': 'center',
                            // Biomasses in the range [0, 100] are scaled
                            // linearly to fit the range [30, 300]. Extreme
                            // biomasses are assigned the extreme dimension
                            // values (so a biomass of 2000, for example,
                            // would be mapped to a width and height of 300).
                            'width': 'mapData(biomass, 0, 100, 30, 300)',
                            'height': 'mapData(biomass, 0, 100, 30, 300)'
                        }
                    },
                    {
                        selector: 'node:selected',
                        style: {
                            // Darken the color of selected nodes. This allows
                            // us to have a distinct "style" for node selection
                            // while retaining custom node colors.
                            'background-blacken': 0.5
                        }
                    },
                    {
                        selector: 'node[cmp=1]',
                        style: {
                            'background-color': '#0A0'
                        }
                    },
                    {
                        selector: 'node[cmp=2]',
                        style: {
                            // "tan" X11 color code
                            'background-color': '#D2B48C'
                        }
                    },
                    {
                        selector: 'node[cmp=3]',
                        style: {
                            'background-color': '#0EE'
                        }
                    },
                    {
                        selector: 'node[cmp=4]',
                        style: {
                            'background-color': '#A00'
                        }
                    },
                    {
                        selector: 'node[cmp=5]',
                        style: {
                            'background-color': '#A0A'
                        }
                    },
                    {
                        selector: 'edge',
                        style: {
                            'target-arrow-shape': 'triangle',
                            'target-arrow-color': '#444',
                            'curve-style': 'bezier',
                            'width': 'mapData(weight, 0, 100, 1, 10)'
                        }
                    },
                    {
                        selector: 'edge:selected',
                        style: {
                            // Darken selected edges, to mimic the general
                            // user experience when selecting nodes
                            'target-arrow-color': '#111',
                            'line-color': '#555',
                            'curve-style': 'bezier'
                        }
                    }
                ],
    
                elements: elejson
            });
        })
        .catch(function(err) {
            console.log("Problem loading data: " + err.message);
        })
        .then(function() {
            // construct a mapping of node -> connected edges; this'll help
            // with the magic lens functionality
            var nodes = cy.nodes();
            for (var i = 0; i < nodes.length; i++) {
                var e = nodes[i].connectedEdges();
                nodes[i].data("connectedEdges", e);
            }
            // enable layout/magic lens buttons if they weren't already enabled
            document.getElementById("layoutbutton").disabled = false;
            document.getElementById("magiclensbutton").disabled = false;
        });
}

function updateLayout() {
    // We actually allow the user to update layout in magic lens mode, since
    // that can produce some interesting visualizations
    //if (MAGIC_LENS_ENABLED) {
    //    endMagicLensMode();
    //}
    var layoutstr = document.getElementById("layoutselector").value;
    cy.layout({name: layoutstr}).run();
}
