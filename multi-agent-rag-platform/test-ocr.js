import { createWorker } from 'tesseract.js'

async function test() {
  const worker = await createWorker('eng')
  console.log('Worker created')
  await worker.terminate()
}

test().catch(console.error)