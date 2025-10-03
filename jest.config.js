module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  preset: 'ts-jest',
  roots: ['<rootDir>/test'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  maxWorkers: 1,
  testTimeout: 60000,
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  }
}
