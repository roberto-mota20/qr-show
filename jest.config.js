const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Caminho para o seu app Next.js
  dir: './',
})

// Configurações personalizadas
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Lidar com imports absolutos se houver
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/pages/(.*)$': '<rootDir>/pages/$1',
  }
}

// createJestConfig é exportado dessa forma para carregar o next.config.js async
module.exports = createJestConfig(customJestConfig)