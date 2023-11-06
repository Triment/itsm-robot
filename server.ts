import { createRouter } from '@triment/sweet.js';
import { changeStatus, checkList, loginItsm, pullNewCookie, sendMessage } from '.';
import { Root, RootObject } from './type';


//type of event 
type SubscribeItsmBodyType = {
    username: string,
    password: string,
    phone: string,
    timer: number,
    cookie?: string, //携带token
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
                    const request = itsmRequest(cookie)
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
                            }).then((res)=>{
                                return res.json()
                            }).then(resData=>{
                                if(!resData.success) {
                                    console.log("切换状态失败，将在1分钟后自动尝试登录");
                                    setTimeout(() => {
                                        changeStatus({ status: 2, request });
                                    }, 60*1000);
                                }
                                resolve(new Response(`${data.username} 增加成功!`));
                            })
                    }).catch(err => {
                        resolve(new Response(`${data.username} 登录失败,检查你的帐号密码!`))
                    })

                })
            } else {
                resolve(new Response("检查表单数据是否有误!"));
            }
            
        }).catch(err => {
            reject(err)
        })
    }));
})

const serverFetch = async (req: Request) => await router.matchRoute(req);

setInterval(checkItsmTask, 1000*5)
Bun.serve({
    port: 3000,
    fetch: serverFetch
})

async function callTask({ username, password, phone, timer, cookie, incs }: SubscribeItsmBodyType) {
    const request = itsmRequest(cookie!);//获取到请求
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
        const sendMsg = await sendMessage(phone)
        if (sendMsg.code === 200) {
            for (const incNo in incs) {
                if (!incs[incNo]) {
                    incs[incNo] = true;
                }
            }
            Bun.write(Bun.file("./sendmsg-log.json"), "发送成功: " + new Date(Date.now()).toLocaleDateString() + " -- " + new Date(Date.now()).toLocaleTimeString())
        }
    }
}

function checkItsmTask() {
    Object.keys(queue).forEach(key => {
        const user = queue[key];
        callTask(user);
    })
}



function validateItsmData(x: any) {
    return Object.keys(x).length === 4 && x['username'] && x['password'] && x['phone'] && x['timer']
}