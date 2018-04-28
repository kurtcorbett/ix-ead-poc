import { Effect } from "../..";
import fetch, { Response } from 'node-fetch';

export class SwapiEI {

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

  public static async * getCharacterDetails(hairColor: string) {
    const allCharacters = yield await SwapiEI.getCharacters()

    const filteredCharacters = allCharacters.filter((c) => c.hair_color === hairColor)

    let homeworlds = [];
    for (const character of filteredCharacters) {
      const homeworld = yield await SwapiEI.getHomeworld(character.homeworld)
      homeworlds.push(homeworld)
    }

    return filteredCharacters.map((c, index) => {
      return { ...c, homeworld: homeworlds[index].name }
    });
  }
}

