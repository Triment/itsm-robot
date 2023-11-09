import assert from 'assert'
import sms from './platform.json'


export type MessagePlatform = '文鹿学院' | "终身教育平台" | "网易云游戏"

function getRequestSource(msg_platform: string, phone: string) {
    const target_platform = sms.find((plat) => plat.desc === msg_platform)
    function performPlatform(platform: Record<string, any>) {
        if (platform.url.includes('[phone]')) {
            return { ...platform, url: platform.url.replace('[phone]', phone) }
        }
        if (typeof platform.data === 'string') {
            if (platform.data.includes('[phone]')) {
                return { ...platform, data: platform.data.replace('[phone]', phone) }
            }
        }
        const obj = platform.data;
        assert(obj instanceof Object);
        let acceptance = false;
        const recurive = (obj: Record<string, any>) => {
            Object.keys(obj).map((key) => {
                if (typeof obj[key] === 'string') {
                    if (obj[key].includes('[phone]')) {
                        obj[key] = obj[key].replace('[phone]', phone);
                        acceptance = true;
                    }
                } else if (typeof obj[key] === 'object') {
                    obj[key] = recurive(obj[key]);
                }
            })
            return obj
        }
        return { ...platform, data: JSON.stringify(recurive(platform.data as Object)) };
    }
    return performPlatform(target_platform!);
}

async function sendMessage(platform: string, phone: string) {
    return new Promise((resolve, reject) => {
        const requestSource: any = getRequestSource(platform, phone)
        delete requestSource.desc;
        let { url, form, data, ...init } = requestSource;
        if (form) {
            const form = new FormData();
            let parsedata = JSON.parse(data);
            Object.keys(parsedata).forEach(key => {
                form.append(key, parsedata[key])
            });
            init = { ...init, body: form };
        } else {
            init = { ...init, body: data };
        }
        console.log(url, init)
        fetch(url, init).then(async (res) => {
            console.log(res)
            if (res.status === 200) {
                resolve(res.status)
            } else {
                reject(res.status)
            }
        }).catch(err => {
            reject(err)
        })

    })
}

export {sendMessage}
// console.log(".AspNetCore.Antiforgery.-eVG4o14DXw=CfDJ8A5NdnOfLa1IoTt5WaWPCCxaVeGCVWwc5LOFuHuUbqi49PyquOAMgmoRFqhl5LU-v71AWTaKKmYeSepjCLTLpD-sjzrIymGri7XyPnAC61VUvwroi6qv2lQad600GeFdv7kGSItT9Ltc6U814mvtnZ4; path=/; samesite=strict; httponly".split("=")[1].split(';')[0])