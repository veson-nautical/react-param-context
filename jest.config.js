module.exports = {
    roots: ["test"],
    transform: {
        "\\.(ts|tsx)$": "ts-jest"
    },
    testEnvironment: "jest-environment-jsdom",
    testRegex: "/test/.*\\.(test|spec)\\.(ts|tsx|js)$",
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js"
    ],
    collectCoverageFrom: ["src/**/*.(ts|tsx)"],
    globals: {
        "ts-jest": {
            packageJson: "package.json",
            tsconfig: {
                allowJs: true
            }
        }
    }
};
