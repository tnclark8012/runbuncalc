import { CustomSets, SetCollection, LocalStorageData, SetCollectionData } from "./storage.contracts";

export function getActiveSets(): CustomSets {
    let activeCollection = getActiveCollection();
    return activeCollection.customSets;
}

export function getActiveCollectionName(): string {
    let activeCollectionName = getStorageItem('activeCollection');
    let setCollection = getSetCollection();
    if (activeCollectionName && setCollection[activeCollectionName])
        return activeCollectionName as string;

    let fallbackName = Object.keys(setCollection)[0];
    saveActiveCollectionName(fallbackName)
    return fallbackName;
}

export function getActiveCollection(): SetCollectionData {
    let activeCollectionName = getActiveCollectionName();
    let collection = getSetCollection();
    let result = collection[activeCollectionName];
    return result;
}

export function saveActiveCollectionName(name: string): void {
    localStorage.setItem('activeCollection', name);
}

export function saveActiveSetsText(text: string) {
    let activeSets = getSetCollection();
    let activeSetName = getActiveCollectionName();
    activeSets[activeSetName].customSets = JSON.parse(text) as CustomSets;
    saveSetCollection(activeSets);
}

export function addToParty(pokemonId: string): void {
    let party = getParty();
    party.push(pokemonId);
    saveParty(party);
}

export function removeFromParty(pokemonId: string): void {
    let party = getParty();
    let index = party.indexOf(pokemonId);
    if (index !== -1) {
        party.splice(index, 1);
        saveParty(party);
    }
}

export function getParty(): string[] {
    let collection = getActiveCollection();
    return collection.party;
}

export function saveParty(party: string[]): void {
    let collection = getSetCollection();
    let activeSetName = getActiveCollectionName();
    collection[activeSetName].party = party;
    saveSetCollection(collection);
}

export function saveActiveSets(sets: CustomSets) {
    saveActiveSetsText(JSON.stringify(sets));
}

export function saveSetCollection(collection: SetCollection) {
    localStorage.setItem('setCollection', JSON.stringify(collection));
    if (localStorage.customsets)
        localStorage.removeItem('customsets');
}

export function getSetCollection(): SetCollection {
    let storage = getStorageItem('setCollection');
    if (!storage) {
        let activeSet = getStorageItem('customsets');
        storage = {
            "Default": {
                customSets: activeSet || {},
                party: []
            }
        };
    }

    storage = ensureConsistency(storage);
    saveSetCollection(storage);
    return storage;
}

function ensureConsistency(collection: SetCollection | undefined): SetCollection {
    if (!collection)
        return {
            "Default": {
                customSets: {},
                party: []
            }
        };

    for (let key in collection) {
        let collectionData = collection[key];

        if (!collectionData.customSets)
            collectionData.customSets = {};
        if (!collectionData.party)
            collectionData.party = [];

        let customsets = collectionData.customSets;
        const allPokemonIds: string[] = [];
        for (let speciesName in customsets) {
            for (let setName in customsets[speciesName]) {
                allPokemonIds.push(getPokemonId(speciesName, setName));
            }
        }

        collectionData.party = collectionData.party.filter(pokemonId => allPokemonIds.includes(pokemonId));
    }

    return collection;
}

function getStorageItem<Key extends keyof LocalStorageData>(key: Key): LocalStorageData[Key] {
    let content = localStorage.getItem(key);
    try {
        return JSON.parse(content || "null");
    }
    catch (e) {
        return content as any;
    }
}

export function getPokemonId(speciesName: string, setName: string): string {
	return `${speciesName} (${setName})`;
}