
// Language support
const labelPing = document.getElementById("labelPing");
const labelDownload = document.getElementById("labelDownload");
const labelUpload = document.getElementById("labelUpload");
const btnText = document.getElementById("btnText");
const icon = document.querySelector(".icon");
const langSelect = document.getElementById("langSelect");

const translations = {
  en: { start: "Start", ping:"Ping", download:"Download", upload:"Upload" },
  ar: { start: "بدء الاختبار", ping:"استجابة", download:"تحميل", upload:"رفع" },
  tz: {
  start: "ⴱⴷⵓ ⵏ ⵜⴰⵙⵙⵉⵔⵜ",   // بدء الاختبار
  ping: "ⵜⴰⵙⵖⵓⵏⵜ",            // الاستجابة / التأخير
  download: "ⴰⵙⵉⴷⴰⵔ ⵏ ⵉⵙⴼⴽⴰ", // التحميل
  upload: "ⴰⵙⴰⵍⵉ ⵏ ⵉⵙⴼⴽⴰ"     // الرفع
}

};

function updateLanguage(lang){
  btnText.textContent = translations[lang].start;
  labelPing.textContent = translations[lang].ping;
  labelDownload.textContent = translations[lang].download;
  labelUpload.textContent = translations[lang].upload;
}
langSelect.addEventListener('change', ()=>updateLanguage(langSelect.value));
updateLanguage(langSelect.value);

// ECharts Gauge
const chartDom = document.getElementById('chart');
const myChart = echarts.init(chartDom);

let option = {
    series: [{
        name:'Speed',
        type:'gauge',
        startAngle: 180,
        endAngle: 0,
        min: 0,
        max: 1000,
        axisLine: { lineStyle: { width: 20, color: [[0.2,'#22c55e'], [0.5,'#3b82f6'], [1,'#a855f7']] } },

        radius:'95%',
        pointer:{ length:'60%', width:10, itemStyle:{color:'#22c55e'} },
        axisTick:{ length:10, lineStyle:{color:'#fff', width:1} },
        splitLine:{ length:20, lineStyle:{color:'#fff', width:2} },
        axisLabel:{ distance:20, color:'#e2e8f0', fontSize:12 },
        detail:{ valueAnimation:true, fontSize:22, fontWeight:'bold', color:'#22c55e', formatter:'{value} Mbps', offsetCenter:[0,'50%'] },
        data:[{value:0,name:'Download'}]
    }]
};
myChart.setOption(option);

async function animateGaugeRealtime(to,color='#22c55e',title=''){
    option.series[0].data[0].value=to.toFixed(2);
    option.series[0].data[0].name=title;
    option.series[0].detail.color=color;
    option.series[0].pointer.itemStyle.color=color;
    myChart.setOption(option,false);
}

// Test function
async function startTest(){
    const btn = document.getElementById("btn");
    btn.disabled=true;
    btnText.textContent = translations[langSelect.value].start + "...";
    btn.classList.add("testing");

    document.getElementById("ping").textContent="--";
    document.getElementById("download").textContent="--";
    document.getElementById("upload").textContent="--";

    // Ping
    const pingStart=performance.now();
    await fetch("https://speed.cloudflare.com/__down?bytes=1000",{cache:"no-store",mode:"no-cors"});
    const pingTime=Math.round(performance.now()-pingStart);
    document.getElementById("ping").textContent=pingTime + " ms";

    // Download 5MB
    const downloadUrl="https://speed.cloudflare.com/__down?bytes=25000000";
    const startTime=performance.now();
    const response=await fetch(downloadUrl,{cache:"no-store"});
    const reader=response.body.getReader();
    let received=0;
    while(true){
        const {done,value}=await reader.read(); if(done) break;
        received+=value.length;
        const seconds=(performance.now()-startTime)/1000;
        const mbps=(received*8)/(seconds*1024*1024);
        document.getElementById("download").textContent=mbps.toFixed(1);
        await animateGaugeRealtime(mbps,'#3b82f6',translations[langSelect.value].download);
        await new Promise(r=>setTimeout(r,30));
    }

    // Upload 2MB
    const uploadData=new Uint8Array(2*1024*1024);
    const upStart=performance.now();
    let uploaded=0,chunk=64*1024;
    while(uploaded<uploadData.length){
        const end=Math.min(uploaded+chunk,uploadData.length);
        const piece=uploadData.slice(uploaded,end);
        await fetch("https://speed.cloudflare.com/__up",{method:"POST",body:piece,mode:"no-cors"});
        uploaded+=piece.length;
        const seconds=(performance.now()-upStart)/1000;
        const mbps=(uploaded*8)/(seconds*1024*1024);
        document.getElementById("upload").textContent=mbps.toFixed(1);
        await animateGaugeRealtime(mbps,'#a855f7',translations[langSelect.value].upload);
        await new Promise(r=>setTimeout(r,20));
    }

    btn.disabled=false;
    btnText.textContent = translations[langSelect.value].start;
    btn.classList.remove("testing");
}