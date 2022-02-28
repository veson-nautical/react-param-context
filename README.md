# React Parameter Context
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/veson-nautical/react-param-context/blob/main/LICENSE) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg) [![Build](https://github.com/veson-nautical/react-param-context/actions/workflows/build.yml/badge.svg)](https://github.com/veson-nautical/react-param-context/actions/workflows/build.yml)

This library implements a pattern to declare global state for an application and configure how to initialize that state (ex via query params, localstorage, in-memory, api call) and migrate it as the application changes. It solves a common use case of handling global state without requiring a full
implementation of a flux/redux architecture. Most of your state can stay at the component level. It can serve as an in-between for component-only state and flux libraries.g

## Installation

`npm install react-param-context`

## Usage

Say you have an application that pages through data, opens a sidebar, and allows selecting some favorites. You can declare the global state and defaults in a hook like so

```tsx
function useGlobalParams() {
  return {
    // currentPage will come from the query parameter as in ?page=3
    currentPage:    useQueryParameter('page', 0, NumberEncoder),
    // sidebar open/closed will be stored in memory
    isSidebarOpen:  useState(false),
    // the favorite items will be stored in browser local storage
    favoriteIds:    useLocalStorageState('favoriteIds', [] as string[])
  }
}
```

You could pull in this context and expose it globally using a standard React context. That is largely what this library provides plus a few useful helpers and typing.

```tsx
import { ParameterContextProvider } from 'react-param-context';

function App() {
  const params = useGlobalParams();
  return <ParameterContextProvider providers={params}>
    ...appliction content here
  </ParameterContextProvider>
}
```

Add a little bit of type magic to get a type-safe global param hook

```ts
import { ExtractParametersType, useParameter } from 'react-param-context';

export type AppParamsType = ExtractParametersType<ReturnType<typeof useGlobalParams>>;

export function useAppParameter<K extends keyof AppParamsType>(param: K) {
    return useParameter<AppParamsType, K>(param);
}
```

now you can use the parameters above in a type safe way

```tsx
// the typing above will mean ts can infer the datatype here and
// also enforce that you only provide valid, known parameter keys
const [page, setPage] = useAppParameter('currentPage'); 
```

Since all of the state declarations in useGlobalParams were of type [state, setState] you can use
them interchangeably and will be able to swap the parameter type (queryparam, localstorage, in-memory, custom) without changing any other code in the application.

This pattern works best when the global state parameters are totally independant from each other.
If there are useEffects kicked off from these you likely will end up with a messy situation. 
If indeed you have use cases where there are complex interactions around the global parameters you can add a useReducer in your useGlobalParams hook or start incorporating redux.

## Migrations

Aside from static typing, react-param-context also implements a declarative migration mechanism where you can update stale state as the application gets developed.

Let's say from the example above that we made a mistake and the favorite id column is actually numeric not string.

if we changed our useGlobalParams hook to have
```ts
favoriteIds:    useLocalStorageState('favoriteIds', [] as number[])
```
and started using this global parameter as a number[] instead, we'd have a problem that
any users which opened the application before will already have strings in their browser
storage and so might get an error or lose their favorites.

We provide a way to declare migrations in state like so

```ts
const migration = migrationFactoryForType<AppParamsType>();

const AppMigrations = [
  // declare a migration for the favoriteIds
  migration('favoriteIds',
    // this migration applies when the favoriteIds is not empty and the first value is of type string
    values => values.length > 0 && typeof(values[0]) === 'string',
    // convert all values to an int
    values => values.map(v => parseInt(v)))
]
```

Now we can pass these migrations in to the parameter context

```tsx
return <ParameterContextProvider providers={param} migrations={AppMigrations}>...</ParameterContextProvider>
```

these migrations will run on initial render of the component and store the new migrated state for 
next time.

## State Helpers

This library provides implementations of `useLocalStorageState` and `useQueryParmeter`, because we found
existing libraries of mixed quality, but you are welcome to use your own hooks or other libraries as well. You can implement hooks that set data through APIs or custom reducers, but every parameter
should return a [state, setState] pair in the end.

Our implementation of useQueryParameter provides some encoders to specify how state is read/written
to the url. The hook syntax is `useQueryParameter(parameter name, default value, encoder, push?)`
Push specifies whether to push the parameter into the browser history stack so it will interact with browser forward/back buttons. Default is not to push.

We provide string/bool/number encoders as well as a `SimpleJsonEncoder` which stringifies JSON, and an `EfficientJsonEncoder` which stores only the delta between the current state and the default state.
The encoders can be wrapped with `wrapBase64Encoder(EfficientJsonEncoder)` to store the data base64
encoded strings which helps with some url encoding and size issues that come up around json syntax.

## Feedback and PRs Welcome

This library provided a useful abstraction here at Veson for our application development, so we wanted to share it more broadly with the community, but we are always trying to improve and welcome any feedback and PRs!
