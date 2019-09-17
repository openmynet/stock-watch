# stock-watch
Watching your stocks when you are coding. 
VScode插件 | A股 | 实时股票数据
好好工作，股票涨停！
GitHub: https://github.com/TDGarden/stock-watch 欢迎PR、star

## Configuration
修改用户配置，添加你所需要监控的股票代码
```
  // 配置需要监控的股票代码
  // 可根据沪市深市分别加上sh、sz前缀，亦可不加
  // 不加前缀的情况下，6开头的代码默认加上sh，其余加上sz
  // 需要查看上证指数，代码为sh000001
  // A.
  "stock-watch.stocks": [
    "000001"
  ],
  // B. 或者
  "stock-watch.stocks": {
    "000001":{
      "price": 0 // 不购买，只看
    }
  },
  // C. 或者
  "stock-watch.stocks": {
    "000001":{
      "price": 10, // 购入价格
      "count": 1000 // 购入数量
    }
  },
  // D. 或者
  "stock-watch.stocks": {
    "000001":{
      "price": 10, // 购入价格
      "assets": 10000 // 购入的总价
    }
  },
  // A == B
  // C == D
  // 或者
  "stock-watch.stocks": {
    "000001":{
      "price": 10,  // 购入价格
      "count": 1000, // 购入数量
      "message":{
        "point": -9, // 警戒点股价 Math.abs(point)，股价跌到了地板
        "desc":"point > 0 ? 涨:跌",
        "text":"大跌眼镜，赶紧跑路吧" // 提示信息
      }
    }
  },
    "stock-watch.stocks": {
    "000001":{
      "price": 10, // 购入价格
      "count": 1000, // 购入数量
      "message":{
        "point": 11, // 警戒点股价 Math.abs(point)，股价跌到了地板
        "desc":"point > 0 ? 涨:跌",
        "text":"涨停了，庆祝吧" // 提示信息
      }
    }
  },
  // 配置轮询请求最新数据的时间间隔
  "stock-watch.updateInterval": 10000
```
---
干净的配置模版
```json
  "stock-watch.stocks": {
    "000001":{
      "price": 10,
      "count": 1000,
      "message":{
        "point": 11, 
        "text":"涨停了，庆祝吧"
      }
    }
  },
  "stock-watch.updateInterval": 10000
```
