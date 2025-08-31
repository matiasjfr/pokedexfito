import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import type { Pokemon, PokemonListResult } from "@/types/pokemon";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const POKEAPI_URL = "https://pokeapi.co/api/v2/pokemon?limit=649";

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchPokemons() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(POKEAPI_URL);
        const data: PokemonListResult = await res.json();
        // Fetch details for each pokemon (parallel)
        const details = await Promise.all(
          data.results.map(async (poke) => {
            const res = await fetch(poke.url);
            return (await res.json()) as Pokemon;
          })
        );
        setPokemonList(details);
      } catch {
        setError("Error al cargar los pokemones");
      } finally {
        setLoading(false);
      }
    }
    fetchPokemons();
  }, []);

  const filtered = useMemo(() => {
    return pokemonList.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, pokemonList]);

  const router = useRouter();
  const renderItem = useCallback(
    ({ item }: { item: Pokemon }) => {
      const img =
        item.sprites.other?.["official-artwork"]?.front_default ||
        item.sprites.front_default;
      return (
        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: "/(tabs)/pokemon",
              params: { pokemonId: item.id },
            })
          }
        >
          <Image
            source={{ uri: img || undefined }}
            style={styles.pokeImg}
            resizeMode="contain"
          />
          <ThemedText type="subtitle" style={styles.pokeName}>
            #{item.id} {capitalize(item.name)}
          </ThemedText>
          <View style={styles.typeRow}>
            {item.types.map((t) => (
              <View
                key={t.type.name}
                style={[
                  styles.typeBadge,
                  { backgroundColor: typeColor(t.type.name) },
                ]}
              >
                <ThemedText style={styles.typeText}>
                  {typeNameEs(t.type.name)}
                </ThemedText>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      );
    },
    [router]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={{ flex: 1 }}>
          Pokédex
        </ThemedText>
        <TextInput
          placeholder="Buscar Pokémon..."
          value={search}
          onChangeText={setSearch}
          style={styles.search}
          placeholderTextColor="#aaa"
        />
      </ThemedView>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <ThemedText>{error}</ThemedText>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Mapeo de tipos a español
const TYPE_ES: Record<string, string> = {
  normal: "Normal",
  fire: "Fuego",
  water: "Agua",
  electric: "Eléctrico",
  grass: "Planta",
  ice: "Hielo",
  fighting: "Lucha",
  poison: "Veneno",
  ground: "Tierra",
  flying: "Volador",
  psychic: "Psíquico",
  bug: "Bicho",
  rock: "Roca",
  ghost: "Fantasma",
  dragon: "Dragón",
  dark: "Siniestro",
  steel: "Acero",
  fairy: "Hada",
};

function typeNameEs(type: string): string {
  return TYPE_ES[type] || capitalize(type);
}

function typeColor(type: string): string {
  switch (type) {
    case "fire":
      return "#F08030";
    case "water":
      return "#6890F0";
    case "grass":
      return "#78C850";
    case "electric":
      return "#F8D030";
    case "psychic":
      return "#F85888";
    case "ice":
      return "#98D8D8";
    case "dragon":
      return "#7038F8";
    case "dark":
      return "#705848";
    case "fairy":
      return "#EE99AC";
    case "normal":
      return "#A8A878";
    case "fighting":
      return "#C03028";
    case "flying":
      return "#A890F0";
    case "poison":
      return "#A040A0";
    case "ground":
      return "#E0C068";
    case "rock":
      return "#B8A038";
    case "bug":
      return "#A8B820";
    case "ghost":
      return "#705898";
    case "steel":
      return "#B8B8D0";
    default:
      return "#68A090";
  }
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  search: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 16,
    marginLeft: 12,
    color: "#222",
  },
  list: {
    padding: 8,
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    margin: 8,
    borderRadius: 16,
    alignItems: "center",
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  pokeImg: {
    width: 90,
    height: 90,
    marginBottom: 8,
  },
  pokeName: {
    marginBottom: 4,
    textAlign: "center",
  },
  typeRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
  },
  typeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
