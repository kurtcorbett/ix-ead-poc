import { expect } from 'chai';
import { isAsyncIterable, isIterable } from 'iterall'
import { Coordinator, Effect, testFn, EffectIterable, EffectIteratorResult, executeEffects } from '../src/test2'


// fixtures



function asyncAdd(...args): Promise<number> {
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
  public static async asyncAdd(arg1: number, arg2: number): Promise<number> {
    return asyncAdd(arg1, arg2)
  }

  @Coordinator
  public static async * asyncAddCoordinator(num) {
    const eiResult1 = yield await new EffectIterable(asyncAdd).withArgs(num,num);
    const eiResult2 = yield await new EffectIterable(asyncAdd).withArgs(eiResult1, eiResult1);

    return eiResult2 + num;
  }
}


describe('EffectIterable', () => {

  context('when testMode=false', () => {
    let effectIterator;
    let expected;
    let result;
    const args = [1,2];

    beforeEach(async () => {
      effectIterator = new EffectIterable(asyncAdd).withArgs(...args);
      console.log(effectIterator)

      expected = new EffectIteratorResult({
        args,
        methodName: 'asyncAdd',
        value: 3,
      })

      result = await effectIterator.next()
      console.log(result)
    })


    it('should return a value when next is called', async () => {
      expect(result).to.deep.eq(expected)
    })
  })

  context('when testMode=true', () => {
    let effectIteratorResult;
    let expected;
    const args = [1,2]

    beforeEach(() => {
      effectIteratorResult = new EffectIterable(asyncAdd).withArgs(...args).returnStub(5);

      expected = new EffectIteratorResult({
        args,
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

      expected = new EffectIteratorResult({
        args,
        methodName: 'asyncAdd',
        value: 3,
      })
    })

    it('should return a value when next is called', async () => {
      expect(await effectIterator.next()).to.deep.eq(expected)
    })
  })
})

async function * coordinator(num: number) {
  const effect1Result = yield await new EffectIterable(asyncAdd)
  .withArgs(num, num)
  console.log(effect1Result)

  const result = yield await new EffectIterable(asyncAdd)
  .withArgs(effect1Result, num)

  console.log(result)
  return result
}

describe.only('executeEffects', () => {
  context('flat effect', () => {
    it('should return a result', async () => {
      expect(await executeEffects(coordinator(1))).to.eq(3)
    })
  })

  context('nested effects', () => {
    async function * nestedCoordinator(num: number) {
      return yield await new EffectIterable(coordinator).withArgs(num)
    }

    it('should return a result', async () => {
      expect(await executeEffects(nestedCoordinator(1))).to.eq(3)
    })
  })

  context('nested with flat', () => {
    async function * nestedCoordinator(num: number) {
      const res1 = yield await new EffectIterable(coordinator).withArgs(num)
      console.log(res1)
      const result = yield await new EffectIterable(asyncAdd).withArgs(res1)
      console.log(result)
      return result
    }

    it('should return a result', async () => {
      expect(await executeEffects(nestedCoordinator(1))).to.eq(4)
    })
  })

  context('nested async generators', () => {
    let result;

    beforeEach(async () => {
      async function * parentGen(num) {
        const result = yield await childGen(num)
        return result;
      }

      async function * childGen(num) {
        return num + 1;
      }

      result = await executeEffects(parentGen(1));
    })

    it('should return the correct result', () => {
      expect(result).to.eq(2)
    })
  })

  context.only('deeply nested async generators', () => {
    let result;

    beforeEach(async () => {
      async function * greatGrandparentGen(num) {
        const result = yield await grandparentGen(num)
        console.log(result)
        return result + 1;
      }

      async function * grandparentGen(num) {
        const result = yield await parentGen(num)
        console.log(result)
        return result + 1;
      }

      async function * parentGen(num) {
        const result = yield await childGen(num)
        console.log(result)
        return result + 1;
      }

      async function * childGen(num) {
        return num + 1;
      }

      result = await executeEffects(greatGrandparentGen(1));
    })

    it('should return the correct result', () => {
      expect(result).to.eq(5)
    })
  })

  context.only('async generator', () => {
    let result;

    beforeEach(async () => {
      async function * childGen(num) {
        return num + 1;
      }

      result = await executeEffects(childGen(1));
    })

    it('should return the correct result', () => {
      expect(result).to.eq(2)
    })
  })

  context.only('single EI', () => {
    function add(a, b) {
      return a + b;
    }

    async function * singleEI(num) {
      return yield new EffectIterable(add).withArgs(num, num)
    }

    it('should return 2', async () => {
      expect(await executeEffects(singleEI(1))).to.eq(2)
    })
  })

  context('multiple EI', () => {
    function add(a, b) {
      return a + b;
    }

    async function * multipleEI(num) {
      const res1 = yield await new EffectIterable(add).withArgs(num, num)
      console.log(res1)
      return yield new EffectIterable(add).withArgs(res1, res1)
    }

    it('should return 2', async () => {
      expect(await executeEffects(multipleEI(1))).to.eq(4)
    })
  })

})

describe('testFn', () => {
  context('when testing multiple ei with Object syntax', () => {
    let effectPlusPureTest;
    let result;

    beforeEach(async () => {
      async function * effectPlusPure(num) {
        const eiResult1 = yield await new EffectIterable(asyncAdd).withArgs(num,num);
        const eiResult2 = yield await new EffectIterable(asyncAdd).withArgs(eiResult1, eiResult1);

        return eiResult2 + num;
      }

      effectPlusPureTest = testFn(effectPlusPure)

      result = await effectPlusPureTest({
        args: [ 1 ],
        effects: [
          new EffectIterable(asyncAdd).withArgs(1,1).returnStub(2),
          new EffectIterable(asyncAdd).withArgs(2,2).returnStub(4),
        ],
        output: 5
      })
    })

    it('result should return true', () => {
      expect(result).to.eq(true)
    })
  })

  context('when testing multiple ei with Object syntax', () => {
    let effectPlusPureCoordinatorTest;
    let result;

    beforeEach(async () => {
      async function * effectPlusPure(num) {
        const eiResult1 = yield await new EffectIterable(asyncAdd).withArgs(num,num);
        const eiResult2 = yield await new EffectIterable(asyncAdd).withArgs(eiResult1, eiResult1);

        return eiResult2 + num;
      }

      async function * effectPlusPureCoordinator(num) {
        const coordinatorResult = yield await effectPlusPure(num)

        return coordinatorResult + num
      }

      effectPlusPureCoordinatorTest = testFn(effectPlusPureCoordinator)

      result = await effectPlusPureCoordinatorTest({
        args: [ 1 ],
        effects: [
          new EffectIterable(effectPlusPure).withArgs(1).returnStub(5),
        ],
        output: 6
      })
    })

    it('result should return true', () => {
      expect(result).to.eq(true)
    })
  })
})



// add yield * test case of coordinator