import { sandbox as sinonSandbox, SinonSandbox, SinonStub } from 'sinon';
import { expect } from 'chai'
import fetch, { Response } from 'node-fetch'

import { testFn, Effect, EffectIterable } from '../../'
import { characters, Luke_Skywalker, Luke_with_home_world, Tatooine_Planet } from './ei.swapi.fixtures';


export class SwapiTraditional {

  public static async getCharacterDetails(hairColor: string) {
    const allCharacters = await SwapiTraditional.getCharacters()

    const filteredCharacters = allCharacters.filter((c) => c.hair_color === hairColor)

    let homeworlds = [];
    for (const character of filteredCharacters) {
      const homeworld = await SwapiTraditional.getHomeworld(character.homeworld)
      homeworlds.push(homeworld)
    }

    return filteredCharacters.map((c, index) => {
      return { ...c, homeworld: homeworlds[index].name }
    });
  }

  public static async getCharacters(): Promise<any> {
    const response = await fetch('https://swapi.co/api/people/')

    const result = await response.json()

    return result.results
  }

  public static async getHomeworld(homeworldUrl): Promise<any> {
    const response = await fetch(homeworldUrl)

    return response.json()
  }
}

describe('SwapiTraditional', () => {
  describe('#getCharacterDetails', () => {
    let sandbox: SinonSandbox
    let result
    let getCharactersStub: SinonStub
    let getHomeworldStub: SinonStub

    beforeEach(async () => {
      sandbox = sinonSandbox.create()

      getCharactersStub = sandbox.stub(SwapiTraditional, 'getCharacters')
      getCharactersStub.resolves(characters)

      getHomeworldStub = sandbox.stub(SwapiTraditional, 'getHomeworld')
      getHomeworldStub.resolves(Tatooine_Planet)

      result = await SwapiTraditional.getCharacterDetails('blond')
    })

    afterEach(() => {
      sandbox.restore()
    })

    it('calls #getCharacters', () => {
      expect(getCharactersStub).to.be.calledOnce
    })

    it('calls #getHomeworld', () => {
      expect(getHomeworldStub).to.be.calledOnce.calledWithExactly(Luke_Skywalker.homeworld)
    })

    it('returns the correct result', () => {
      expect(result).to.have.deep.members([Luke_with_home_world])
    })
  })
})