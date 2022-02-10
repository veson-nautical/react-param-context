import { useContext } from 'react';
import { useDeepMemo } from "./use-deep-memo";
import { StateAndSetter } from "./state-types";
import { ParameterContext } from "./parameter-context";

export const NO_OP_FUNCTION = () => {}; // eslint-disable-line @typescript-eslint/no-empty-function

export function useParameter<T, K extends keyof T>(name: K) {
    const { providers } = useContext(ParameterContext);
    if (!(name in providers)) {
        console.warn(`Parameter ${name} was not registered! Add it to the ParameterContext`);
    }
    const [value, setValue] = providers[name] ?? [undefined, NO_OP_FUNCTION];
    const memoValue = useDeepMemo(() => value, [value]);
    return [memoValue, setValue] as StateAndSetter<T[K]>;
}

export function useParameterOfType<T>(name: string) {
    return useParameter<any, any>(name) as StateAndSetter<T>;
}
