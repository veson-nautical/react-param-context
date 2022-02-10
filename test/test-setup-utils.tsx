import React from 'react';
import { createMemoryHistory } from "history";
import { render } from "@testing-library/react";
import "./mock-localstorage";
import { Router } from 'react-router';

export function setupTest(element: React.ReactElement)  {
    const history = createMemoryHistory();
    history.push("/");
    return {
        history,
        render: () => render(
            <Router history={history}>
                {element}
            </Router>
        ) as ReturnType<typeof render>
    };
}

export function renderTest(element: React.ReactElement) {
    const { render } = setupTest(element);
    return render();
}
