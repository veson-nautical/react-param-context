import React, { useState } from 'react';
import '@testing-library/jest-dom';
import '@testing-library/jest-dom/extend-expect';
import { fireEvent, screen } from '@testing-library/react';
import {
    ExtractParametersType,
    migrationFactoryForType,
    NumberEncoder,
    ParameterContextProvider,
    SimpleJsonEncoder,
    useLocalStorageState,
    useParameter,
    useQueryParameter
} from "../src";
import { renderTest, setupTest } from "./test-setup-utils";


function useTestParamsProvider() {
    return {
        storeNone:      useState(undefined as (string | undefined)),
        storeQPush:     useQueryParameter('storeQPush', 4, NumberEncoder, true),
        storeQReplace:  useQueryParameter('storeQReplace', { abc: 123 }, SimpleJsonEncoder),
        storeLocal:     useLocalStorageState('storeLocal', 'abc')
    }
}

export type TestParamsType = ExtractParametersType<ReturnType<typeof useTestParamsProvider>>;

const migration = migrationFactoryForType<TestParamsType>();

const TestMigrations = [
    migration('storeLocal', () => true, v => v + 'def')
];

export function useTestParam<K extends keyof TestParamsType>(param: K) {
    return useParameter<TestParamsType, K>(param);
}

const TestPage : React.FC<{migrations?: any}> = ({migrations}) => {
    return <ParameterContextProvider 
            loader={<>Loading parameter state...</>}
            providers={useTestParamsProvider()} 
            migrations={migrations ?? []}>
        <ParamTestComponent name="storeNone" setTo="something"/>
        <ParamTestComponent name="storeQPush" setTo={7}/>
        <ParamTestComponent name="storeQReplace" setTo={{ def: 234 }}/>
        <ParamTestComponent name="storeLocal" setTo="def"/>
    </ParameterContextProvider>
}

const ParamTestComponent : React.FC<{name: keyof TestParamsType, setTo: any}> = ({name, setTo}) => {
    const [val, setVal] = useTestParam(name);
    return <div>
        <label data-testid={`${name}-label`}>{JSON.stringify(val)}</label>
        <button data-testid={`${name}-button`} onClick={() => setVal(setTo)}>set</button>
    </div>;
}

beforeEach(() => {
    window.localStorage.removeItem('storeLocal');
});

describe('useParameter hook', () => {
    
    test('can set and get all types of parameters', async () => {
        renderTest(<TestPage />);

        async function testCanSetParam(name: string, initialValue: any, setValue: any) {
            const element = await screen.findByTestId(`${name}-label`);
            expect(element.textContent).toBe(initialValue ? JSON.stringify(initialValue) : '');
            fireEvent.click(screen.getByTestId(`${name}-button`));
            expect(screen.getByTestId(`${name}-label`).textContent).toBe(setValue ? JSON.stringify(setValue) : '');
        }

        // test params get set properly
        await testCanSetParam('storeNone', undefined, 'something');
        await testCanSetParam('storeQPush', 4, 7);
        await testCanSetParam('storeQReplace', { abc: 123 }, { def: 234 });
        await testCanSetParam('storeLocal', 'abc', 'def');
    });

    test('query param is read correctly', () => {
        const { render, history } = setupTest(<TestPage />);
        history.push("/home?storeQPush=9");
        render();

        expect(screen.getByTestId(`storeQPush-label`).textContent).toBe('9');
    });

    test('localstorage param is read correctly', () => {
        const { render } = setupTest(<TestPage />);
        window.localStorage.setItem('storeLocal', JSON.stringify('efg'));
        render();

        expect(screen.getByTestId(`storeLocal-label`).textContent).toBe(JSON.stringify('efg'));
    });

    test('migrations run', async () => {
        renderTest(<TestPage migrations={TestMigrations} />);

        const storeLocalLabel = await screen.findByTestId(`storeLocal-label`);
        expect(storeLocalLabel.textContent).toBe(JSON.stringify('abcdef'));
        expect(window.localStorage.getItem('storeLocal')).toBe(JSON.stringify('abcdef'));
    });

});

