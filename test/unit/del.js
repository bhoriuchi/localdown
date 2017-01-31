import localdown from '../../index'

function delRecord (key, done) {
  let down = localdown(location)
  down.open({ createIfMissing: true }, (error) => {
    if (error) return done(error)
    return down.del(key, (error) => {
      if (error) return done(error)
      return down.close((error) => {
        if (error) return done(error)
        return done()
      })
    })
  })
}

export default function testDel () {
  describe('Test del method', () => {
    it('Should delete a key', (done) => {
      delRecord('BIN', done)
    })
  })
}