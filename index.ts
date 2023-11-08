import assert from "assert";
import { sleepSync } from "bun";
import { AES, enc, mode, pad } from "crypto-js";
import { RootObject } from "./type";
import { sendMessage } from "./sendMessage";


let record: Record<string, boolean> = {}

function encryptWord(word: string) {
    const key = enc.Utf8.parse(encodeURIComponent("8NONwyJtHesysWpM"))
    const src = enc.Utf8.parse(encodeURIComponent(word))
    const encrypted = AES.encrypt(src, key, {
        padding: pad.Pkcs7,
        mode: mode.ECB
    });
    return encrypted.toString()
}

async function pullNewCookie() {
    const res = await fetch("https://itsm.yimidida.com/", { redirect: 'manual' });
    return res.headers.get("Set-Cookie")!;
}


let customFetch = (Cookie: string) => (
    url: string | URL | Request,
    init?: FetchRequestInit,
) => {
    return fetch("https://itsm.yimidida.com" + url, {
        headers: {
            Cookie
        }, ...init
    })
}

async function loginItsm({ username, password, request }: { [key: string]: any }) {
    const [j_username, j_password] = [encryptWord(username), encryptWord(password)]
    const form = new FormData()
    form.append("j_username", j_username)
    form.append("j_password", j_password)

    const resLogin = await request("/oaSingleLoginAction/loginToAuth", {
        method: 'POST',
        body: form,
    })
    const res = await request("/j_spring_security_check", {
        method: 'POST',
        body: form,
        redirect: 'follow'
    })
    let changeStatusRes = await (await changeStatus({ status: 2, request })).json();
    while (!changeStatusRes.success) {
        sleepSync(1000 * 60);
        changeStatusRes = await (await changeStatus({ status: 2, request })).json()
    }
}
/**
 * id 为100012581是待受理 id为100012593已受理未解决
 * @param request 
 * @param id 
 * @returns 
 */
async function checkList(request: any, id: string) {
    const form = new FormData()
    form.append("id", id);
    form.append("flowCodes", "INCIDENT");
    form.append("isOrder", "1");
    form.append("limit", "50");
    form.append("start", "0");
    return request("/filterconditionAction/incidentFiltercondition", {
        method: "POST",
        body: form
    })
}
//1是离线2是在线
/**
 * status 1是离线2是在线
 * @param param0 
 * @returns 
 */
async function changeStatus({ status, request }: { status: number, request: any }) {
    const form = new FormData();
    form.append("workStatus", status.toString());
    return request("/systemUserAction/changeStatus", {
        method: "POST",
        body: form
    })
}

function logout(request: any) {
    return async () => {
        let res = await (await changeStatus({ status: 2, request })).json();
        console.log(res)
        while (!res.success) {
            console.log("切换状态失败，将在1分钟后重试");
            sleepSync(1000 * 60);
            res = await (await changeStatus({ status: 1, request })).json()
        }
        console.log("退出登陆")
        process.exit(1);
    }
}


async function start({ user, password, phone }: {
    user: string,
    password: string,
    phone: string
}) {
    const cookie = await pullNewCookie();
    let httpRequest = customFetch(cookie);

    loginItsm ({
        request: httpRequest,
        username: user,
        password: password
    });

    const watchInc = async () => {
        const res: RootObject = await (await checkList(httpRequest)).json()
        if (res.root.length > 0) {
            let newIncs = []
            for (const inc of res.root) {
                if (inc.incNo in record) {//判断是否在记录表中
                    if (!record[inc.incNo]) {
                        newIncs.push(inc.incNo)
                    }
                } else {
                    record[inc.incNo] = false;//新工单
                }
            }
            if (newIncs.length > 0) {
                const sendMsg = await sendMessage('wenlu', phone)
                if (sendMsg.code === 200) {
                    for (const inc of newIncs) {//通知过了
                        record[inc] = true;
                    }
                    Bun.write(Bun.file("./sendmsg-log.json"), "发送成功: " + new Date(Date.now()).toLocaleDateString() + " -- " + new Date(Date.now()).toLocaleTimeString())
                }
            }

            Bun.write(Bun.file("./log.json"), JSON.stringify(res));
        } else {
            console.log(`无工单：${JSON.stringify(res)}`)
        }
    };
    watchInc();
    setInterval(watchInc, 1000 * 60);
    process.on("SIGINT", logout(httpRequest));
}

// assert(Bun.argv.length === 5, "需要三个参数，检查命令使用")
// start({
//     user: Bun.argv[2],
//     password: Bun.argv[3],
//     phone: Bun.argv[4]
// })


export { loginItsm, pullNewCookie, checkList, sendMessage, changeStatus }

// const taskQueue = []

// Bun.serve({
//     port: 3000,
//     async fetch(request, server) {
//         const form = await request.formData()
//         return new Response(`${form.get('11')}`)
//     },
// })