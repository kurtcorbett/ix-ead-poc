import { sandbox as sinonSandbox, SinonSandbox, SinonStub } from 'sinon';
import { expect } from 'chai'
import fetch, { Response } from 'node-fetch'

import { testFn, Effect, EffectIterable } from '../../'
import { characters, Luke_Skywalker, Luke_with_home_world, Tatooine_Planet } from './ei.swapi.fixtures'

export class SwapiEIDecorated {

  public static async * getCharacterDetails(hairColor: string) {
    const allCharacters = yield await SwapiEIDecorated.getCharacters()

    const filteredCharacters = allCharacters.filter((c) => c.hair_color === hairColor)

    let homeworlds = [];
    for (const character of filteredCharacters) {
      const homeworld = yield await SwapiEIDecorated.getHomeworld(character.homeworld)
      homeworlds.push(homeworld)
    }

    return filteredCharacters.map((c, index) => {
      return { ...c, homeworld: homeworlds[index].name }
    });
  }

  @Effect
  public static async getCharacters(): Promise<any> {
    const response = await fetch('https://swapi.co/api/people/')

    const result = await response.json()

    return result.results
  }

  @Effect
  public static async getHomeworld(homeworldUrl): Promise<any> {
    const response = await fetch(homeworldUrl)

    return response.json()
  }
}


describe('Swapi', () => {

  it('#getCharacterDetails', () => {
    const testGetCharacterDetails = testFn(SwapiEIDecorated.getCharacterDetails)

    return testGetCharacterDetails({
      args: ['blond'],
      effects: [
        [SwapiEIDecorated.getCharacters(), characters],
        [SwapiEIDecorated.getHomeworld(Luke_Skywalker.homeworld), Tatooine_Planet],
      ],
      output: [Luke_with_home_world],
    })
  })
})


