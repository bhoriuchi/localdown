import testOpen from './open'
import testPut from './put'
import testGet from './get'
import testDel from './del'
import testBatch from './batch'
import testIterator from './iterator'
import testApproximateSize from './approximateSize'

export default function unitTests () {
  describe('Unit Tests', () => {
    testOpen()
    testPut()
    testGet()
    testDel()
    testBatch()
    testIterator()
    testApproximateSize()
  })
}