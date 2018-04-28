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
      methodName: key,
      isDecorated: true,
    }).withArgs(...args)
  }

  return descriptor
}

export class EffectIterable {
  protected isDecorated: string
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

  public returnStub(value?: any) {
    this.testMode = true
    this.stub = value
    return this
  }

  [$$asyncIterator]() {}

  async next(): Promise<IteratorResult<any>> {

    if(this.testMode) {
      return {
        done: true,
        value: new EffectIteratorResult({
          methodName: this.methodName,
          args: this.args,
          value: this.stub
        })
      }
    } else {
      const klass = this;
      async function * genWrapper() {
        return klass.fn(...klass.args)
      }

      return {
        done: true,
        value: genWrapper()
      }
    }
  }

  async return(value?: any): Promise<IteratorResult<any>> {
    return {
      done: true,
      value,
    }
  }
}


export async function executeEffects(parentGen, child = undefined) {
  if (isAsyncIterable(parentGen)) {
    const parentResult = isAsyncIterable(child)
      ? await parentGen.next(await executeEffects(child))
      : await parentGen.next()


    if(parentResult.done) {
      if (isAsyncIterable(parentResult.value)) {
        return executeEffects(parentResult.value)
      }
      return parentResult.value
    } else {
      return executeEffects(parentGen, parentResult.value)
    }
  } else {
    throw new TypeError(`#executeEffects must be called with an iterable. Did you forget to call your generator function?`)
  }

}

interface ISequenceMap {
  args: any[],
  effects: any[],
  output: any
}

export function returnStub(value?: any) {
  return value;
}

export function testFn(fnInTest: (...args) => AsyncIterable<any>) {
  return async function tester({ args, effects, output }: ISequenceMap) {


    const coordinator = fnInTest(...args)
    const expectedIteration = getIterator(effects)

    const finalResult = await testCoordinator(coordinator, expectedIteration)
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
      const isEffectDecoratorEI = Array.isArray(expectedEI) && expectedEI[0] instanceof EffectIterable
      let eiResult;

      if (isEffectDecoratorEI) {
        await testEffect(expectedEI[0], ei)
        eiResult = await ei.return(expectedEI[1])
      } else if (expectedEI.stub) {
        await testEffect(expectedEI, ei)
        eiResult = await ei.return(expectedEI.stub)
      } else {
        await testEffect(expectedEI, ei)
        eiResult = { done: true, value: await executeEffects(ei) }
      }
      return testCoordinator(coordinator, expected, eiResult.value)
    } else {
      throw new Error('Not an EffectIterable')
    }
  } else {
    return yielded.value
  }
}

async function testEffect(expected, ei) {
  deepEqual(expected.fn, ei.fn)
  deepEqual(expected.args, ei.args)
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
  isDecorated?: boolean
}