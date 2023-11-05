export async function sendMessage(phone: string){
    const sendMessage = await (await fetch('https://mastergo.chamiedu.com/api/v1/user/registerCode', {
        method: 'POST',
        headers: {
          'Host': 'mastergo.chamiedu.com',
          'Content-Type': 'application/json; charset=utf-8',
          'h_devices_type': 'Apple',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Accept': '*/*',
          'h_platform': '1',
          'User-Agent': 'ChaMiApp/2.3.2 (iPhone; iOS 15.7.1; Scale/3.00)',
          'Accept-Language': 'en-CN;q=1, zh-Hans-CN;q=0.9',
          'Content-Length': '384',
          'h_version': '2.3.2'
        },
        body: JSON.stringify({
          'major_id': 0,
          'page_size': 0,
          'is_read': 0,
          'tel': phone,
          'user_id': 0,
          'pagetype': 0,
          'region': 0,
          'type_id': 0,
          'is_new': false,
          'examination_id': 0,
          'material_id': 0,
          'record_id': 0,
          'curriculum_id': 0,
          'layer': 0,
          'about_id': 0,
          'type': 0,
          'subjective_id': 0,
          'subject_id': 0,
          'id': 0,
          'problem_id': 0,
          'statement_id': 0,
          'tempId': 0,
          'is_study': 0,
          'page': 0,
          'chapter_id': 0,
          'node_id': 0,
          'putCorrect_id': 0,
          'test_id': 0
        })
      })).json()
      return sendMessage
}