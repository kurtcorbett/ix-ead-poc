import { testFn, returnStub, Effect, EffectIterable } from '../../'
import { SwapiEI } from './ei.swapi';
import { characters, Luke_Skywalker, Luke_with_home_world, Tatooine_Planet } from './ei.swapi.fixtures';




describe('#swapi EffectIterable', () => {

  context('characters with blonde hair with resolved homeworld', () => {

    describe('unit', () => {

      it('happy path', async () => {
        const testGetCharacterDetails = testFn(SwapiEI.getCharacterDetails)

        return testGetCharacterDetails({
          args: ['blond'],
          effects: [
            [ SwapiEI.getCharacters(), characters ],
            [ SwapiEI.getHomeworld(Luke_Skywalker.homeworld), returnStub(Tatooine_Planet) ],
          ],
          output: [ Luke_with_home_world ],
        })
      })
    })

    describe.skip('integration', () => {

      it('happy path', async () => {
        const testGetCharacterDetails = testFn(SwapiEI.getCharacterDetails)

        return testGetCharacterDetails({
          args: ['blond'],
          effects: [
            // If not an array, will invoke actual coordinator effects
            SwapiEI.getCharacters(),
            SwapiEI.getHomeworld(Luke_Skywalker.homeworld),
          ],
          output: [ Luke_with_home_world ],
        })
      })
    })
  })
})
