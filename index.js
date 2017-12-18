"use strict";

// Init CoinMarketCap Api
var capapi = require('coinmarketcap-api');
var apiClient = new capapi();

// Require tab
var table = require('tab');

// Require clear for clearing the terminal every time we get the stocks
var clear = require('clear');

// Require chalk for colouring
var chalk = require('chalk');

// Get the maximum ammount of coins
var screenHeight = process.stdout.rows;
var maxCoins = screenHeight -1;

// Define settings for the main application
var settings = {
    convert: 'EUR', // Main currency to display
    limit: maxCoins, // Change to default value or keep it like this for the height of the console
    time: '1H', // Choose between 1h, 24h, 7d of change time,
    interval: 20000 // 20000 = 20 seconds
};

// Coins of interest
var coi = [
    'Bitcoin',
    'Ethereum',
    'Monero',
    'Electroneum'
];

// Set a interval for gettings the stocks
mainLoop();

setInterval(function () {
    mainLoop();
}, settings.interval);

function mainLoop(){
    apiClient.getTicker(settings).then(
        function(result){
            gatherStocks(result);
        }
    );
}

var prevResult = null;

var lookupArray = [];

function gatherStocks(result) {
    var plotRows = [];
    var isUpdate = false;

    for(var key in result){
        // Get the current stock value
        var stockValue = result[key];

        // Define the vars for the rest of the applications
        var name = stockValue.name;
        var symbol = chalk.grey(stockValue.symbol);
        var rank = stockValue.rank;
        var pricebtc = stockValue.price_btc.substring(0, 8);
        var priceval = stockValue[plotSettings().price].substring(0, 8);
        var updated = '=';
        var change = stockValue[plotSettings().change];

        // Push new id to the lookup table and set the info we want
        lookupArray[stockValue.id] = rank;

        if(prevResult){
            var prevValue = prevResult[key];

            if(stockValue.last_updated !== prevValue.last_updated){
                isUpdate = true;
                if(stockValue.id == prevValue.id){
                    pricebtc = compareResult(pricebtc, prevValue.price_btc.substring(0, 8));
                    priceval = compareResult(priceval, prevValue[plotSettings().price].substring(0, 8));
                    change = compareResult(stockValue[plotSettings().change], prevValue[plotSettings().change]);
                    updated = chalk.red('+');
                } else {
                    rank = compareResult(lookupArray[prevValue.id], lookupArray[stockValue.id]);
                    updated = chalk.blue('?');
                }
            }
        }

        if(coi.indexOf(name) !== -1){
            name = chalk.bgMagenta(name);
        } else {
            name = chalk.grey(name);
        }

        // Filter the vars we want
        var plotValues = [
            name,
            symbol,
            rank,
            String(priceval),
            String(pricebtc),
            updated,
            change
        ];

        plotRows.push(plotValues);
    }

    if(isUpdate || !prevResult){
        clear();
        plotStocks(plotRows);
    }

    prevResult = result;
}

function plotSettings() {
    var currency = settings.convert.toLowerCase();
    var time = settings.time.toLowerCase();

    var properties = {
        price: 'price_' + currency,
        change: 'percent_change_' + time
    };

    return properties;
}

function compareResult(inputOne, inputTwo) {
    var result = null;

    if(inputOne.startsWith('-')){
        inputTwo = [inputOne, inputOne = inputTwo][0]
    }

    if(inputOne == inputTwo){
        result = inputOne;
    } else if(inputOne < inputTwo) {
        result = chalk.bgRed(inputOne + ' ↓');
    } else if(inputOne > inputTwo) {
        result = chalk.bgBlue(inputOne + ' ↑');
    }
    return result;
}

function plotStocks(stocks){

    var rows = stocks;
    var columns = [
        {
            'label': 'name',
            'align': 'right',
            'width': 36
        }, {
            'label': 'symbol',
            'align': 'left',
            'width': 20
        }, {
            'label': 'rank',
            'align': 'left',
            'width': maxCoins.toString().length + 1
        }, {
            'label': 'priceval',
            'align': 'left',
            'width': 10
        }, {
            'label': 'pricebtc',
            'align': 'left',
            'width': 10
        }, {
            'label': 'updated',
            'align': 'left',
            'width': 1
        }, {
            'label': 'change',
            'align': 'left',
            'width': 8
        }
    ];

    table.emitTable({
        'columns': columns,
        'columnSeparator': ' | ',
        'omitHeader': true,
        'rows': rows
    });
}