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
    /**
     * A map of named parameter [state, setter] pairs to set as the parameter context
     */
    providers: ParameterProviderRegistry<T>;
    /**
     * A set of migrations to run to the parameters on start up. This
     * is used to handle cases where the application has changed how it stores data
     * and wants to update state of older versions.
     */
    migrations?: ParameterMigration<T, any>[];
}

export const ParameterContext = React.createContext<ParameterContextType>(null!);

function mapObjectValues<T>(obj: any, transform: (entry: any) => any) {
    return Object.fromEntries(Object.entries(obj).map(([key,value]: any) => [key, transform(value)])) as T;
}

export interface ParameterContextProvierParams<T=any> extends ParameterContextType<T> {
    loader?: React.ReactNode;
    /**
     * Additional state that should trigger migrations to run when it changes
     */
    additionalMigrationTrigger?: any;
}

function runMigrations<T = any>(
    providers: ParameterProviderRegistry<T>, 
    migrations: ParameterMigration<T, any>[]
) {
    const params = mapObjectValues<T>(providers, ([value]) => value);
    const migrationsByParam = makeMap(migrations, m => m.paramName);
    for (const paramName of migrationsByParam.keys()) {
        const [val, setVal] = providers[paramName as keyof T];
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
            console.log(`Ran ${count} migration(s) for parameter ${paramName}`,
                val, '==>', currentVal);
            setVal(currentVal);
        }
    }
}

export function ParameterContextProvider<T=any>({
    providers, 
    migrations, 
    additionalMigrationTrigger,
    loader, 
    children
}: React.PropsWithChildren<ParameterContextProvierParams<T>>) {
    const appliedMigrations = useRef(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        appliedMigrations.current = false;
    }, [additionalMigrationTrigger]);

    useEffect(() => {
        if (!appliedMigrations.current && migrations && migrations.length > 0) {
            runMigrations(providers, migrations);
        }
        appliedMigrations.current = true;
        setLoaded(true);
    }, [migrations, providers, setLoaded, additionalMigrationTrigger]);

    if (!loaded) return <>{loader ?? "Migrating global state..."}</>;
    return <ParameterContext.Provider value={{providers}}>{children}</ParameterContext.Provider>;
}
