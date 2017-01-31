import chai from 'chai'
import unitTests from './unit/index'
global.chai = chai
global.expect = chai.expect
global.location = 'localdown'

// run tests
describe('LocalDOWN Tests', () => {
  unitTests()
})
