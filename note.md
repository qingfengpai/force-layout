## 资料


- [Force-Directed Web Worker](https://bl.ocks.org/mbostock/01ab2e85e8727d6529d20391c0fd9a16)

#### 文章

- 使用canvas渲染大量数据，但是不能使用事件。https://bocoup.com/blog/d3js-and-canvas


#### 问答

- [how much can d3 js scale](http://stackoverflow.com/questions/26362757/how-much-can-d3-js-scale)
- [use canvas instead of svg as a default or an option](https://github.com/christophergandrud/networkD3/issues/161)
- [Is there a limit to the number of nodes and links a D3 force layout can have?](https://groups.google.com/forum/#!topic/d3-js/nwf_Jafk_E8)
- [Does D3.js work efficiently on massive amounts of data (200 million rows with at least a dozen columns)?](https://www.quora.com/Does-D3-js-work-efficiently-on-massive-amounts-of-data-200-million-rows-with-at-least-a-dozen-columns)

#### 例子

打开控制面板的话，非常卡顿

- https://linkedjazz.org/network/
    + 548 g > circle
    + 2258 line
- http://fatiherikli.github.io/programming-language-network/
    + 1910 g > cicle
    + 2236 path


#### 测试性能

- 推荐node数：http://bl.ocks.org/mjromper/95fef29a83c43cb116c3
- https://github.com/curran/HTML5Examples/tree/gh-pages/d3/scaleTest


### 注意

-  since you're defining the source and the target by the id of the node, not by its numeric index, you have to specify this id in the id() function:
```js
.force("link", d3.forceLink(links)
     .id(function(d,i) {
         return d.id
     })
    .distance(20)
    .strength(1)
)
```