import { expect } from 'chai';
import { Luke_Skywalker, Leia_Organa, R2_D2, C_3PO } from 'specs/fixtures'
import { StarWarsCharacter, PeopleResponse } from 'src/app'


describe('swapiStalker()', () => {

  describe('on success', () => {
    const pg1Characters: StarWarsCharacter[] = [
      Luke_Skywalker,
      Leia_Organa,
    ]

    const pg2Characters: StarWarsCharacter[] = [
      R2_D2,
      C_3PO,
    ]

    const responsePg1: PeopleResponse = { 
      count: "87",
      next: "https://swapi.co/api/people/?page=2",
      previous: null,
      results: pg1Characters,
    }

    const responsePg2: PeopleResponse = { 
      count: "87",
      next: "https://swapi.co/api/people/?page=3",
      previous: "https://swapi.co/api/people/?page=1",
      results: pg1Characters,
    }

    const mockWorld1 = mock(world, '1')
    const mockWorld2 = mock(world, '2')

    IO(swapiStalker).with('blue')
      .calls(getcharacters).with()
        .whichYieldsMock(responsePg1)
      .calls(getNextPage).with(responsePg1.next)
        .whichYieldsMock(responsePg2)
      .calls(getHomeWorld).withSequence([ Luke_Skywalker.homeworld ])
        .whichYieldsSequence([ mockWorld1 ])
      .returns([ { ...Luke_Skywalker, homeworld: mockWorld1 } ])
  })
})