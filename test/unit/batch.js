import localdown from '../../index'

function batchRecord (ops, done) {
  let down = localdown(location)
  down.open({ createIfMissing: true }, (error) => {
    if (error) return done(error)
    return down.batch(ops, (error) => {
      if (error) return done(error)
      return down.close((error) => {
        if (error) return done(error)
        return done()
      })
    })
  })
}

const ops1 = [
  { type: 'put', key: 'batch1', value: 'b1value' },
  { type: 'put', key: 'batch2', value: 'b2value' },
  { type: 'put', key: 'batch3', value: 'b3value' }
]

const ops2 = [
  { type: 'put', key: 'batch4', value: 'b4value' },
  { type: 'del', key: 'batch1' },
  { type: 'del', key: 'batch2' }
]

export default function testBatch () {
  describe('Test batch method', () => {
    it('Should batch add', (done) => {
      batchRecord(ops1, done)
    })
    it('Should batch add and del', (done) => {
      batchRecord(ops2, done)
    })
  })
}