/*
    本作品用于QuantumultX和Surge之间js执行方法的转换
    您只需书写其中任一软件的js,然后在您的js最【前面】追加上此段js即可
    无需担心影响执行问题,具体原理是将QX和Surge的方法转换为互相可调用的方法
    尚未测试是否支持import的方式进行使用,因此暂未export
    如有问题或您有更好的改进方案,请前往 https://github.com/sazs34/TaskConfig/issues 提交内容,或直接进行pull request
    您也可直接在tg中联系@wechatu
*/
// #region 固定头部
let isQuantumultX = $task !== undefined; //判断当前运行环境是否是qx
let isSurge = $httpClient !== undefined; //判断当前运行环境是否是surge
// http请求
var $task = isQuantumultX ? $task : {};
var $httpClient = isSurge ? $httpClient : {};
// cookie读写
var $prefs = isQuantumultX ? $prefs : {};
var $persistentStore = isSurge ? $persistentStore : {};
// 消息通知
var $notify = isQuantumultX ? $notify : {};
var $notification = isSurge ? $notification : {};
// #endregion 固定头部

// #region 网络请求专用转换
if (isQuantumultX) {
    var errorInfo = {
        error: ''
    };
    $httpClient = {
        get: (url, cb) => {
            var urlObj;
            if (typeof (url) == 'string') {
                urlObj = {
                    url: url
                }
            } else {
                urlObj = url;
            }
            $task.fetch(urlObj).then(response => {
                cb(undefined, response, response.body)
            }, reason => {
                errorInfo.error = reason.error;
                cb(errorInfo, response, '')
            })
        },
        post: (url, cb) => {
            var urlObj;
            if (typeof (url) == 'string') {
                urlObj = {
                    url: url
                }
            } else {
                urlObj = url;
            }
            url.method = 'POST';
            $task.fetch(urlObj).then(response => {
                cb(undefined, response, response.body)
            }, reason => {
                errorInfo.error = reason.error;
                cb(errorInfo, response, '')
            })
        }
    }
}
if (isSurge) {
    $task = {
        fetch: url => {
            //为了兼容qx中fetch的写法,所以永不reject
            return new Promise((resolve, reject) => {
                if (url.method == 'POST') {
                    $httpClient.post(url, (error, response, data) => {
                        response.body = data;
                        resolve(response, {
                            error: error
                        });
                    })
                } else {
                    $httpClient.get(url, (error, response, data) => {
                        response.body = data;
                        resolve(response, {
                            error: error
                        });
                    })
                }
            })

        }
    }
}
// #endregion 网络请求专用转换

// #region cookie操作
if (isQuantumultX) {
    $persistentStore = {
        read: key => {
            return $prefs.valueForKey(key);
        },
        write: (val, key) => {
            return $prefs.setValueForKey(val, key);
        }
    }
}
if (isSurge) {
    $prefs = {
        valueForKey: key => {
            return $persistentStore.read(key);
        },
        setValueForKey: (val, key) => {
            return $persistentStore.write(val, key);
        }
    }
}
// #endregion

// #region 消息通知
if (isQuantumultX) {
    $notification = {
        post: (title, subTitle, detail) => {
            $notify(title, subTitle, detail);
        }
    }
}
if (isSurge) {
    $notify = function (title, subTitle, detail) {
        $notification.post(title, subTitle, detail);
    }
}
// #endregion
/*
具体配置可见
https://github.com/sazs34/TaskConfig#%E5%A4%A9%E6%B0%94
 */
let config = {
    darksky_api: "84042b0b9895334261e502a3ca8bfd2d", //从https://darksky.net/dev/ 上申请key填入即可
    aqicn_api: "1ac26c037291fb2d9c8746e2c588b3dc0a01460d", //从http://aqicn.org/data-platform/token/#/ 上申请key填入即可
    lat_lon: "43.900000, 125.350000", //请填写经纬度,直接从谷歌地图中获取即可
    lang: 'zh', //语言,请不要修改
    uv: true, //紫外线显示,false则不显示
    apparent: true, //体感温度显示,false则不显示
    tips: true //空气质量建议显示,false则不显示
}

//clear-day, partly-cloudy-day, cloudy, clear-night, rain, snow, sleet, wind, fog, or partly-cloudy-night
//☀️🌤⛅️🌥☁️🌦🌧⛈🌩🌨❄️💧💦🌫☔️☂️ ☃️⛄️
function weather() {
    var wurl = {
        url: "https://api.darksky.net/forecast/" + config.darksky_api + "/" + config.lat_lon + "?lang=" + config.lang + "&units=si&exclude=currently,minutely",
    };


    $task.fetch(wurl).then(response => {
        let obj = JSON.parse(response.body);
        // console.log(`天气数据获取-1-${JSON.stringify(obj)}`);
        if (obj.error) {
            $notify("DarkApi", "出错啦", obj.error);
        }
        let icon_text = obj.hourly.icon;
        let icon = "❓"
        if (icon_text == "clear-day") icon = "☀️晴";
        if (icon_text == "partly-cloudy-day") icon = "🌤晴转多云";
        if (icon_text == "cloudy") icon = "☁️多云";
        if (icon_text == "rain") icon = "🌧雨";
        if (icon_text == "snow") icon = "☃️雪";
        if (icon_text == "sleet") icon = "🌨雨夹雪";
        if (icon_text == "wind") icon = "🌬大风";
        if (icon_text == "fog") icon = "🌫大雾";
        if (icon_text == "partly-cloudy-night") icon = "🌑";
        if (icon_text == "clear-night") icon = "🌑";
        let weatherInfo = {
            icon,
            daily_prec_chance: obj.daily.data[0].precipProbability,
            daily_maxtemp: obj.daily.data[0].temperatureMax,
            daily_mintemp: obj.daily.data[0].temperatureMin,
            daily_windspeed: obj.daily.data[0].windSpeed,
            daily_uvIndex: obj.daily.data[0].uvIndex,
            hour_summary: obj.hourly.summary,
            apparentTemperatureLow: obj.daily.data[0].apparentTemperatureLow,
            apparentTemperatureHigh: obj.daily.data[0].apparentTemperatureHigh
        }
        // console.log(`天气数据获取-2-${JSON.stringify(weatherInfo)}`);
        aqi(weatherInfo);

    }, reason => {
        $notify("Dark Sky", '信息获取失败', reason.error);
    });
}

function aqi(weatherInfo) {
    const {
        icon,
        daily_prec_chance,
        daily_maxtemp,
        daily_mintemp,
        daily_windspeed,
        hour_summary,
        daily_uvIndex,
        apparentTemperatureLow,
        apparentTemperatureHigh
    } = weatherInfo;
    let aqi = {
        url: "https://api.waqi.info/feed/geo:" + config.lat_lon.replace(/,/, ";") + "/?token=" + config.aqicn_api,
        headers: {},
    }
    $task.fetch(aqi).then(response => {
        var obj1 = JSON.parse(response.body);
        if (obj1.status == 'error') {
            $notify("Aqicn", "出错啦", obj1.data);
        }
        // console.log(`天气数据获取-3-${JSON.stringify(obj1)}`);
        var aqi = obj1.data.aqi;
        var loc = obj1.data.city.name;
        try {
            var locArr = loc.split(/[(),，（）]/)
            if (locArr.length >= 4) {
                loc = locArr[2] + " ";
            } else if (locArr.length >= 2) {
                loc = locArr[1] + " ";
            } else {
                loc = "";//此时会很长,还不如不显示了
            }
        } catch (e) {
            loc = '';
            console.log(`获取城市名称失败-${JSON.stringify(e)}`);
        }
        var aqiInfo = getAqiInfo(aqi);
        var weather = `${icon} ${Math.round(daily_mintemp)} ~ ${Math.round(daily_maxtemp)}℃  ☔️下雨概率 ${(Number(daily_prec_chance) * 100).toFixed(1)}%`;
        let detail = `😷空气质量 ${aqi}(${aqiInfo.aqiDesc}) 💨风速${daily_windspeed}km/h`;
        if (config.uv) {
            detail += `
🌚紫外线指数${daily_uvIndex}(${getUVDesc(daily_uvIndex)})`;
        }
        if (config.apparent) {
            detail += `
🤔体感温度${Math.round(apparentTemperatureLow)} ~ ${Math.round(apparentTemperatureHigh)}℃`;
        }
        if (config.tips) {
            detail += `
${aqiInfo.aqiWarning?"Tips:":""}${aqiInfo.aqiWarning}`;
        }
        $notify(`${loc}${hour_summary}`, weather, detail);
    }, reason => {
        $notify("Aqicn.org", '信息获取失败', reason.error);
    });
}

function getAqiInfo(aqi) {
    var aqiDesc = "";
    var aqiWarning = "";
    if (aqi > 300) {
        aqiDesc = "🟤严重污染";
        aqiWarning = "儿童、老人、呼吸系统等疾病患者及一般人群停止户外活动";
    } else if (aqi > 200) {
        aqiDesc = "🟣重度污染";
        aqiWarning = "儿童、老人、呼吸系统等疾病患者及一般人群停止或减少户外运动";
    } else if (aqi > 150) {
        aqiDesc = "🔴中度污染";
        aqiWarning = "儿童、老人、呼吸系统等疾病患者及一般人群减少户外活动";
    } else if (aqi > 100) {
        aqiDesc = "🟠轻度污染";
        aqiWarning = "老人、儿童、呼吸系统等疾病患者减少长时间、高强度的户外活动";
    } else if (aqi > 50) {
        aqiDesc = "🟡良好";
        aqiWarning = "极少数敏感人群应减少户外活动";
    } else {
        aqiDesc = "🟢优";
    }
    return {
        aqi,
        aqiDesc,
        aqiWarning
    };
}

function getUVDesc(daily_uvIndex) {
    var uvDesc = "";
    if (daily_uvIndex >= 10) {
        uvDesc = "五级-特别强";
    } else if (daily_uvIndex >= 7) {
        uvDesc = "四级-很强";
    } else if (daily_uvIndex >= 5) {
        uvDesc = "三级-较强";
    } else if (daily_uvIndex >= 3) {
        uvDesc = "二级-较弱";
    } else {
        uvDesc = "一级-最弱";
    }
    return uvDesc;
}

weather()
