import { createClient } from 'edgedb';
import e from '../dbschema/edgeql-js';

const client = createClient();

const query = e.params(
  {
    characters: e.array(
      e.tuple({
        portrayed_by: e.str,
        name: e.str,
        movies: e.array(e.str),
      }),
    ),
  },
  (params) => {
    const movies = e.for(
      e.op(
        'distinct',
        e.array_unpack(e.array_unpack(params.characters).movies),
      ),
      (movieTitle) => {
        return e
          .insert(e.Movie, {
            title: movieTitle,
          })
          .unlessConflict((movie) => ({
            on: movie.title,
            else: movie,
          }));
      },
    );
    return e.with(
      [movies],
      e.for(e.array_unpack(params.characters), (character) => {
        return e.insert(e.Character, {
          name: character.name,
          portrayed_by: character.portrayed_by,
          movies: e.assert_distinct(
            e.select(movies, (movie) => ({
              filter: e.op(movie.title, 'in', e.array_unpack(character.movies)),
            })),
          ),
        }).unlessConflict((o) => ({
          on: o.name,
          else: o,
        }));
      }),
    );
  },
);

const data = {
  characters: [
    {
      portrayed_by: 'Robert Downey Jr.',
      name: 'Iron Man',
      movies: ['Iron Man', 'Iron Man 2', 'Iron Man 3'],
    },
    {
      portrayed_by: 'Chris Evans',
      name: 'Captain America',
      movies: [
        'Captain America: The First Avenger',
        'The Avengers',
        'Captain America: The Winter Soldier',
      ],
    },
    {
      portrayed_by: 'Mark Ruffalo',
      name: 'The Hulk',
      movies: ['The Avengers', 'Iron Man 3', 'Avengers: Age of Ultron'],
    },
  ],
};

console.log(
  await query.run(client, data),
);
