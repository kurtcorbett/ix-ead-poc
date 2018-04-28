import { expect } from 'chai';
import { isAsyncIterable, isIterable } from 'iterall'
import { Effect, testFn, EffectIterable, EffectIteratorResult, executeEffects, returnStub } from './'

function add(a, b): number {
  return a + b
}

class TestClass {
  @Effect
  public static async add(arg1: number, arg2: number): Promise<number> {
    return add(arg1, arg2)
  }
}


describe('EffectIterable', () => {

  context('when testMode=false', () => {
    let effectIterator;
    let expected;
    let result;
    const args = [1, 2];

    beforeEach(async () => {
      effectIterator = new EffectIterable(add).withArgs(...args);

      result = await effectIterator.next()
    })


    it('should return an iterator result', async () => {
      expect(result).to.have.deep.property('done')
      expect(result).to.have.deep.property('value')
    })

    it('should return an iterator for a value', () => {
      expect(result.value).to.have.deep.property('next')
      expect(result.value).to.have.deep.property('return')
      expect(result.value).to.have.deep.property('throw')
    })
  })

  context('when testMode=true', () => {
    let effectIteratorResult;
    let expected;
    const args = [1, 2]

    beforeEach(() => {
      effectIteratorResult = new EffectIterable(add).withArgs(...args).returnStub(5);

      expected = {
        done: true,
        value: new EffectIteratorResult({
          args,
          methodName: 'add',
          value: 5,
        })
      }
    })

    it('should return a value when next is called', async () => {
      expect(await effectIteratorResult.next(5)).to.deep.eq(expected)
    })
  })
})

describe('@Effect', () => {

  context('when iterating over a @Effect decorated method with testMode=true', () => {
    const args = [1, 2]
    let effectIterator;
    let result;
    let expected;

    beforeEach(async function () {
      effectIterator = TestClass.add(1, 2)

      result = await effectIterator.next()
    })

    it('should return an iterator result', async () => {
      expect(result).to.have.deep.property('done')
      expect(result).to.have.deep.property('value')
    })

    it('should return an iterator for a value', () => {
      expect(result.value).to.have.deep.property('next')
      expect(result.value).to.have.deep.property('return')
      expect(result.value).to.have.deep.property('throw')
    })
  })
})

async function* coordinator(num: number) {
  const effect1Result = yield await new EffectIterable(add)
    .withArgs(num, num)

  const result = yield await new EffectIterable(add)
    .withArgs(effect1Result, num)

  return result
}

describe('executeEffects', () => {
  context('flat effect', () => {
    it('should return a result', async () => {
      expect(await executeEffects(coordinator(1))).to.eq(3)
    })
  })

  context('nested effects', () => {
    async function* nestedCoordinator(num: number) {
      return yield await new EffectIterable(coordinator).withArgs(num)
    }

    it('should return a result', async () => {
      expect(await executeEffects(nestedCoordinator(1))).to.eq(3)
    })
  })

  context('nested with flat', () => {
    async function* nestedCoordinator(num: number) {
      const res1 = yield await new EffectIterable(coordinator).withArgs(num)
      const result = yield await new EffectIterable(add).withArgs(res1, num)
      return result
    }

    it('should return a result', async () => {
      expect(await executeEffects(nestedCoordinator(1))).to.eq(4)
    })
  })

  context('nested async generators', () => {
    let result;

    beforeEach(async () => {
      async function* parentGen(num) {
        const result = yield await childGen(num)
        return result;
      }

      async function* childGen(num) {
        return num + 1;
      }

      result = await executeEffects(parentGen(1));
    })

    it('should return the correct result', () => {
      expect(result).to.eq(2)
    })
  })

  context('deeply nested async generators', () => {
    let result;

    beforeEach(async () => {
      async function* greatGrandparentGen(num) {
        const result = yield await grandparentGen(num)
        return result + 1;
      }

      async function* grandparentGen(num) {
        const result = yield await parentGen(num)
        return result + 1;
      }

      async function* parentGen(num) {
        const result = yield await childGen(num)
        return result + 1;
      }

      async function* childGen(num) {
        return num + 1;
      }

      result = await executeEffects(greatGrandparentGen(1));
    })

    it('should return the correct result', () => {
      expect(result).to.eq(5)
    })
  })

  context('async generator', () => {
    let result;

    beforeEach(async () => {
      async function* childGen(num) {
        return num + 1;
      }

      result = await executeEffects(childGen(1));
    })

    it('should return the correct result', () => {
      expect(result).to.eq(2)
    })
  })

  context('single EI', () => {
    function add(a, b) {
      return a + b;
    }

    async function* singleEI(num) {
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

    async function* multipleEI(num) {
      const res1 = yield await new EffectIterable(add).withArgs(num, num)

      return yield new EffectIterable(add).withArgs(res1, res1)
    }

    it('should return 2', async () => {
      expect(await executeEffects(multipleEI(1))).to.eq(4)
    })
  })

})

describe('testFn', () => {
  context('when testing a single decorated @EffectIterable with Object syntax', () => {
    context('with stubs', () => {
      let addCordinatorFnTest;
      let result;

      beforeEach(async () => {

        async function* addCoordinator(num) {
          const result = yield await TestClass.add(1, 1);
          return result + num;
        }

        addCordinatorFnTest = testFn(addCoordinator)

        result = await addCordinatorFnTest({
          args: [1],
          effects: [
            [TestClass.add(1, 1), returnStub(5)]
          ],
          output: 6
        })
      })

      it('result should return true', () => {
        expect(result).to.eq(true)
      })
    })

    context('integration', () => {
      let addCordinatorFnTest;
      let result;

      beforeEach(async () => {

        async function* addCoordinator(num) {
          const result = yield await TestClass.add(1, 1);
          return result + num;
        }

        addCordinatorFnTest = testFn(addCoordinator)

        result = await addCordinatorFnTest({
          args: [1],
          effects: [
            TestClass.add(1, 1)
          ],
          output: 3
        })
      })

      it('result should return true', () => {
        expect(result).to.eq(true)
      })
    })
  })

  context('when testing multiple ei with Object syntax', () => {
    let addManyTest;
    let result;

    beforeEach(async () => {
      async function* addMany(num) {
        const res1 = yield await new EffectIterable(add).withArgs(num, num);
        const res2 = yield await new EffectIterable(add).withArgs(res1, res1);

        return res2 + num;
      }

      addManyTest = testFn(addMany)

      result = await addManyTest({
        args: [1],
        effects: [
          new EffectIterable(add).withArgs(1, 1).returnStub(2),
          new EffectIterable(add).withArgs(2, 2).returnStub(4),
        ],
        output: 5
      }).catch((err) => result = err)
    })

    it('result should return true', () => {
      expect(result).to.eq(true)
    })
  })

  async function* effectPlusPure(num) {
    const eiResult1 = yield await new EffectIterable(add).withArgs(num, num);
    const eiResult2 = yield await new EffectIterable(add).withArgs(eiResult1, eiResult1);

    return eiResult2 + num;
  }

  async function* effectPlusPureCoordinator(num) {
    const coordinatorResult = yield await effectPlusPure(num)

    return coordinatorResult + num
  }

  context('when testing nested ei with Object syntax', () => {
    let effectPlusPureCoordinatorTest;
    let result;

    beforeEach(async () => {

      effectPlusPureCoordinatorTest = testFn(effectPlusPureCoordinator)

      result = await effectPlusPureCoordinatorTest({
        args: [1],
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
