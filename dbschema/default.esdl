module default {
  type Character {
    required name: str {
      constraint exclusive;
    }
    portrayed_by: str;
    multi movies: Movie;
  }

  type Movie {
    required title: str {
      constraint exclusive;
    };
    release_year: int64;
  }
}
