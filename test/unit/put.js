import localdown from '../../index'

function putRecord (key, value, done) {
  let down = localdown(location)
  down.open({ createIfMissing: true }, (error) => {
    if (error) return done(error)
    return down.put(key, value, (error) => {
      if (error) return done(error)
      return down.close((error) => {
        if (error) return done(error)
        return done()
      })
    })
  })
}

export default function testPut () {
  describe('Test put method', () => {
    it('Should put a STRING record into the table', (done) => {
      putRecord('value', 'putRecord', done)
    })

    it('Should put a BINARY record into the table', (done) => {
      putRecord('BIN', new Buffer('putRecordBinary'), done)
    })

    it('Should put an Object value into the table', done => {
      putRecord('obj', JSON.stringify({ obj: true }), done)
    })
  })
}