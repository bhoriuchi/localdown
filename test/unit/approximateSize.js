import localdown from '../../index'

function approx (start, end, done) {
  let down = localdown(location)
  down.open({ createIfMissing: true }, (error) => {
    if (error) return done(error)
    return down.approximateSize(start, end, (error, size) => {
      if (error) return done(error)
      console.log(size)
      return down.close((error) => {
        if (error) return done(error)
        return done()
      })
    })
  })
}

export default function testApprox () {
  describe('Test approximateSize method', () => {
    it('Should approximate', (done) => {
      approx('r', 'batch4', done)
    })
  })
}