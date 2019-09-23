const vscode = require('vscode');
const axios = require('axios');
const https = require("https")
const util = require('util');
const { TextDecoder, TextEncoder } = util
const baseUrl = 'https://gupiao.baidu.com/api/rails/stockbasicbatch?stock_code=';
const baseUrlSina ='https://hq.sinajs.cn/list='
let statusBarItems = {};
let stockCodes = {}; 
let inited = false;
// let stockCodes = {
//   code: {
//     assets: 0,
//     count: 10,
//     price: "base_price" ? "close_price" : "base_price",
//     message: {
//       point: -58.2,
//       value: "可能已经购入！"
//     }
//   }
// };

let updateInterval = 10000;
let timer = null;
let inited = false
function activate(context) {
    init();
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(handleConfigChange));
}
exports.activate = activate;

function deactivate() {

}
exports.deactivate = deactivate;
vscode.commands.registerCommand("extension.refresh",()=>{
    console.log("刷新中...");    
    fetchAllData()
})
function init(){
    stockCodes = getStockCodes();
    updateInterval = getUpdateInterval();
    fetchAllData();
    timer = setInterval(fetchAllData, updateInterval);
}

function handleConfigChange(){
    timer && clearInterval(timer);
    const codes = getStockCodes();
    Object.keys(statusBarItems).forEach((item) => {
        if(!codes[item]){
            statusBarItems[item].hide();
            statusBarItems[item].dispose();
            delete statusBarItems[item];
        }
    });
    inited = false;
    init();
}

function getStockCodes() {
    const config = vscode.workspace.getConfiguration();
    const stocks = config.get('stock-watch.stocks');
    let new_stocks = {}
    if (typeof stocks === 'object') {
        (stocks instanceof Array ? stocks : Object.keys(stocks)).forEach(code=>{
            let value = null;
            if (typeof stocks[code] =="object") {
                value = stocks[code]
            }else{
                value = {
                    assets:0,
                    price: parseFloat(stocks[code])||0
                }
            }
            if(!isNaN(parseInt(code[0]))){
                code =  (code[0] === '6' ? 'sh' : 'sz') + code;
            }
            value.count = parseFloat(value.count)
            if (value.count) {
                value.assets = parseFloat(value.price) * value.count
            }
            new_stocks[code] = value
        })
    }
    return new_stocks
}

function getUpdateInterval() {
    const config = vscode.workspace.getConfiguration();
    return config.get('stock-watch.updateInterval');
}

function fetchAllData() {
    let codes = Object.keys(stockCodes).join(',')
    if (!codes) {
        return
    }
    if (inited) {
        fetchAllDataBySina()
        return
    }
    inited = true
    axios.get(`${baseUrl}${codes}`)
        .then((rep) => {
            const result = rep.data;
            if (result.errorNo === 0 && result.data.length) {
                console.log(result.data);
                displayData(result.data);
                fetchAllDataBySina()
            }
        }, (error) => {
            console.error(error);
        }).catch((error) => {
            console.error(error);
        });
}
function fetchAllDataBySina() {
    let codes = Object.keys(stockCodes).join(',')
    if (!codes) {
        return
    }
    axios.get(`${baseUrlSina}${codes}`)
        .then((rep) => {
            // let uint8array = new TextEncoder().encode(rep.data);
            // let  str = new TextDecoder('gbk').decode(uint8array);
            // console.log(str, rep.data);
            let list = rep.data.split(';');
            let result =[]
            list.forEach(v=>{
                let ls = v.split(',')
                if(ls.length>3){
                    let first = ls[0].split(`="`)
                    let o = {
                        exchange:'',
                        stockCode:first[0].replace("var hq_str_",""),
                        stockName:first[1], // gzip 乱码
                        close: parseFloat(ls[3]),
                        netChangeRatio: (parseFloat(ls[3]) - parseFloat(ls[1])) / parseFloat(ls[1])
                    }
                    o.stockCode = o.stockCode.trim()
                   result.push(o)
                }
            })
            displayData(result);
        }, (error) => {
            console.error(error);
        }).catch((error) => {
            console.error(error);
        });
}
function displayData(data) {
    data.map((item) => {
        const key = item.exchange + item.stockCode;
        if (!stockCodes[key]) {
            return
        }
        if (stockCodes[key].name) {
            item.stockName = stockCodes[key].name
        }else{
            stockCodes[key].name = item.stockName
        }
        if (stockCodes[key].price > 0) {
            item.netChangeRatio = (item.close - stockCodes[key].price) / stockCodes[key].price * 100
        }
        if (statusBarItems[key]) {
            statusBarItems[key].text = `「${item.stockName}」${keepTwoDecimal(item.close)} ${item.netChangeRatio > 0 ? '📈' : '📉'} ${keepTwoDecimal(item.netChangeRatio)}%`;
        } else {
            statusBarItems[key] = createStatusBarItem(item);
        }
        if (stockCodes[key].assets > 0) {
            statusBarItems[key].text += ` | ${item.netChangeRatio > 0 ? '👍️' : '👎'} ${keepTwoDecimal(0.01 * item.netChangeRatio * stockCodes[key].assets)}`
            statusBarItems[key].tooltip = `股票代码：${key}\r\n资产：${stockCodes[key].assets}, 买入价：${stockCodes[key].price}\r\n` + (new Date()).toLocaleString()
            statusBarItems[key].color = item.netChangeRatio > 0 ?'#ff9999':'#8f8'
        }
        if (stockCodes[key].message) {
          let hot = Math.abs(stockCodes[key].message.point) - item.close;
          if (
            (hot >= 0) & (stockCodes[key].message.point < 0) ||
            (hot < 0) & (stockCodes[key].message.point > 0)
          ) {
            statusBarItems[key].text += ' 🔔'
          }
        }
    });
}

function createStatusBarItem(item) {
    const message = `「${item.stockName}」${keepTwoDecimal(item.close)} ${item.netChangeRatio > 0 ? '📈' : '📉'} ${keepTwoDecimal(item.netChangeRatio)}%`;
    const barItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    barItem.text = message;
    barItem.show();
    barItem.command = 'extension.refresh'
    return barItem;
}

function keepTwoDecimal(num) {
    var result = parseFloat(num);
    if (isNaN(result)) {
        return '--';
    }
    return result.toFixed(2);
}
