var chart = LightweightCharts.createChart(document.getElementById('dex-chart'), {
    theme: 'light',
    crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
    },
});
chart.applyOptions({
    grid: {
        vertLines: {
            color: 'rgba(150, 150, 150, 0.2)', 
            style: 2, 
        },
        horzLines: {
            color: 'rgba(150, 150, 150, 0.4)', 
            style: 2, 
        },
    },
});
var candleSeries = chart.addCandlestickSeries(
    {
        upColor: 'rgb(46, 122, 255)', downColor: 'rgb(223, 186, 0)', borderVisible: false,
        wickUpColor: 'rgb(46, 122, 255)', wickDownColor: 'rgb(223, 186, 0)',
        priceFormat: {
            type: 'price',
            precision: 5,
            minMove: 0.00001
        },
    });
async function updateChart() {
    const data = await updateChartData()
    candleSeries.setData(data);

}
$(document).ready(async function () {
    await new Promise(r => setTimeout(r, 2000));
    updateChart();
    setInterval(updateChart, 7000);
});
