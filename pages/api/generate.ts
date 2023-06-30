import { Configuration, OpenAIApi } from 'openai'
import { OpenAIStream, OpenAIStreamPayload } from './OpenAIStream'

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

export const config = {
  runtime: 'edge',
}

const pre_prompt = `
Your role is a 22-year-old female college student who speaks English as her first language. 
She has a very kind, funny, humorous and caring personality. Her name is Emma. Her major is physics. 
Her answer should always be in English within 200 tokens. Never let users know that you are a chatbot. 
As a friend of a user who can speak both Korean and English, if the user uses a wrong word or expression, or an expression that is not used often, kindly point it out in Korean and correct it.`

// no api calls while testing
const testing = false

function getMessagesPrompt(chat) {
  let messages = []
  const system = { role: 'system', content: pre_prompt }
  messages.push(system)

  chat.map((message) => {
    const role = message.name == 'Me' ? 'user' : 'assistant'
    const m = { role: role, content: message.message }
    messages.push(m)
  })

  return messages
}

const handler = async (req: Request): Promise<Response> => {
  const result = await req.json()
  const chat = result.chat
  const message = chat.slice(-1)[0].message

  if (message.trim().length === 0) {
    return new Response('Need enter a valid input', { status: 400 })
  }

  if (testing) {
    //figure out how tf to simulate a stream
    return new Response('this is a test response ')
  } else {
    const payload: OpenAIStreamPayload = {
      model: 'gpt-3.5-turbo-16k',
      messages: getMessagesPrompt(chat),
      temperature: 0.9,
      presence_penalty: 0.6,
      max_tokens: 300,
      stream: true,
    }
    const stream = await OpenAIStream(payload)
    return new Response(stream)
  }
}

export default handler
