(<any>Symbol).asyncIterator = Symbol.asyncIterator || Symbol.for("Symbol.asyncIterator");
import { $$iterator, $$asyncIterator, forAwaitEach } from 'iterall'

export function Effect(target: Function, key: string, descriptor: any) {
  // save a reference to the original method
  // this way we keep the values currently in the
  // descriptor and don't overwrite what another
  // decorator might have done to the descriptor.
  var originalMethod = descriptor.value;

  descriptor.value = function(...args: any[]) {
    return new EffectIterable(originalMethod, {
      methodName: key
    }).args(...args)
  }

  return descriptor;
}


export function testFn(subjectGen: (...args) => AsyncIterable<any>) {
  return function tester(executeFn: (subjectGen) => any[]) {
    const expectedIteration = executeFn(subjectGen);
  }
}

export class EffectIterable {
  private _args: any[];
  testMode: boolean = false;
  methodName: string;

  constructor(
    public fn: (...args: any[]) => any,
    opts?: IOIteratorOptions,
  ){
    this.methodName = opts && opts.methodName || fn.name
  }

  args (...args) {
    this._args = args
    return this
  };

  callWith (...args) {
    this._args = args
    return this.next()
  };


  [$$asyncIterator]() {}

  async next(mock?: any): Promise<EffectIteratorResult> {
    let value;
    let isFake;

    if(this.testMode && mock !== null) {
      value = mock;
      isFake = true;
    }

    if (!this.testMode) {
      value = await this.fn(...this._args)
      isFake = false;
    }

    return new EffectIteratorResult({
      methodName: this.methodName,
      args: this._args,
      isFake,
      value
    })
  }

  async return(value?: any): Promise<EffectIteratorResult> {
    return value;
  }
}

export async function unpackEffects(generator) {
  const coordinator = generator();

  return yieldEffects(coordinator, undefined)
}

async function yieldEffects(coordinator, value) {
  const yielded = await coordinator.next(value)

  if(yielded.done === false) {
    const ei = yielded.value

    if(ei instanceof EffectIterable) {
      const result = await ei.next()
      return yieldEffects(coordinator, result.value)
    } else {
      throw new Error('not iterable')
    }
  } else {
    return yielded.value
  }
}

export class EffectIteratorResult {
  methodName: string
  args: any[]
  value: any
  isFake: boolean

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
  isFake: boolean
}


interface IOIteratorOptions {
  methodName?: string
}