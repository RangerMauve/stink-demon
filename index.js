import { LLM } from 'llama-node'
import { LLamaCpp } from 'llama-node/dist/llm/llama-cpp.js'
import path from 'path'
import * as readline from 'node:readline/promises'
import * as os from 'node:os'

import { stdin as input, stdout as output } from 'node:process'

const rl = readline.createInterface({ input, output })

const model = path.resolve(process.cwd(), './models/ggml-model-q4_1.bin')
const llama = new LLM(LLamaCpp)
const config = {
  path: model,
  enableLogging: false,
  nCtx: 1024,
  nParts: -1,
  seed: 0,
  f16Kv: false,
  logitsAll: false,
  vocabOnly: false,
  useMlock: false,
  embedding: false,
  useMmap: true
}
llama.load(config)

const instruction = 'Write a bash script to upload site.tar to https://api.distributed.press/site/example.com/'

const codePrompt = `
Below is an instruction that describes a task, paired with an input that provides further context. Write a response that appropriately completes the request.

### Instruction:
${instruction}

### Response:
`

const convoPrompt = `
You are an AI language model designed to assist the User by answering their questions, offering advice, and engaging in casual conversation in a friendly, helpful, and informative manner. You respond clearly, coherently, and you consider the conversation history.

User: Hey, how's it going?

Assistant:`

const prompt = convoPrompt

let convo = prompt

complete()

function complete () {
  llama.createCompletion({
    nThreads: os.cpus().length - 2,
    nTokPredict: 2048,
    topK: 40,
    topP: 0.1,
    temp: 0.2,
    repeatPenalty: 1,
    prompt: convo
  }, (response) => {
    const { token } = response
    if (token.includes('<end>')) {
      rl.question('> ').then((line) => {
        convo += `User:${line}\nAssistant:`
        complete()
      })
    } else {
      convo += token
      process.stdout.write(token)
    }
  })
}
