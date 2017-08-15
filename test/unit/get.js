import localdown from '../../index'

function getRecord (key, val, asBuffer, done) {
  let down = localdown(location)
  down.open({ createIfMissing: true }, (error) => {
    if (error) return done(error)
    return down.get(key, { asBuffer }, (error, value) => {
      if (error) return done(error)

      if (asBuffer) {
        if (!Buffer.isBuffer(value)) return done(new Error('value is not a buffer'))
        expect(value.toString()).to.equal(val)
      } else {
        expect(value).to.equal(val)
      }

      return down.close((error) => {
        if (error) return done(error)
        return done()
      })
    })
  })
}

export default function testGet () {
  describe('Test get method', () => {
    it('Should get a STRING', (done) => {
      getRecord('value', 'putRecord', false, done)
    })

    it('Should get a BINARY', (done) => {
      getRecord('value', 'putRecord', true, done)
    })

    it('Should get a BINARY as STRING', (done) => {
      getRecord('BIN', 'putRecordBinary', false, done)
    })

    it('Should get an object', done => {
      getRecord('obj', JSON.stringify({ obj: true }), false, done)
    })
  })
}