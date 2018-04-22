(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator")
import { $$iterator, $$asyncIterator, forAwaitEach, getIterator, isAsyncIterable } from 'iterall'
import { deepEqual } from 'assert'
import { expect } from 'chai'

export function Effect(target: Function, key: string, descriptor: any) {
  // save a reference to the original method
  // this way we keep the values currently in the
  // descriptor and don't overwrite what another
  // decorator might have done to the descriptor.
  var originalMethod = descriptor.value

  descriptor.value = function(...args: any[]) {
    return new EffectIterable(originalMethod, {
      methodName: key
    }).withArgs(...args)
  }

  return descriptor
}

export function Coordinator(target: Function, key: string, descriptor: any) {
  // save a reference to the original method
  // this way we keep the values currently in the
  // descriptor and don't overwrite what another
  // decorator might have done to the descriptor.
  var originalMethod = descriptor.value

  descriptor.value = function(...args: any[]) {
    return new EffectIterable(originalMethod, {
      methodName: key
    }).withArgs(...args)
  }

  return descriptor
}

export class EffectIterable {
  private args: any[]
  private stub: any
  testMode: boolean
  methodName: string

  constructor(
    public fn: (...args: any[]) => any,
    opts?: IOIteratorOptions,
  ){
    this.methodName = opts && opts.methodName || fn.name
  }

  withArgs(...args) {
    this.args = args
    return this
  }

  returnStub(value?: any) {
    this.testMode = true
    this.stub = value
    return this
  }

  getStub() {
    return this.stub
  }

  [$$asyncIterator]() {}

  async next(): Promise<any> {

    if(this.testMode) {
      return new EffectIteratorResult({
        methodName: this.methodName,
        args: this.args,
        value: this.stub
      })
    } else {
      const args = this.args;
      const fn = this.fn;
      console.log('hey')
      async function * genWrapper() {
        const result = await fn(...args)
        console.log(result)
        return result
      }
      return {
        done: true,
        beans: 'yo',
        value: genWrapper()
      }
    }
  }

  async return(value?: any): Promise<EffectIteratorResult> {
    return value
  }
}

export async function executeEffects(parentGen, child = undefined) {
  if (isAsyncIterable(parentGen)) {
    console.log(child)
    const parentResult = isAsyncIterable(child)
      ? await parentGen.next(await executeEffects(child))
      : await parentGen.next()


    if(parentResult.done) {
      return parentResult.value
    } else {
      return executeEffects(parentGen, parentResult.value)
    }
  } else {
    console.log(parentGen)
  }

}

// if done, return result
// if not, call result

function isFunction(x) {
  return Object.prototype.toString.call(x) == '[object Function]';
}

function isCoordinatorFn(value) {
  const result = value instanceof EffectIterable === false && isAsyncIterable(value)
  return result
}

interface ISequenceMap {
  args: any[],
  effects: EffectIterable[],
  output: any
}



export function testFn(fnInTest: (...args) => AsyncIterable<any>) {
  return async function tester({ args, effects, output }: ISequenceMap) {


    const coordinator = fnInTest(...args)
    const expectedIterator = getIterator(effects)

    const finalResult = await testCoordinator(coordinator, expectedIterator)
    deepEqual(finalResult, output)
    return true
  }
}

async function testCoordinator(coordinator, expected, value = undefined) {
  const yielded = await coordinator.next(value)

  if(yielded.done === false) {
    const isYieldedAGenFn = yielded.value instanceof EffectIterable === false && isAsyncIterable(yielded.value)
    const expectedEI = await expected.next().value
    const ei = yielded.value

    if(isYieldedAGenFn) {
      const genResult = await yielded.value.return(expectedEI.stub)
      return testCoordinator(coordinator, expected, genResult.value)
    }

    if(ei instanceof EffectIterable) {
      const eiResult = await testEffect(expectedEI, ei)
      return testCoordinator(coordinator, expected, eiResult.value)
    } else {
      throw new Error('Not an EffectIterable')
    }
  } else {
    return yielded.value
  }
}

async function testEffect(expected, ei) {
  deepEqual(ei.fn, expected.fn)
  deepEqual(ei.args, expected.args)
  return ei.returnStub(expected.stub).next()
}

export class EffectIteratorResult {
  methodName: string
  args: any[]
  value: any

  constructor(
    data: IEffectIteratorResult
  ) {
    Object.keys(data).forEach((key) => {
      this[key] = data[key]
    })
  }
}

interface IEffectIteratorResult {
  methodName: string
  args: any[]
  value: any
}


interface IOIteratorOptions {
  methodName?: string
}