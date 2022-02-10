import equal from "lodash.isequal";

export interface Encoder<T=any> {
    encode: (val:T, defaultValue: T) => string;
    decode: (val:string, defaultValue: T) => T;
}

export const SimpleJsonEncoder : Encoder = {
    encode: (val) => {
        return JSON.stringify(val);
    },
    decode: (val: string) => {
        if (!val) return undefined;
        return JSON.parse(val);
    }
}

export const EfficientJsonEncoder : Encoder = {
    encode: (val: any, defaultValue: any) => {
        const result : any = {};
        for (const k in val) {
            if (k in defaultValue && equal(val[k], defaultValue[k])) {
                continue;
            }
            result[k] = val[k];
        }
        return JSON.stringify(result);
    },
    decode: (val: string, defaultValue: any) => {
        if (!val || val === '') return defaultValue;
        let result = { };
        try {
            result = JSON.parse(val);
        } catch (e) {
            /* ignore errors, returning undefined */
        }
        return {
            ...defaultValue,
            ...result
        };
    }
}

export const StringEncoder : Encoder<string> = {
    encode: (val: string) => val,
    decode: (val: string) => val
}

export const NumberEncoder : Encoder<number> = {
    encode: (val: number) => val.toString(),
    decode: (val: string) => parseFloat(val)
}

export const BoolEncoder : Encoder<boolean> = {
    encode: (val: boolean) => val ? 'true' : 'false',
    decode: (val: string) => val === 'true'
}

export function wrapBase64Encoder<T=any>(encoder: Encoder<T>) {
    return {
        encode: (val: T, defaultValue: any) => {
            const encoded = encoder.encode(val, defaultValue);
            return encoded ? btoa(encoded) : encoded;
        },
        decode: (val: string, defaultValue: any) => {
            return val ?
                encoder.decode(atob(val), defaultValue) :
                encoder.decode(val, defaultValue);
        }
    } as Encoder<T>
}