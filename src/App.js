import * as React from "react";
import * as d3 from "d3";
import { findDOMNode } from "react-dom";
import { nodes } from "./nodes";
import { edge } from "./edge";
import { UncontrolledReactSVGPanZoom } from "react-svg-pan-zoom";
import "./App.css";

var FORCE = (function (nsp) {
  var width = 1920,
    height = 1600,
    initForce = (nodes, links) => {
      nsp.force = d3
        .forceSimulation(nodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(links).distance(70))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collide", d3.forceCollide([5]).iterations([5]))
        .force("x", d3.forceX())
        .force("y", d3.forceY());
    },
    calcRadius = (id) => {
      const links = edge.map((edge, index) => {
        return {
          id: index,
          source: parseInt(edge.source),
          target: parseInt(edge.target),
          value: parseInt(edge.data["#text"]),
        };
      });
      const filteredLinks = links.filter((link) => link.target === id);
      const targetValues = filteredLinks.map((link) => link.value);
      if (targetValues.length > 0) {
        return targetValues.reduce((sum, x) => sum + x) + 1;
      } else return 10;
    },
    enterNode = (selection) => {
      selection
        .select("circle")
        .style("fill", (d) => d.color)
        .attr("r", (d) => calcRadius(d.id))
        .style("stroke", "black")
        .style("stroke-width", "0.5px");

      selection
        .select("text")
        .style("fill", "black")
        .style("font-weight", "600")
        .style("text-transform", "uppercase")
        .style("text-anchor", "middle")
        .style("alignment-baseline", "middle")
        .style("font-size", (d) => Math.sqrt(calcRadius(d.id)))
        .style("font-family", "cursive");
    },
    updateNode = (selection) => {
      selection
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
        .attr("cx", function (d) {
          return d.x;
        })
        .attr("cy", function (d) {
          return d.y;
        });
    },
    enterLink = (selection) => {
      selection
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", (d) => Math.sqrt(d.value));
    },
    updateLink = (selection) => {
      selection
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y);
    },
    updateGraph = (selection) => {
      selection.selectAll(".node").call(updateNode);
      selection.selectAll(".link").call(updateLink);
    },
    dragStarted = (d) => {
      if (!d3.event.active) nsp.force.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    },
    dragging = (d) => {
      d.fx = d3.event.x;
      d.fy = d3.event.y;
    },
    dragEnded = (d) => {
      if (!d3.event.active) nsp.force.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    },
    drag = () =>
      d3
        .selectAll("g.node")
        .call(
          d3
            .drag()
            .on("start", dragStarted)
            .on("drag", dragging)
            .on("end", dragEnded)
        ),
    tick = (that) => {
      that.d3Graph = d3.select(findDOMNode(that));
      nsp.force.on("tick", () => {
        that.d3Graph.call(updateGraph);
      });
    };

  nsp.width = width;
  nsp.height = height;
  nsp.enterNode = enterNode;
  nsp.updateNode = updateNode;
  nsp.enterLink = enterLink;
  nsp.updateLink = updateLink;
  nsp.updateGraph = updateGraph;
  nsp.initForce = initForce;
  nsp.dragStarted = dragStarted;
  nsp.dragging = dragging;
  nsp.dragEnded = dragEnded;
  nsp.drag = drag;
  nsp.tick = tick;

  return nsp;
})(FORCE || {});

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      search: "",
      name: "",
      nodes: nodes.map((node) => {
        return {
          id: parseInt(node.id),
          name: node.data["#text"],
          color: "tomato",
        };
      }),
      links: edge.map((edge, index) => {
        return {
          id: index,
          source: parseInt(edge.source),
          target: parseInt(edge.target),
          value: parseInt(edge.data["#text"]),
        };
      }),
    };
    this.handleInput = this.handleInput.bind(this);
    this.searchNode = this.searchNode.bind(this);
  }

  componentDidMount() {
    const data = this.state;
    FORCE.initForce(data.nodes, data.links);
    FORCE.tick(this);
    FORCE.drag();
  }

  searchNode() {
    const { search } = this.state;
    const circles = d3.selectAll("circle");
    const circle = circles.filter((circle) => {
      return circle.name === search;
    });
    circle.style("fill", "yellow");
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      prevState.nodes !== this.state.nodes ||
      prevState.links !== this.state.links
    ) {
      const data = this.state;
      FORCE.initForce(data.nodes, data.links);
      FORCE.tick(this);
      FORCE.drag();
    }
  }

  handleInput(event) {
    this.setState({ search: event.target.value });
  }

  render() {
    const links = this.state.links.map((link) => {
      return <Link key={link.id} data={link} />;
    });
    const nodes = this.state.nodes.map((node) => {
      return <Node data={node} name={node.name} key={node.id} />;
    });
    return (
      <div>
        <div className="search-container">
          <input
            type="text"
            onChange={(event) => this.handleInput(event)}
            value={this.state.search}
          ></input>
          <input
            type="button"
            onClick={this.searchNode}
            value="Search for name"
          ></input>
        </div>
        <div className="graph__container">
          <UncontrolledReactSVGPanZoom
            width={FORCE.width}
            height={FORCE.height}
          >
            <svg className="graph" width={FORCE.width} height={FORCE.height}>
              <g> {links} </g> <g> {nodes} </g>
            </svg>
          </UncontrolledReactSVGPanZoom>
        </div>
      </div>
    );
  }
}

class Link extends React.Component {
  componentDidMount() {
    this.d3Link = d3
      .select(findDOMNode(this))
      .datum(this.props.data)
      .call(FORCE.enterLink);
  }

  componentDidUpdate() {
    this.d3Link.datum(this.props.data).call(FORCE.updateLink);
  }

  render() {
    return <line className="link" />;
  }
}

class Node extends React.Component {
  componentDidMount() {
    this.d3Node = d3
      .select(findDOMNode(this))
      .datum(this.props.data)
      .call(FORCE.enterNode);
  }

  componentDidUpdate() {
    this.d3Node.datum(this.props.data).call(FORCE.updateNode);
  }

  render() {
    return (
      <g className="node">
        <circle onClick={this.props.addLink} />
        <text> {this.props.data.name} </text>
      </g>
    );
  }
}

export default App;
