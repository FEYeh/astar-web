import React from "react";
import AStarCore from "astar-core";
import {
  Button,
  Card,
  Select,
  PageHeader,
  Form,
  Row,
  Col,
  Tooltip,
  Radio,
  Icon,
  Divider,
  Alert,
  Slider,
  message
} from "antd";

import "./App.css";

const { AStar, Graph } = AStarCore;
const WALL = 0;
const ROAD = 1;
const FORM_ITEM_LAYOUT = {
  labelCol: { span: 10 },
  wrapperCol: { span: 14 }
};
const GRID_SIZE = {
  width: 650,
  height: 650
};
const MAX_FREQUENCY = 4;
const MAX_GRID_SIZE = 8;
const generateArray = num => Array.from(new Array(num).keys());
const isNodeEqual = (n1, n2) => n1 && n2 && n1.x === n2.x && n1.y === n2.y;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      wallFrequency: 0.1,
      gridSize: 10,
      diagonal: false,
      closest: false,
      showSearchInfo: false,
      graph: null,
      start: null,
      end: null,
      speed: 1000,
    };
    this.generateWallFrequencies();
    this.generateGraphSizes();
  }

  componentDidMount() {
    let options = {};
    try {
      options = JSON.parse(localStorage.getItem('options') || '{}');
    } catch (e) {
      console.error(e);
    }
    this.props.form.setFieldsValue(options);
    this.setState({
      wallFrequency: options.wallFrequency || 0.1,
      gridSize: options.gridSize || 10,
      diagonal: options.diagonal || false,
      closest: options.closest || false,
      showSearchInfo: options.showSearchInfo || false,
    }, this.initialize);
  }

  initialize() {
    const { gridSize, wallFrequency, diagonal } = this.state;
    const nodes = [];
    for (let x = 0; x < gridSize; x++) {
      const nodeRow = [];
      for (let y = 0; y < gridSize; y++) {
        const isWall = Math.floor(Math.random() * (1 / wallFrequency));
        if (isWall === WALL) {
          nodeRow.push(WALL);
        } else {
          nodeRow.push(ROAD);
        }
      }
      nodes.push(nodeRow);
    }
    const graph = new Graph(nodes, { diagonal });
    
    this.setState({
      graph,
      start: null,
      end: null,
    });
  }

  generateWallFrequencies() {
    this.wallFrequencies = generateArray(MAX_FREQUENCY).map((_, idx) => {
      const num = (idx + 1) * 10;
      const value = `${num}%`;
      return {
        key: num / 100,
        value
      };
    });
  }

  generateGraphSizes() {
    this.graphsizes = generateArray(MAX_GRID_SIZE).map((_, idx) => {
      const num = (idx + 1) * 4;
      const value = `${num} x ${num}`;
      return {
        key: num,
        value
      };
    });
  }

  clearActive() {
    this.walking = false;
    const { graph } = this.state;
    graph.grid.forEach(row => {
      row.forEach(node => {
        node.pathActive = false;
        node.currentActive = false;
        node.visited = false;
        node.currentNeighbor = false;
      });
    });
  }

  startSearch = () => {
    const { graph, start, end, closest } = this.state;
    const result = AStar.search(graph, start, end, { closest });
    const { path, currentNodes, neighborNodes } = result;
    console.log('path', result, path, currentNodes, neighborNodes);
    const currentNodesLength = Object.keys(currentNodes).length;
    if (currentNodesLength === 1) {
      message.destroy();
      message.info('就一步还走个啥，请把终点设置远一点哈');
    } else {
      this.animateCurrentNodes(path, currentNodes, neighborNodes, 0);
    }
  }

  animateCurrentNodes = (path, currentNodes, neighborNodes, idx) => {
    const { graph, speed, start } = this.state;
    if (this.walking) {
      return;
    }
    console.log('currentNodes1', this.walking, idx);
    const currentNodesLength = Object.keys(currentNodes).length;
    if (currentNodes && currentNodesLength) {
      if (idx < currentNodesLength) {
        console.log('currentNodes 2', currentNodes[idx], idx);
        const currentNeighborNodes = neighborNodes[idx];
        this.walking = true;
        graph.grid.forEach(row => {
          row.forEach(node => {
            const isStartNode = isNodeEqual(node, start);
            if (isNodeEqual(currentNodes[idx], node) && !isStartNode) {
              node.currentActive = true;
            }
            Object.keys(currentNeighborNodes).forEach(key => {
              if (isNodeEqual(neighborNodes[idx][key], node)) {
                node.currentNeighbor = true;
              }
            })
          });
        });
        setTimeout(() => {
          this.setState({ graph }, () => {
            this.walking = false;
            this.animateCurrentNodes(path, currentNodes, neighborNodes, idx + 1);
          });
        }, speed);
      } else {
        this.walking = false;
        if (!path || !path.length) {
          message.destroy();
          message.info('😭被墙了/(ㄒoㄒ)/~~，无路可走~~');
        } else {
          this.animatePath(path, 0);
        }
        
      }
    } else {
      this.walking = false;
    }
    // if (path && path.length && idx < path.length) {
    //   this.walking = true;
    //   graph.grid.forEach(row => {
    //     row.forEach(node => {
    //       if (isNodeEqual(path[idx], node)) {
    //         node.active = true;
    //       }
    //     });
    //   });
    //   setTimeout(() => {
    //     this.setState({ graph }, () => {
    //       this.walking = false;
    //       this.animatePath(path, idx + 1);
    //     });
    //   }, 1000 / gridSize);
    // } else {
    //   this.walking = false;
    // }
  }

  animatePath = (path, idx) => {
    const { graph, speed } = this.state;
    if (this.walking) {
      return;
    }
    if (idx < path.length) {
      this.walking = true;
      graph.grid.forEach(row => {
        row.forEach(node => {
          if (isNodeEqual(path[idx], node)) {
            node.pathActive = true;
          }
        });
      });
      setTimeout(() => {
        this.setState({ graph }, () => {
          this.walking = false;
          this.animatePath(path, idx + 1);
        });
      }, speed);
    } else {
      this.walking = false;
    }
  }

  handleSliderChange = (value) => {
    this.setState({
      speed: 1000 / value,
    })
  }

  handleSubmit = e => {
    console.log("生成地图");
    e.preventDefault();
    if (this.walking) {
      message.destroy();
      message.info('在走着呢，待会再点击哈~~O(∩_∩)O');
      return;
    }
    this.props.form.validateFields((err, values) => {
      if (!err) {
        console.log("values -> ", values);
        const options = {
          wallFrequency: values.wallFrequency || 0.1,
          gridSize: values.gridSize || 10,
          diagonal: values.diagonal || false,
          closest: values.closest || false,
          showSearchInfo: values.showSearchInfo || false,
        }
        localStorage.setItem('options', JSON.stringify(options));
        this.setState(
          {
            ...values
          },
          this.initialize
        );
      }
    });
  };

  handleCellClick = (node) => () => {
    if (this.walking) {
      message.destroy();
      message.info('在走着呢，待会再点击哈~~O(∩_∩)O');
      return;
    }
    console.log('handleCellClick', node);
    const { start, end } = this.state;
    // 如果是墙，则结束
    if (node.weight === WALL) {
      return;
    }
    // 如果开始和结束节点都没设置，先设置开始节点
    if (!start && !end) {
      this.setState({
        start: node
      });
      return;
    }
    if (!end && !isNodeEqual(node, start)) {
      this.setState({
        end: node
      }, this.startSearch);
      return;
    }
    // 如果开始和结束节点都设置了，删除结束节点，设置开始节点
    if (start && end) {
      this.clearActive();
      this.setState({
        start: node,
        end: null,
      });
      return;
    }
  }

  renderMapGraphCell(node, idx) {
    const { gridSize, start, end, showSearchInfo, diagonal } = this.state;
    const cellStyle = {
      width: (GRID_SIZE.width / gridSize),
      height: (GRID_SIZE.height / gridSize),
    }
    const isWallNode = node.weight === WALL;
    const isStartNode = isNodeEqual(node, start);
    const isEndNode = isNodeEqual(node, end);
    const isCurrentActiveNode = node.currentActive;
    const isPathActiveNode = node.pathActive;
    const className = `grid_item${isWallNode ? ' wall' : ''}${isStartNode ? ' start' : ''}${isEndNode ? ' end' : ''}${isCurrentActiveNode && !isEndNode ? ' current_active' : ''}${isPathActiveNode && !isEndNode ? ' path_active' : ''}`;
    return (
      <span key={idx} className={className} style={cellStyle} onClick={this.handleCellClick(node)}>
        {
          node.currentNeighbor && showSearchInfo && gridSize < 13 && node.weight !== WALL && !isStartNode && !isEndNode
            ? (
              <span>
                <span className={`search_info${diagonal ? ' diagonal' : ''} f`}>f:{diagonal ? Number(node.f).toFixed(1) : node.f}</span>
                <span className={`search_info${diagonal ? ' diagonal' : ''} g`}>g:{diagonal ? Number(node.g).toFixed(1) : node.g}</span>
                <span className={`search_info${diagonal ? ' diagonal' : ''} h`}>h:{diagonal ? Number(node.h).toFixed(1) : node.h}</span>
                <span className="search_info point">{`(${node.x}, ${node.y})`}</span>
              </span>
            )
            : null
        }
      </span>
    )
  }

  renderMapGraphRow(rowData) {
    return rowData.map((c, idx) => this.renderMapGraphCell(c, idx));
  }

  renderMapGraph() {
    const { graph } = this.state;
    if (!graph) {
      return null;
    }
    return graph.grid.map((r, idx) => {
      return (
        <div key={idx}>
          {this.renderMapGraphRow(r)}
        </div>
      )
    })
  }

  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <div className="App">
        <PageHeader title="AStar">
          <Card title="参数设置">
            <Form onSubmit={this.handleSubmit}>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="墙存在的频率" {...FORM_ITEM_LAYOUT}>
                    {getFieldDecorator("wallFrequency", {
                      initialValue: this.wallFrequencies[0].key
                    })(
                      <Select style={{ width: 120 }}>
                        {this.wallFrequencies.map(item => (
                          <Select.Option key={item.key} value={item.key}>
                            {item.value}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                  <Form.Item label="地图大小" {...FORM_ITEM_LAYOUT}>
                    {getFieldDecorator("gridSize", {
                      initialValue: this.graphsizes[0].key
                    })(
                      <Select style={{ width: 120 }}>
                        {this.graphsizes.map(item => (
                          <Select.Option key={item.key} value={item.key}>
                            {item.value}
                          </Select.Option>
                        ))}
                      </Select>
                    )}
                  </Form.Item>
                  <Form.Item label="动画速度" {...FORM_ITEM_LAYOUT}>
                    <Slider
                      defaultValue={1}
                      max={5}
                      min={1}
                      onChange={this.handleSliderChange}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label={(
                    <span>
                      <Tooltip title="当地图大于12 x 12，则不显示搜索信息">
                        <Icon type="question-circle" />
                      </Tooltip>
                      <span> 搜索信息</span>
                    </span>
                  )} {...FORM_ITEM_LAYOUT}>
                    {getFieldDecorator("showSearchInfo", {
                      initialValue: false
                    })(
                      <Radio.Group>
                        <Radio value={true}>显示</Radio>
                        <Radio value={false}>隐藏</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                  <Form.Item label="对角移动" {...FORM_ITEM_LAYOUT}>
                    {getFieldDecorator("diagonal", {
                      initialValue: false
                    })(
                      <Radio.Group>
                        <Radio value={true}>允许</Radio>
                        <Radio value={false}>禁止</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        <Tooltip title="当终点不可达时是否展示距离最近的节点">
                          <Icon type="question-circle" />
                        </Tooltip>
                        <span> 最近节点</span>
                      </span>
                    }
                    {...FORM_ITEM_LAYOUT}
                  >
                    {getFieldDecorator("closest", {
                      initialValue: false
                    })(
                      <Radio.Group>
                        <Radio value={true}>显示</Radio>
                        <Radio value={false}>隐藏</Radio>
                      </Radio.Group>
                    )}
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  生成地图
                </Button>
                <Alert message="修改配置后请点击【生成地图】重新生成新的地图" banner closable />
              </Form.Item>
            </Form>
          </Card>
          <Divider />
          <Card title="地图">
            <div className="search_grid">{this.renderMapGraph()}</div>
          </Card>
        </PageHeader>
      </div>
    );
  }
}
const WrappedAppForm = Form.create({ name: "App" })(App);

export default WrappedAppForm;
