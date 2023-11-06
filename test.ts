
// const form = new FormData()
// form.append("j_username", 'FCl5qZ6Ja0oVVE05PiD6tQ==')
// form.append("j_password", 'ThX+y9WM/iE74y1WUwhliw==')
// fetch('https://itsm.yimidida.com/oaSingleLoginAction/loginToAuth',{
//     method: 'POST',
//     body: form,
//     headers: {
//         Cookie: "userLanguage=zh-cn;JSESSIONID=A28CF9273B12297131C98D4FFE9FADD8"
//     },
//     redirect: 'follow'
// }).then(res=>res.json()).then(data=>{
//     console.log(data)
// })
let a: any = {
    test: {}
}
a.test['hello'] = "tysyjdg"

const b = ({test}:any)=>{
    const f = test;
    f.hello = "90"
}

b(a)
console.log(a)