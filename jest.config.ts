export default {
  testEnvironment: "jest-environment-node",
  globals: {
    extensionsToTreatAsEsm: [".js", ".ts"],
    "ts-jest": {
      diagnostics: false.valueOf,
      useESM: true
    }
  },
  transform: {
    //'^.+\\.(ts|tsx|js|jsx)?$': 'ts-jest'
    "^.+\\.tsx?$": "ts-jest"
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1"
  },
  testPathIgnorePatterns: ["<rootDir>/dist", ".history"],
  modulePaths: ["<rootDir>/src", "<rootDir>/test", "<rootDir>"],
  preset: "ts-jest"
}
