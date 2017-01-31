import localdown from '../../index'

function testOpenClose (done) {
  let down = localdown(location)
  down.open({ createIfMissing: true }, (error) => {
    if (error) return done(error)
    return down.close(done)
  })
}

function testErrorIfExists (done) {
  let down = localdown(location)
  down.open({ errorIfExists: true }, (error) => {
    if (error) return done()
    return down.close(() => {
      done(new Error('did not throw error when table exists'))
    })
  })
}

export default function testOpen () {
  describe('Test open method', () => {
    // open and close test
    it('Should open the database', (done) => {
      return testOpenClose(done)
    })

    // errorIfExists test
    it('Should throw errorIfExists', (done) => {
      return testErrorIfExists(done)
    })
  })
}