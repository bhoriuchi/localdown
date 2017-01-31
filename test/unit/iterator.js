import localdown from '../../index'

function iteratorTest (options, nexts, done) {
  let nextCount = 0
  let down = localdown(location)

  let cleanup = (error, iter) => {
    return iter.end((err) => {
      if (err) done(err)
      return down.close(() => {
        return done(error)
      })
    })
  }

  down.open({ createIfMissing: true }, (error) => {
    if (error) return done(error)
    let i = down.iterator(options)

    let cb = (error, value) => {
      nextCount++
      if (error) return cleanup(error, i)
      if (value === undefined) return cleanup(null, i)
      if (nextCount >= nexts) return cleanup(null, i)
      console.log(value)
      i.next(cb)
    }

    return i.next(cb)
  })
}

export default function testIterator () {
  describe('Test iterator', () => {
    it('Should iterate through a simple query', (done) => {
      iteratorTest({ keyAsBuffer: false, valueAsBuffer: false }, 10, done)
    })

    it('Should iterate through a complex query', (done) => {
      iteratorTest({
        keyAsBuffer: false,
        valueAsBuffer: false,
        gt: 'batch3'
      }, 10, done)
    })
  })
}