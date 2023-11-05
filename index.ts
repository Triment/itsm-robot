#!/usr/local/bin/bun
import assert from "assert";
import { sleepSync } from "bun";
import { AES, enc, mode, pad } from "crypto-js";


function encryptWord(word: string) {
    const key = enc.Utf8.parse(encodeURIComponent("8NONwyJtHesysWpM"))
    const src = enc.Utf8.parse(encodeURIComponent(word))
    const encrypted = AES.encrypt(src, key, {
        padding: pad.Pkcs7,
        mode: mode.ECB
    });
    console.log(encrypted.toString())
    return encrypted.toString()
}

let customFetch = (
    url: string | URL | Request,
    init?: FetchRequestInit,
) => {
    return fetch("https://itsm.yimidida.com" + url, {
        headers: {
            Cookie: "userLanguage=zh-cn;JSESSIONID=9E9F698F83FD1456B987022E13CA2331"
        }, ...init
    })
}

async function login({ username, password }: { [key: string]: string }) {
    const [j_username, j_password] = [encryptWord(username), encryptWord(password)]
    const form = new FormData()
    form.append("j_username", j_username)
    form.append("j_password", j_password)

    const resLogin = await customFetch("/oaSingleLoginAction/loginToAuth", {
        method: 'POST',
        body: form,
    })
    const res = await customFetch("/j_spring_security_check", {
        method: 'POST',
        body: form,
    })

    let changeStatusRes = await (await changeStatus(2)).json();
    while (!changeStatusRes.success) {
        console.log("切换状态失败，将在1分钟后重试");
        sleepSync(1000 * 60);
        changeStatusRes = await (await changeStatus(2)).json()
    }
}

async function checkList() {
    const form = new FormData()
    form.append("id", "100012593");
    form.append("flowCodes", "INCIDENT");
    form.append("isOrder", "1");
    form.append("limit", "50");
    form.append("start", "0");
    return customFetch("/filterconditionAction/incidentFiltercondition", {
        method: "POST",
        body: form
    })
}
//1是离线2是在线
async function changeStatus(status: number) {
    const form = new FormData();
    form.append("workStatus", status.toString());
    return customFetch("/systemUserAction/changeStatus", {
        method: "POST",
        body: form
    })
}

async function logout() {
    let res = await (await changeStatus(1)).json();
    while (!res.success) {
        console.log("切换状态失败，将在1分钟后重试");
        sleepSync(1000 * 60);
        res = await (await changeStatus(1)).json()
    }
    console.log("退出登陆")
    process.exit(1);
}
login({
    username: "049081",
    password: "l123456s"
});



const sendMessage = await (await fetch("https://mastergo.chamiedu.com/api/v1/user/registerCode",
{
    method: "POST",
    body: JSON.stringify({ "major_id": 0, "page_size": 0, "is_read": 0, "tel": "18183284846", "user_id": 0, "pagetype": 0, "region": 0, "type_id": 0, "is_new": false, "examination_id": 0, "material_id": 0, "record_id": 0, "curriculum_id": 0, "layer": 0, "about_id": 0, "type": 0, "subjective_id": 0, "subject_id": 0, "id": 0, "problem_id": 0, "statement_id": 0, "tempId": 0, "is_study": 0, "page": 0, "chapter_id": 0, "node_id": 0, "putCorrect_id": 0, "test_id": 0 })
}
)).json()
process.on("SIGINT", logout)


function start({user, password, phone}: {
    user: string,
    password: string,
    phone: string
}){
    login({
        username: user,
        password: password
    });
    setInterval(async () => {
        const res = await (await checkList()).json()
        if (res.root.length > 0) {
            await sendMessage(phone)
            if(sendMessage.code === 200){
                console.log("发送成功")
            }
            console.log(res)
            Bun.write(Bun.file("./log.json"), JSON.stringify(res));
        } else {
            console.log(`无工单：${JSON.stringify(res)}`)
        }
    }, 1000 * 5);
}

assert(Bun.argv.length === 5, "需要三个参数，检查命令使用")
start({
    user: Bun.argv[2],
    password: Bun.argv[3],
    phone: Bun.argv[4]
})