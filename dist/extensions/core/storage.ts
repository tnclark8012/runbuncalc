import { CustomSets, SetCollection, LocalStorageData } from "./storage.contracts";

export function getActiveSets(): CustomSets {
    let activeCollectionName = getActiveCollectionName();
    let collection = getSetCollection();
    if (!activeCollectionName || !collection)
        return {};

    return collection[activeCollectionName];
}

export function getActiveCollectionName(): string {
    let activeCollectionName = getStorageItem('activeCollection');
    if (activeCollectionName)
        return activeCollectionName;

    return Object.keys(getSetCollection())[0];
}

export function saveActiveCollectionName(name: string): void {
    localStorage.setItem('activeCollection', name);
}

export function saveActiveSetsText(text: string) {
    let activeSets = getSetCollection();
    let activeSetName = getActiveCollectionName();
    activeSets[activeSetName] = JSON.parse(text);
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
    let party = localStorage.getItem('party');
    if (party)
        return JSON.parse(party);
    
    return [];
}

export function saveParty(party: string[]): void {
    localStorage.setItem('party', JSON.stringify(party));
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
        let activeSet = JSON.parse(getStorageItem('customsets') || "{}");
        return {
            "Default": activeSet
        };
    }
    return JSON.parse(storage);
}

function getStorageItem(key: keyof LocalStorageData): string | null {
    return localStorage.getItem(key);
}