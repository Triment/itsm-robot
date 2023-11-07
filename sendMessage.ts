export type MessagePlatform = 'wenlu'

const sendMessage = async (sendPlatform: MessagePlatform, phone: string) => {
  if (sendPlatform === 'wenlu') {
    return await (await fetch('https://mastergo.chamiedu.com/api/v1/user/registerCode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
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
  }
}

export { sendMessage }