// Types for PokeAPI responses
export interface PokemonListResult {
  count: number;
  next: string | null;
  previous: string | null;
  results: {
    name: string;
    url: string;
  }[];
}

export interface PokemonType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

export interface PokemonSprites {
  front_default: string | null;
  other?: {
    "official-artwork"?: {
      front_default: string | null;
    };
  };
}

export interface Pokemon {
  id: number;
  name: string;
  sprites: PokemonSprites;
  types: PokemonType[];
  height: number;
  weight: number;
  moves: { move: { name: string; url: string } }[];
}
