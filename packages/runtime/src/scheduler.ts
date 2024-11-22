export type Task = () => any
const tasks: Task[] = []

let isScheduled = false

// 安排到下一轮微任务列队中，即让该任务在 UI 渲染更新后执行
export function enqueueTask(task: Task) {
  tasks.push(task)
  queueAllTasks()
}

function queueAllTasks() {
  if (isScheduled) return
  queueMicrotask(processTasks)
  isScheduled = true
}

function processTasks() {
  while (tasks.length > 0) {
    const task = tasks.shift()!
    const res = task() // 可能是异步代码
    Promise.resolve(res)
      .then(() => {})
      .catch((reason) => {
        console.error(`[scheduler]: ${reason}`)
      })
  }
  isScheduled = false
}

// 为什么就这么几行，我却很难理解呢？ 请说中文
