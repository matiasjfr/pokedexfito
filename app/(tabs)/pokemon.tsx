import { ThemedText } from "@/components/ThemedText";
import type { Pokemon } from "@/types/pokemon";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAudioPlayer } from "expo-audio";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

// Helper to get the cry audio url from the API response
function getCryUrl(pokemon: Pokemon): string | undefined {
  // PokeAPI v2 does not provide cry url directly, but the v2/pokemon/{id} response has a 'cries' field
  // Example: cries: { latest: "https://.../cries/latest/1.ogg", legacy: "..." }
  // If not present, fallback to a constructed url (for gen 1-9)
  // https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{id}.ogg
  // See: https://github.com/PokeAPI/cries
  // @ts-ignore
  if (pokemon.cries?.latest) return pokemon.cries.latest;
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`;
}

interface Evolution {
  id: number;
  name: string;
  img: string | null;
}

export default function PokemonDetailScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { pokemonId } = route.params as { pokemonId: number };
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const player = useAudioPlayer(audioUrl || undefined);
  const [moves, setMoves] = useState<string[]>([]);
  const [evolutions, setEvolutions] = useState<Evolution[]>([]);
  const router = useRouter();

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        // 1. Info principal
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon/${pokemonId}`
        );
        const data: Pokemon = await res.json();
        setPokemon(data);
        // 2. Ataques
        setMoves(data.moves?.map((m: any) => m.move.name) || []);
        // 3. Evoluciones
        const speciesRes = await fetch(
          `https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`
        );
        const species = await speciesRes.json();
        const evoRes = await fetch(species.evolution_chain.url);
        const evoData = await evoRes.json();
        // Recorrer la cadena de evolución
        const evoList: Evolution[] = [];
        function walk(chain: any) {
          if (!chain) return;
          const pokeName = chain.species.name;
          const pokeId = Number(
            chain.species.url.split("/").filter(Boolean).pop()
          );
          evoList.push({
            id: pokeId,
            name: pokeName,
            img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokeId}.png`,
          });
          if (chain.evolves_to && chain.evolves_to.length > 0) {
            chain.evolves_to.forEach(walk);
          }
        }
        walk(evoData.chain);
        setEvolutions(evoList);
      } catch {
        setError("No se pudo cargar el Pokémon");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
    return () => {};
  }, [pokemonId]);

  const playCry = async () => {
    if (!pokemon) return;
    const url = getCryUrl(pokemon);
    if (!url) return;
    setAudioUrl(url);
    setPlaying(true);
    try {
      await player.replace(url);
      await player.seekTo(0);
      await player.play();
      // Esperar a que termine
      const check = setInterval(async () => {
        if (!player.playing) {
          setPlaying(false);
          clearInterval(check);
        }
      }, 300);
    } catch {
      setPlaying(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  if (error || !pokemon)
    return (
      <View style={styles.center}>
        <ThemedText>{error || "No encontrado"}</ThemedText>
      </View>
    );

  const img =
    pokemon.sprites.other?.["official-artwork"]?.front_default ||
    pokemon.sprites.front_default;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backBtn}
      >
        <Ionicons name="arrow-back" size={28} color="#222" />
      </TouchableOpacity>
      <Image
        source={{ uri: img || undefined }}
        style={styles.pokeImg}
        resizeMode="contain"
      />
      <ThemedText type="title" style={styles.name}>
        {capitalize(pokemon.name)} #{pokemon.id}
      </ThemedText>
      <View style={styles.typeRow}>
        {pokemon.types.map((t) => (
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
      <View style={styles.infoRow}>
        <ThemedText>Peso: {pokemon.weight / 10} kg</ThemedText>
        <ThemedText>Altura: {pokemon.height / 10} m</ThemedText>
      </View>
      <TouchableOpacity
        style={styles.cryBtn}
        onPress={playCry}
        disabled={playing}
      >
        <Ionicons name="volume-high" size={28} color="#fff" />
        <ThemedText style={styles.cryText}>
          {playing ? "Reproduciendo..." : "Escuchar grito"}
        </ThemedText>
      </TouchableOpacity>

      {/* Evoluciones */}
      {evolutions.length > 1 && (
        <View style={{ marginTop: 24, width: "100%" }}>
          <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
            Evoluciones
          </ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {evolutions.map((evo) => (
              <TouchableOpacity
                key={evo.id}
                style={{ alignItems: "center", width: 90 }}
                disabled={evo.id === pokemon.id}
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/pokemon",
                    params: { pokemonId: evo.id },
                  })
                }
              >
                <Image
                  source={{ uri: evo.img || undefined }}
                  style={{ width: 60, height: 60 }}
                />
                <ThemedText
                  style={{
                    fontSize: 13,
                    marginTop: 2,
                    opacity: evo.id === pokemon.id ? 0.5 : 1,
                  }}
                >
                  {capitalize(evo.name)}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Ataques */}
      {moves.length > 0 && (
        <View style={{ marginTop: 24, width: "100%" }}>
          <ThemedText type="subtitle" style={{ marginBottom: 8 }}>
            Ataques
          </ThemedText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {moves.map((m) => (
              <View
                key={m}
                style={{
                  backgroundColor: "#eee",
                  borderRadius: 8,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  marginBottom: 4,
                }}
              >
                <ThemedText style={{ fontSize: 13 }}>
                  {capitalize(m.replace("-", " "))}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
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
  container: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#fff",
    minHeight: "100%",
  },
  backBtn: {
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  pokeImg: {
    width: 180,
    height: 180,
    marginBottom: 12,
  },
  name: {
    marginBottom: 8,
    textAlign: "center",
  },
  typeRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 8,
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
  infoRow: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 16,
  },
  cryBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0a7ea4",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 12,
  },
  cryText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
