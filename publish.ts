function createPublish<M, F extends (arg: M) => void>()
    : [
        (arg0: string, arg1: M) => any,
        (arg0: string, arg1: F) => any
    ] {
    const taskList: Record<string, F[]> = {};
    function subscribe(event: string, func: F) {
        taskList[event] ? taskList[event].push(func) : taskList[event] = [func]
    }
    function publish(
        event: string,
        message: M
    ) {
        let oldTaskQueue = taskList[event]
        if (oldTaskQueue && oldTaskQueue.length > 0) {
            for (const task of oldTaskQueue) {
                task(message);
            }
        }
    }
    return [publish, subscribe]
}

export { createPublish }

type s = {
    name: string
}

const [pub, sub] = createPublish<s, ({ }) => void>();
sub('text', (arg) => {

})
pub("hex", {
    name: 'jiji'
})