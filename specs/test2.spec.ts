import { expect } from 'chai';
import { isAsyncIterable, isIterable } from 'iterall'
import { Effect, testFn, EffectIterable, EffectIteratorResult, unpackEffects } from '../src/test2'


function asyncAdd(...args) {
  return new Promise((resolve) => {
    const result = args.reduce((acc, curr) => {
      acc += curr
      return acc
    }, 0)

    resolve(result)
  })
}

class TestClass {
  @Effect
  public static async asyncAdd(arg1: number, arg2: number) {
    return asyncAdd(arg1, arg2)
  }
}


describe('EffectIterable', () => {

  context('when testMode=false', () => {
    let effectIterator;
    let expected;
    const args = [1,2];

    beforeEach(() => {
      effectIterator = new EffectIterable(asyncAdd, {
        methodName: 'asyncAdd'
      }).args(...args);

      effectIterator.testMode = false;

      expected = new EffectIteratorResult({
        args,
        isFake: false,
        methodName: 'asyncAdd',
        value: 3,
      })
    })

    it('should return a value when next is called', async () => {
      expect(await effectIterator.next()).to.deep.eq(expected)
    })
  })

  context('when testMode=true', () => {
    let effectIteratorResult;
    let expected;
    const args = [1,2]

    beforeEach(() => {
      effectIteratorResult = new EffectIterable(asyncAdd);

      effectIteratorResult.testMode = true;
      effectIteratorResult.callWith(...args)

      expected = new EffectIteratorResult({
        args,
        isFake: true,
        methodName: 'asyncAdd',
        value: 5,
      })
    })

    it('should return a value when next is called', async () => {
      expect(await effectIteratorResult.next(5)).to.deep.eq(expected)
    })
  })
})

describe('@Effect', () => {

  context('when iterating over a @Effect decorated method with testMode=true', () => {
    const args = [1,2]
    let effectIterator;
    let result;
    let expected;

    beforeEach(async function () {
      effectIterator = TestClass.asyncAdd(1,2)

      effectIterator.testMode = false;

      expected = new EffectIteratorResult({
        args,
        isFake: false,
        methodName: 'asyncAdd',
        value: 3,
      })
    })

    it('should return a value when next is called', async () => {
      expect(await effectIterator.next()).to.deep.eq(expected)
    })
  })
})

describe('unpack', () => {
  async function * coordinator() {
    const effect1Result = yield await new EffectIterable(asyncAdd)
      .args(1,2)

    return yield await new EffectIterable(asyncAdd)
      .args(effect1Result, 1)
  }

  it('should return a result', async () => {
    expect(await unpackEffects(coordinator)).to.eq(4)
  })
})

describe('testFn', () => {
  context('when testing an ei', () => {
    const args = [1,2];
    let ei;
    let eiTest;

    beforeEach(() => {
      ei = new EffectIterable(asyncAdd, {
        methodName: 'asyncAdd'
      }).args(...args);

      eiTest = testFn(ei)

      eiTest((args, effects) => {
        return [
          []
        ]
      })

    })

    it('should return a result', async () => {
      expect(eiTest).to.be.a('function')
    })

    it('should be callable')

  })
})



// compare expected call to actual?