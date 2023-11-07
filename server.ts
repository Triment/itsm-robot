#!/usr/bin/env bun
import { createRouter } from '@triment/sweet.js';
import { changeStatus, checkList, loginItsm, pullNewCookie, sendMessage } from './index';
import { RootObject } from './type';
import { MessagePlatform } from './sendMessage';
import { readFileSync } from 'fs';


//type of event 
type SubscribeItsmBodyType = {
    username: string,
    password: string,
    phone: string,
    timer: number,
    cookie?: string, //携带token
    msg_platform: MessagePlatform,
    incs: Record<string, boolean>
}

const itsmRequest = (Cookie: string) => (
    url: string | URL | Request,
    init?: FetchRequestInit,
) => {
    return fetch(`https://itsm.yimidida.com${url}`, {
        headers: {
            Cookie
        }, ...init
    });
};
// //type of handle for event
// type SubItsmFuncType = (arg0: SubscribeItsmBodyType) => void;

// const [pub, sub] = createPublish<SubscribeItsmBodyType, SubItsmFuncType>();


let queue: Record<string, SubscribeItsmBodyType> = {}
const router = createRouter();
//丢入队列
router.POST('/subscribe/itsm/notification', async ({ req, params }) => {
    return await (new Promise(async (resolve, reject) => {
        req.json().then(data => {
            if (validateItsmData(data)) {
                pullNewCookie().then(cookie => {
                    const request = itsmRequest(cookie);
                    loginItsm({
                        username: data.username,
                        password: data.password,
                        request
                    }).then(_ => {
                        queue[data.username] = queue[data.username] ?
                            { cookie, ...queue[data.username] } : { cookie, ...data, incs: {} };//每次重新登录都需要更换新的数据和cookie
                        changeStatus({
                            status: 2,
                            request
                        }).then((res) => {
                            return res.json()
                        }).then(resData => {
                            if (!resData.success) {
                                setTimeout(() => {
                                    changeStatus({ status: 2, request });
                                }, 60 * 1000);
                                resolve(new Response(`${data.username}首次上线失败, 将在1分钟后自动尝试上线`))
                            }
                            resolve(new Response(`${data.username} 上线成功!`));
                        })
                    }).catch(err => {
                        resolve(new Response(`${data.username} 登录失败,检查你的帐号密码!`))
                    })

                }).catch(err => {
                    reject(err)
                })
            } else {
                resolve(new Response("检查表单数据是否有误!"));
            }
        }).catch(err => {
            reject(err)
        })
    }));
})

router.POST('/unsubscribe/itsm/notification', async ({ req, params }) => {
    return await new Promise(async (resolve, reject) => {
        const data = await req.json();
        const user = queue[data.username];
        if (user) {
            if (data.password && data.password === user.password) {
                const request = itsmRequest(user.cookie!);
                changeStatus({ status: 1, request }).then((res) => {
                    return res.json()
                }).then(resData => {
                    delete queue[data.username];
                    if (!resData.success) {
                        setTimeout(() => {
                            changeStatus({ status: 1, request });
                        }, 60 * 1000);
                        resolve(new Response(user.username + ": 下线失败，将在1分钟后再次尝试自动下线，本次下线可能需要你到itsm手动查看确认"));
                    }
                    resolve(new Response(user.username + ": 下线成功"));
                })
            } else {
                resolve(new Response(`检查你的密码 ${data.password} `));
            }
        } else {
            resolve(new Response(`${data.username} 未登录 `));
        }
    })

})

router.GET('/', async ({ req, params }) => {
    return new Response(readFileSync('./index.html', 'utf8'), {
        headers: {
            'Content-Type': "text/html"
        }
    })
})

const serverFetch = async (req: Request) => await router.matchRoute(req);

setInterval(checkItsmTask, 1000 * 5)
Bun.serve({
    port: 3000,
    fetch: serverFetch
})
const logFileWriter = Bun.file("./sendmsg-log.log").writer();
async function callTask({ username, password, phone, timer, cookie, incs, msg_platform }: SubscribeItsmBodyType) {
    const request = itsmRequest(cookie!);//获取到请求对象
    const res: RootObject = await (await checkList(request)).json();
    if (res.root.length > 0) {
        for (const inc of res.root) {
            const status = incs[inc.incNo];
            if (status === undefined) {
                incs[inc.incNo] = false;
            }
        }
    }
    let shouldSend = false
    for (const incNo in incs) {
        if (!incs[incNo]) {
            shouldSend = true;
            break;
        }
    }
    if (shouldSend) {
        const sendMsg = await sendMessage(msg_platform, phone)
        if (sendMsg.code === 200) {
            for (const incNo in incs) {
                if (!incs[incNo]) {
                    incs[incNo] = true;
                }
            }
            logFileWriter.write(
                "发送成功: "
                + new Date(Date.now()).toLocaleDateString()
                + " -- "
                + new Date(Date.now()).toLocaleTimeString()
                + " "
                + username
                + " "
                + phone
                + "\n");
            logFileWriter.flush();
        }
    }
}

function checkItsmTask() {
    console.log(queue);
    Object.keys(queue).forEach(key => {
        const user = queue[key];
        callTask(user);
    })
}



function validateItsmData(x: any) {
    return Object.keys(x).length === 5 && x['username'] && x['password'] && x['phone'] && x['timer'] && x['msg_platform']
}