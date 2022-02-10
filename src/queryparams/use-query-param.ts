import React, { useCallback, useMemo } from 'react';
import equal from 'lodash.isequal';
import { useHistory, useLocation } from "react-router-dom";
import { Encoder } from "./encoders";
import { parse, ParseOptions, stringify } from "query-string";
import { StateAndSetter } from "../state-types";

export function withoutKeys<T = any, K extends keyof T=any>(obj: T, ...keys: K[]) : Omit<T, K> {
    const newObj : any = {};
    for (const key in obj) {
        if (!keys.includes(key as any)) {
            newObj[key] = obj[key];
        }
    }
    return newObj;
}

export function isFunctionAction<T>(action: React.SetStateAction<T>) : action is (prevState: T) => T {
    return typeof action === 'function';
}

const QueryParamParseOptions : ParseOptions = {
    arrayFormat: 'none'
}

function getSearchParams(search: string) {
    return parse(search, QueryParamParseOptions);
}

function getSearchParam<T>(params: any, param: string, encoder: Encoder, defaultValue: T): T {
    return param in params ?
        encoder.decode(params[param] as string, defaultValue) :
        defaultValue;
}

export function useQueryParameter<T>(param: string, defaultValue: T, encoder: Encoder, push?: boolean) {
    const location = useLocation();
    const value = useMemo(() =>
            getSearchParam(getSearchParams(location.search), param, encoder, defaultValue),
        [location, param, encoder, defaultValue]);
    const history = useHistory();
    const setValue = useCallback((action: React.SetStateAction<T>) => {
        const params = getSearchParams(window.location.search);
        const value = getSearchParam(params, param, encoder, defaultValue);
        const data = isFunctionAction(action) ? action(value) : action;
        const isDefault = equal(data, defaultValue);
        const encodedData = encoder.encode(data, defaultValue);
        let newSearch: string | undefined = undefined;
        if (isDefault && param in params) {
            newSearch = stringify(withoutKeys(params, param), QueryParamParseOptions);
        } else if (!isDefault && (!(param in params) || params[param] !== encodedData)) {
            newSearch = stringify({
                ...params,
                [param]: encodedData
            }, QueryParamParseOptions);
        }
        if (newSearch !== undefined) {
            if (push) {
                history.push({ search: newSearch });
            } else {
                history.replace({ search: newSearch });
            }
        }
    }, [param, encoder, defaultValue, push, history]);

    return [value, setValue] as StateAndSetter<T>
}

