export interface LocalStorageData {
    activeCollection: keyof SetCollection | undefined;
    setCollection: SetCollection;
    customsets: CustomSets;
}

export interface SetCollection {
    [collectionName: string]: CustomSets;
}

export interface CustomSets {
    [pokemonName: string]: PokemonSets
}

export interface PokemonSets {
    [setName: string]: PokemonSet;
}

export interface PokemonSet {
    ability?: string;
    isCustomSet?: boolean;
    ivs?: IVRecord;
    item?: string;
    level?: number;
    nature?: string;
    moves?: string[];
    teraType?: string;
}

export interface IVRecord {
    at?: number;
    df?: number;
    hp?: number;
    sa?: number;
    sd?: number;
    sp?: number;
}