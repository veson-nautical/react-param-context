import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import { StateAndSetter } from "../state-types";
import { useDeepMemo } from "../use-deep-memo";

export function useLocalStorage<T>(
    key: string, 
    defaultValue: T
) {
    const storedItem = window.localStorage.getItem(key);
    const [item, setItem] = useState<T>(storedItem ? JSON.parse(storedItem) : defaultValue);
    const deepDefault = useDeepMemo(() => defaultValue, [defaultValue]);
    const deepItem = useDeepMemo(() => item, [item]);

    const initializedKey = useRef(key);
    useEffect(() => {
        if (initializedKey.current !== key) {
            const storedItem = window.localStorage.getItem(key);
            setItem(storedItem ? JSON.parse(storedItem) : deepDefault);
            initializedKey.current = key;
        }
    }, [key, setItem, deepDefault]);

    const usingStorage = useMemo(() => {
        return JSON.stringify(deepItem) !== JSON.stringify(deepDefault)
    }, [deepItem, deepDefault]);

    useEffect(() => {
        const itemString = JSON.stringify(deepItem);
        window.localStorage.setItem(key, itemString);
    }, [key, deepItem]);
    
    const removeItem = useCallback(() => {
        window.localStorage.removeItem(key);
        setItem(deepDefault);
    }, [key, setItem, deepDefault])
    
    return {
        value: deepItem,
        set: setItem,
        remove: removeItem,
        usingStorage
    };
}

export function useLocalStorageState<T>(
    key: string,
    defaultValue: T
) {
    const { value, set } = useLocalStorage<T>(key, defaultValue);
    return [ value, set ] as StateAndSetter<T>;
}