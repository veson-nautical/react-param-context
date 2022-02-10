import React, { useEffect, useRef, useState } from "react";
import { StateAndSetter } from "./state-types";
import { makeMap } from "./make-map";


export type ParameterProviderRegistry<T=any> = {
    [K in keyof T]: StateAndSetter<T[K]>
};

export type ExtractParameterType<T> = T extends StateAndSetter<infer U> ? U : never;

export type ExtractParametersType<T> = {
    [K in keyof T]: ExtractParameterType<T[K]>
};

export interface ParameterMigration<T, K extends keyof T> {
    paramName: K;
    condition?: (param: T[K], params: T) => boolean;
    update: (param: T[K], params: T) => T[K]
}

export function parameterMigration<T, K extends keyof T>(
    paramName: K,
    condition: (param: T[K], params: T) => boolean,
    update: (param: T[K], params: T) => T[K]
) : ParameterMigration<T, K> {
    return {
        paramName,
        update,
        condition
    }
}

export function migrationFactoryForType<T>() {
    return <K extends keyof T>(
        paramName: K,
        condition: (param: T[K], params: T) => boolean,
        update: (param: T[K], params: T) => T[K]
    ): ParameterMigration<T, K> => {
        return parameterMigration(paramName, condition, update);
    }
}

export interface ParameterContextType<T=any> {
    providers: ParameterProviderRegistry<T>;
    migrations?: ParameterMigration<T, any>[];
}

export const ParameterContext = React.createContext<ParameterContextType>(null!);

function mapObjectValues<T>(obj: any, transform: (entry: any) => any) {
    return Object.fromEntries(Object.entries(obj).map(([key,value]: any) => [key, transform(value)])) as T;
}

export function ParameterContextProvider<T=any>({
    providers, 
    migrations, 
    loader, 
    children
}: React.PropsWithChildren<ParameterContextType<T> & { loader: React.ReactNode; }>) {
    const appliedMigrations = useRef(false);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        if (!appliedMigrations.current && migrations && migrations.length > 0) {
            const params = mapObjectValues<T>(providers, ([value]) => value);
            const migrationsByParam = makeMap(migrations, m => m.paramName);
            for (const paramName of migrationsByParam.keys()) {
                const [val,setVal] = providers[paramName as keyof T];
                let currentVal = val;
                let count = 0;
                const migrations = migrationsByParam.get(paramName) ?? [];
                for (const migration of migrations) {
                    const { condition, update } = migration;
                    if (!condition || condition(val, params)) {
                        currentVal = update(currentVal, params);
                        count += 1;
                    }
                }
                if (count > 0) {
                    console.log(`Ran ${count} migration(s) for parameter ${paramName}`, val, '==>', currentVal);
                    setVal(currentVal);
                }
            }
        }
        appliedMigrations.current = true;
        setLoaded(true);
    }, [migrations, providers, setLoaded]);

    if (!loaded) return <>{loader ?? "Migrating global state..."}</>;
    return <ParameterContext.Provider value={{providers}}>{children}</ParameterContext.Provider>;
}
