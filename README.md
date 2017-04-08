# force-layout

### d3js

- v4.7.4
- dispatch [事件调度机制](https://github.com/xswei/d3js_doc/tree/master/API/d3-dispatch-master)


### 方案

- 闭环问题: a-a-a, a-b-a-b-a

### event

- drag
    + start
    + drag
    + end

### svg canvas

- svg 支持事件处理
- [更多区别](http://www.w3school.com.cn/html5/html_5_canvas_vs_svg.asp)


### 使用注意

- 使用数组操作来维护GD_nodes，而非`GD_nodes = new_array`。


### question

- 容器绑定了zoom事件，或circle同时绑定了drag事件，则circle的click事件失效。


### bug

- chrome 上 click 事件触发会出现问题，重启即可。Firefox正常。
    - svg 绑定zoom事件，node绑定drag、click事件。
    - 类似问题 https://github.com/d3/d3-zoom/issues/62


### json 示例

```json
{
    "source": {
        "id": "872570",
        "parent": "",
        "sex": "m",
        "pro": 31,
        "v": 1
    },
    "target": {
        "id": "1541505",
        "parent": "872570",
        "sex": "m",
        "pro": 31,
        "v": 1
    },
    "link": {
        "_lid": "872570_1541505",
        "wbid": "4059263678303661",
        "time": "1483287341",
        "source": "872570",
        "target": "1541505"
    }
}
```
