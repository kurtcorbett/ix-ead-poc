export type UrlLink = string
export type DateString = string

export interface StarWarsCharacter {
  name: string,
  height: string,
  mass: string,
  hair_color: string,
  skin_color: string,
  eye_color: string,
  birth_year: string,
  gender: string,
  homeworld: string,
  films: UrlLink[],
  species: UrlLink[],
  vehicles: UrlLink[],
  starships: UrlLink[],
  created: DateString,
  edited: DateString,
  url: UrlLink
}

export interface PeopleResponse {
  count: string,
	next: UrlLink,
  previous: UrlLink,
  results: StarWarsCharacter[]
}

function swapiStalker(eyeColor: string): StarWarsCharacter[] {
  return IO(getCharacters).with()
    .map((x) => x.next)
    .IO(getNextPage)
    .concatMap((x) => x.results)
    .filter((x) => x.eye_color === eyeColor)
    .map((character) => {
      return zip(
        IO(getHomeWorld).with(character.homeworld),
        map((character) => character),
        (character, homeworld) => ({ ...character, homeworld }),
      )
    })
}

// for await (const character of swapiStalker("blue")) {
//   console.log(character)
// }

function getCharacters() {

}

function getNextPage() {

}

function getHomeWorld() {

}

type Func<A1, A2, A3> = (a1: A1, a2: A2, a3: A3) => any
interface IDoesStuff<T, A1, A2, A3> {
  with: (a1: A1, a2: A2, a3: A3) => IDoesStuff<T, A1, A2, A3>;
  originalFunc: T;
}

function IO<T extends Func<A1, A2, A3>, A1, A2, A3>(
  effectedFunction: Func<A1, A2, A3>,
): IDoesStuff<T, A1, A2, A3> {
  console.log(effectedFunction)
  return class implements IDoesStuff<T, A1, A2, A3> {
    originalFun: Func<A1, A2, A3> = effectedFunc;
    with = (a1: A1, a2: A2, a3: A3) => this
  }
}

function zip(fnA, fnB, cb) {

}

// IO.prototype.with = function() => {}

